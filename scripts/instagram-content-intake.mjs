import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidZonedIsoTimestamp } from "./schedule-policy.mjs";
import { evaluateFinalFacebookPayload } from "./facebook-policy-engine.mjs";
import { verifyInstagramApprovalReceipt } from "./instagram-autonomous-publisher.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const readJson=file=>JSON.parse(fs.readFileSync(file,"utf8"));
function atomicJson(file,value) {
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  const temp=file+"."+process.pid+".tmp";
  const fd=fs.openSync(temp,"wx",0o600);
  try { fs.writeFileSync(fd,JSON.stringify(value,null,2)+"\n","utf8");fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(temp,file);
}
function localPath(base,candidate,label) {
  if(typeof candidate!=="string"||!candidate||path.isAbsolute(candidate)||candidate.includes("\\")||
     candidate.split("/").some(x=>!x||x==="."||x==="..")) throw new Error(label+" path must be a safe repository-relative path");
  const canonical=fs.realpathSync(base),target=path.isAbsolute(candidate)?path.resolve(candidate):path.resolve(canonical,candidate);
  if(!target.startsWith(canonical+path.sep)) throw new Error(label+" path escapes repository root");
  const checked=fs.existsSync(target)?fs.realpathSync(target):fs.realpathSync(path.dirname(target));
  if(checked!==canonical&&!checked.startsWith(canonical+path.sep)) throw new Error(label+" symlink escapes repository root");
  return target;
}

/** Validate and enqueue exact, separately approved Instagram Reel payloads. No provider API is called. */
export async function runInstagramContentIntake({
  configPath=path.join(root,"config/instagram-publishing.json"),
  candidatePath=path.join(root,"content/instagram-intake-candidates.json"),
  queuePath=path.join(root,"content/instagram-autonomous-queue.json"),
  env=process.env,now=Date.now(),policyEvaluator=evaluateFinalFacebookPayload,rootDir=root
}={}) {
  const config=readJson(configPath);
  if(config.destination!=="nature_frontiers_instagram"||config.timezone!=="Africa/Johannesburg") throw new Error("Instagram intake destination/timezone configuration is invalid");
  if(typeof config.instagramBusinessAccountId!=="string"||!/^\d{5,30}$/.test(config.instagramBusinessAccountId)||
     typeof config.facebookPageId!=="string"||!/^\d{5,30}$/.test(config.facebookPageId)) {
    return {status:"BLOCKED_CONFIGURATION",accepted:0,blocked:0,reason:"OWNER_VERIFIED_INSTAGRAM_AND_LINKED_PAGE_IDS_REQUIRED"};
  }
  if(typeof env.INSTAGRAM_APPROVAL_HMAC_SECRET!=="string"||Buffer.byteLength(env.INSTAGRAM_APPROVAL_HMAC_SECRET,"utf8")<32)
    throw new Error("Instagram approval signing secret is missing or too short");
  if(!Number.isFinite(Number(now))) throw new Error("now must be a finite timestamp");
  const candidatesFile=localPath(rootDir,candidatePath,"Instagram candidate");
  const queueFile=localPath(rootDir,queuePath,"Instagram queue");
  if(!fs.existsSync(candidatesFile)) throw new Error("Instagram intake candidate file is missing; no content will be invented");
  if(!fs.existsSync(queueFile)) throw new Error("Instagram autonomous queue is missing; initialize it as an empty JSON array");
  const candidates=readJson(candidatesFile),queue=readJson(queueFile);
  if(!Array.isArray(candidates)||!Array.isArray(queue)) throw new Error("Instagram candidates and queue must be JSON arrays");
  const seen=new Set(queue.map(x=>x?.slotId).filter(Boolean));
  const decisions=[];let accepted=0,blocked=0,duplicate=0;
  for(const payload of candidates) {
    const reasons=[];
    if(!payload||typeof payload!=="object"||Array.isArray(payload)) reasons.push("CANDIDATE_MALFORMED");
    else {
      if(payload.destination!=="nature_frontiers_instagram") reasons.push("WRONG_INSTAGRAM_DESTINATION");
      if(payload.instagramAccountId!==config.instagramBusinessAccountId||payload.facebookPageId!==config.facebookPageId) reasons.push("ACCOUNT_OR_LINKED_PAGE_MISMATCH");
      if(payload.timezone!==config.timezone||!isValidZonedIsoTimestamp(payload.scheduledAt)||Date.parse(payload.scheduledAt)<=Number(now)) reasons.push("INVALID_OR_NON_FUTURE_JOHANNESBURG_SCHEDULE");
      if(payload.mediaType!=="reel"||!payload.media||typeof payload.media.path!=="string"||!/^[a-f0-9]{64}$/.test(payload.media.sha256??"")) reasons.push("UNSUPPORTED_OR_UNPINNED_INSTAGRAM_MEDIA");
      if(payload.shareToFeed!=null&&typeof payload.shareToFeed!=="boolean") reasons.push("INVALID_SHARE_TO_FEED_SETTING");
      if(typeof payload.caption!=="string"||!payload.caption.trim()||payload.sourcePayload?.caption!==payload.caption||
         payload.sourcePayload?.destination!=="nature_frontiers_facebook"||payload.sourcePayload?.destinationPageId!==config.facebookPageId||
         !Array.isArray(payload.sourcePayload?.media)||!payload.sourcePayload.media.some(x=>x?.path===payload.media?.path&&x?.sha256===payload.media?.sha256)) {
        reasons.push("FACEBOOK_SOURCE_PAYLOAD_OR_MEDIA_BINDING_MISMATCH");
      }
      const approval=verifyInstagramApprovalReceipt(payload,{secret:env.INSTAGRAM_APPROVAL_HMAC_SECRET,now:new Date(Number(now)).toISOString()});
      if(!approval.valid) reasons.push(...approval.errors);
      if(typeof payload.slotId!=="string"||!payload.slotId.trim()) reasons.push("DURABLE_SLOT_ID_REQUIRED");
      if(seen.has(payload.slotId)) { duplicate++; decisions.push({slotId:payload.slotId,accepted:false,reason:"DUPLICATE_SLOT"}); continue; }
      if(reasons.length===0) {
        const policy=await policyEvaluator(payload.sourcePayload,{
          expectedPageId:config.facebookPageId,expectedPageName:config.facebookPageName??"Nature Frontiers SA",
          history:[],evidenceRoot:rootDir,now:new Date(Number(now)).toISOString(),timezone:config.timezone,
          maxPostsPerLocalDay:999,maxReelsPerLocalDay:999,maxFeedPostsPerLocalDay:999,minimumIntervalMinutes:0
        });
        if(policy?.eligible!==true) reasons.push("SOURCE_PAYLOAD_POLICY_BLOCKED");
      }
    }
    if(reasons.length) { blocked++;decisions.push({slotId:payload?.slotId??null,accepted:false,reason:[...new Set(reasons)]});continue; }
    queue.push(payload);seen.add(payload.slotId);accepted++;
    decisions.push({slotId:payload.slotId,accepted:true,reason:"SIGNED_INSTAGRAM_APPROVAL_AND_SOURCE_POLICY_RECHECK_PASSED"});
  }
  atomicJson(queueFile,queue);
  return {status:"COMPLETED",candidateCount:candidates.length,accepted,blocked,duplicate,queueCount:queue.length,decisions};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await runInstagramContentIntake(),null,2)); }
  catch(error) { console.error("BLOCKED: Instagram intake stopped safely:",error instanceof Error?error.message:"unknown error");process.exitCode=1; }
}
