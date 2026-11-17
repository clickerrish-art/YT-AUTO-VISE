#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHA256 = /^[a-f0-9]{64}$/;
const ALLOWED_TYPES = new Set(["wildlife_photo", "animal_fact", "wildlife_text"]);
const https = value => {
  try { const u = new URL(value); return u.protocol === "https:" && !!u.hostname && !u.username && !u.password; }
  catch { return false; }
};
const localDate = (iso, timezone) => new Intl.DateTimeFormat("en-CA", {
  timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit"
}).format(new Date(iso));
const weekKey = (iso, timezone) => {
  const date = new Date(localDate(iso, timezone) + "T12:00:00Z");
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
};

export function validateInterstitialCandidate(item) {
  const errors = [];
  if (!item || typeof item !== "object" || Array.isArray(item)) return ["candidate must be an object"];
  if (typeof item.id !== "string" || !/^[a-z0-9][a-z0-9-]{2,79}$/.test(item.id)) errors.push("invalid stable candidate id");
  if (!ALLOWED_TYPES.has(item.type)) errors.push("unsupported interstitial content type");
  if (typeof item.title !== "string" || !item.title.trim() || item.title.length > 120) errors.push("title is required and must be at most 120 characters");
  if (typeof item.caption !== "string" || !item.caption.trim() || item.caption.length > 2200) errors.push("caption is required and must be at most 2200 characters");
  if (item.brand !== "Nature Frontiers") errors.push("candidate must target Nature Frontiers only");
  if (item.original !== true) errors.push("originality must be explicitly verified");
  if (item.rights?.status !== "cleared" || !Array.isArray(item.rights?.evidence) || !item.rights.evidence.length || item.rights.evidence.some(x => !https(x))) errors.push("documented rights clearance is required");
  if (item.approval?.status !== "approved" || typeof item.approval?.reviewer !== "string" || !item.approval.reviewer.trim() || !https(item.approval?.receiptUrl)) errors.push("final human approval receipt is required");
  if (!Array.isArray(item.claims) || !item.claims.length || item.claims.some(c => typeof c?.text !== "string" || !c.text.trim() || !Array.isArray(c.sources) || !c.sources.length || c.sources.some(s => !https(s)))) errors.push("every factual claim needs one or more HTTPS sources");
  if (item.type === "wildlife_photo") {
    if (typeof item.media?.path !== "string" || !item.media.path.startsWith("media/nature-frontiers/") || item.media.path.includes("..")) errors.push("photo must be a repository-local Nature Frontiers media asset");
    if (!SHA256.test(item.media?.sha256 ?? "")) errors.push("photo SHA-256 is required");
    if (typeof item.media?.altText !== "string" || !item.media.altText.trim()) errors.push("accessible photo alt text is required");
  }
  if (item.type !== "wildlife_photo" && item.media != null) errors.push("text-only candidate must not carry a media file");
  if (item.status !== "approved") errors.push("candidate status must be approved");
  return errors;
}

export function buildInterstitialCalendar({ videos, candidates, now = new Date().toISOString(), timezone = "Africa/Johannesburg", maxPerWeek = 3, minGapHours = 12 } = {}) {
  if (!Array.isArray(videos) || !Array.isArray(candidates)) throw new Error("videos and candidates must be arrays");
  if (!Number.isFinite(Date.parse(now)) || !Number.isInteger(maxPerWeek) || maxPerWeek < 0 || maxPerWeek > 7 ||
      !Number.isFinite(minGapHours) || minGapHours < 6 || minGapHours > 72) throw new Error("invalid calendar limits or current timestamp");
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date(now)); } catch { throw new Error("invalid IANA timezone"); }
  const videoTimes = videos.map(v => {
    if (!v || v.brand !== "Nature Frontiers" || v.status !== "scheduled" || !Number.isFinite(Date.parse(v.scheduledAt))) throw new Error("only dated, scheduled Nature Frontiers videos can define interstitial gaps");
    return Date.parse(v.scheduledAt);
  }).sort((a,b)=>a-b);
  const decisions = [], accepted = [];
  const seenIds = new Set();
  for (const candidate of candidates) {
    const errors = validateInterstitialCandidate(candidate);
    if (seenIds.has(candidate?.id)) errors.push("duplicate candidate id");
    seenIds.add(candidate?.id);
    if (errors.length) decisions.push({ id: candidate?.id ?? null, status: "HELD", reasons: errors });
    else accepted.push(candidate);
  }
  const ordered = accepted.sort((a,b) => String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")) || a.id.localeCompare(b.id));
  const placements = [], usedIds = new Set(), dayCounts = new Map(), weekCounts = new Map();
  for (let i=0;i<videoTimes.length-1;i++) {
    const left=videoTimes[i], right=videoTimes[i+1];
    if (right-left < minGapHours*2*3600000) continue;
    const midpoint=Math.floor((left+right)/2);
    if (midpoint <= Date.parse(now)) continue;
    const date=localDate(new Date(midpoint).toISOString(),timezone), week=weekKey(new Date(midpoint).toISOString(),timezone);
    if (dayCounts.has(date) || (weekCounts.get(week)??0)>=maxPerWeek) continue;
    const candidate=ordered.find(x=>!usedIds.has(x.id) && (x.type==="wildlife_photo" ? !placements.some(p=>p.type==="wildlife_photo" && p.week===week) : true));
    if (!candidate) break;
    const instant=new Date(midpoint).toISOString();
    placements.push({ id:"nf-interstitial-"+candidate.id, candidateId:candidate.id, type:candidate.type, title:candidate.title,
      scheduledAt:instant, timezone, localDate:date, week, status:"PROPOSED_NOT_SCHEDULED",
      publishReady:false, media:candidate.media??null, caption:candidate.caption, claims:candidate.claims,
      rights:candidate.rights, approval:candidate.approval,
      blockers:["This is a proposal only; it has not been sent to Meta or Metricool.","Revalidate media hash, rights, claim sources, final approval receipt and duplicate history immediately before scheduling."] });
    usedIds.add(candidate.id); dayCounts.set(date,1); weekCounts.set(week,(weekCounts.get(week)??0)+1);
    decisions.push({id:candidate.id,status:"PROPOSED",scheduledAt:instant});
  }
  for (const candidate of ordered) if (!usedIds.has(candidate.id) && !decisions.some(d=>d.id===candidate.id)) decisions.push({id:candidate.id,status:"HELD",reasons:["No safe gap between scheduled videos within configured frequency limits."]});
  return { schemaVersion:"1.0.0", brand:"Nature Frontiers", timezone, generatedAt:now,
    policy:{ publishEnabled:false, maxPerWeek, minGapHours, noAutomatedEngagement:true, requireHumanApproval:true },
    videoCount:videos.length, placements, decisions };
}

function main() {
  const args=process.argv.slice(2), get=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
  const videosPath=path.resolve(root,get("--videos","content/nature-frontiers-video-calendar.json"));
  const candidatesPath=path.resolve(root,get("--candidates","content/nature-frontiers-interstitial-candidates.json"));
  const outputPath=path.resolve(root,get("--out","content/nature-frontiers-interstitial-plan.json"));
  for (const file of [videosPath,candidatesPath,outputPath]) if(file!==root&&!file.startsWith(root+path.sep)) throw new Error("input/output path escapes repository root");
  if(!fs.existsSync(videosPath)||!fs.existsSync(candidatesPath)) throw new Error("video calendar or candidate manifest is missing; no content will be invented");
  const plan=buildInterstitialCalendar({videos:JSON.parse(fs.readFileSync(videosPath,"utf8")),candidates:JSON.parse(fs.readFileSync(candidatesPath,"utf8"))});
  fs.mkdirSync(path.dirname(outputPath),{recursive:true});
  const temp=outputPath+"."+process.pid+".tmp",fd=fs.openSync(temp,"wx",0o600);
  try{fs.writeFileSync(fd,JSON.stringify(plan,null,2)+"\\n","utf8");fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  fs.renameSync(temp,outputPath);
  process.stdout.write(JSON.stringify({status:"OK",placements:plan.placements.length,held:plan.decisions.filter(x=>x.status==="HELD").length,outputPath: path.relative(root,outputPath)})+"\\n");
}
if(import.meta.url===new URL(process.argv[1]??"", "file://").href) main();
