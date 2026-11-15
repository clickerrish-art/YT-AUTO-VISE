import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publishInstagramReel, verifyInstagramBusinessAccount, reconcileInstagramReel } from "./meta-instagram-reel-adapter.mjs";
import { publishInstagramImagePost, reconcileInstagramImagePost } from "./meta-instagram-image-adapter.mjs";
import { evaluateFinalFacebookPayload } from "./facebook-policy-engine.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ID = /^\d{5,30}$/;
export const INSTAGRAM_POLICY_VERSION = "nature-frontiers-instagram-policy-2026-11-v1";
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const iso = value => new Date(value).toISOString();
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));

function approvalBody(receipt) {
  return {
    decision:receipt.decision, reviewer:receipt.reviewer, reason:receipt.reason,
    reviewedAt:receipt.reviewedAt, payloadFingerprint:receipt.payloadFingerprint,
    sourcePayloadFingerprint:receipt.sourcePayloadFingerprint,
    instagramAccountId:receipt.instagramAccountId, facebookPageId:receipt.facebookPageId,
    policyVersion:receipt.policyVersion
  };
}
export function instagramApprovalFingerprint(payload) {
  const source = payload?.sourcePayload;
  return sha256(JSON.stringify({
    destination:payload?.destination, slotId:payload?.slotId, scheduledAt:payload?.scheduledAt,
    timezone:payload?.timezone, mediaType:payload?.mediaType, caption:payload?.caption,
    media:payload?.media, claims:payload?.claims ?? [],
    shareToFeed:payload?.shareToFeed !== false, instagramAccountId:payload?.instagramAccountId,
    facebookPageId:payload?.facebookPageId, sourcePayloadFingerprint:source ? sha256(JSON.stringify(source)) : null
  }));
}
export function createInstagramApprovalReceipt(payload, { reviewer, reason, secret, now = new Date().toISOString() } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Exact Instagram final payload is required");
  if (typeof secret !== "string" || Buffer.byteLength(secret,"utf8") < 32) throw new Error("INSTAGRAM_APPROVAL_HMAC_SECRET must contain at least 32 bytes");
  if (typeof reviewer !== "string" || reviewer.trim().length < 2 || reviewer.length > 120) throw new Error("Authenticated Instagram reviewer identity is required");
  if (typeof reason !== "string" || reason.trim().length < 3 || reason.length > 1000) throw new Error("Instagram approval reason is required");
  if (!Number.isFinite(Date.parse(now)) || !/(Z|[+-]\d{2}:\d{2})$/.test(now)) throw new Error("Instagram approval timestamp must include an explicit timezone");
  const body = {
    decision:"APPROVE", reviewer:reviewer.trim(), reason:reason.trim(), reviewedAt:now,
    payloadFingerprint:instagramApprovalFingerprint(payload),
    sourcePayloadFingerprint:payload.sourcePayload ? sha256(JSON.stringify(payload.sourcePayload)) : null,
    instagramAccountId:payload.instagramAccountId, facebookPageId:payload.facebookPageId,
    policyVersion:INSTAGRAM_POLICY_VERSION
  };
  return Object.freeze({...body,signature:crypto.createHmac("sha256",secret).update(JSON.stringify(body)).digest("hex")});
}
export function verifyInstagramApprovalReceipt(payload, { secret, now = new Date().toISOString() } = {}) {
  const errors=[], approval=payload?.approval;
  if (!approval || typeof approval !== "object" || Array.isArray(approval)) return {valid:false,errors:["Signed Instagram human approval receipt is missing"]};
  if (approval.decision !== "APPROVE") errors.push("Instagram approval decision must be APPROVE");
  if (typeof approval.reviewer !== "string" || approval.reviewer.trim().length < 2) errors.push("Instagram approval reviewer is missing");
  if (typeof approval.reason !== "string" || approval.reason.trim().length < 3) errors.push("Instagram approval reason is missing");
  if (!Number.isFinite(Date.parse(approval.reviewedAt)) || !/(Z|[+-]\d{2}:\d{2})$/.test(String(approval.reviewedAt))) errors.push("Instagram approval timestamp is invalid");
  else if (Date.parse(approval.reviewedAt) > Date.parse(now) + 5*60_000) errors.push("Instagram approval cannot be future-dated");
  if (approval.payloadFingerprint !== instagramApprovalFingerprint(payload)) errors.push("Instagram approval does not bind the exact account, schedule, caption and media payload");
  if (approval.sourcePayloadFingerprint !== (payload.sourcePayload ? sha256(JSON.stringify(payload.sourcePayload)) : null)) errors.push("Instagram approval does not bind the exact Facebook policy-approved source payload");
  if (approval.instagramAccountId !== payload.instagramAccountId || approval.facebookPageId !== payload.facebookPageId) errors.push("Instagram approval target account or linked Page does not match the payload");
  if (approval.policyVersion !== INSTAGRAM_POLICY_VERSION) errors.push("Instagram approval was created for a different policy version");
  if (typeof secret !== "string" || Buffer.byteLength(secret,"utf8") < 32) errors.push("INSTAGRAM_APPROVAL_HMAC_SECRET is missing or too short");
  else if (typeof approval.signature !== "string" || !/^[a-f0-9]{64}$/.test(approval.signature)) errors.push("Instagram approval signature is missing or malformed");
  else {
    const expected=crypto.createHmac("sha256",secret).update(JSON.stringify(approvalBody(approval))).digest();
    const supplied=Buffer.from(approval.signature,"hex");
    if (supplied.length!==expected.length || !crypto.timingSafeEqual(supplied,expected)) errors.push("Instagram approval signature is invalid");
  }
  return {valid:errors.length===0,errors};
}
function atomicJson(file,value) {
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  const temp=file+"."+process.pid+"."+crypto.randomBytes(6).toString("hex")+".tmp";
  const fd=fs.openSync(temp,"wx",0o600);
  try { fs.writeFileSync(fd,JSON.stringify(value,null,2)+"\n","utf8"); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(temp,file);
}
function lock(file) {
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  const fd=fs.openSync(file,"wx",0o600);
  fs.writeFileSync(fd,JSON.stringify({pid:process.pid,acquiredAt:new Date().toISOString()}));
  fs.fsyncSync(fd);
  const owned=fs.fstatSync(fd);
  return () => {
    try { fs.closeSync(fd); } catch {}
    try { const current=fs.lstatSync(file); if(current.isFile()&&!current.isSymbolicLink()&&current.dev===owned.dev&&current.ino===owned.ino) fs.unlinkSync(file); } catch {}
  };
}
function safeStatePath(stateDir,name) {
  if(typeof name!=="string"||!name||path.isAbsolute(name)||name.includes("\\")||name.split("/").some(x=>!x||x==="."||x==="..")) throw new Error("Unsafe Instagram state filename");
  const base=fs.realpathSync(stateDir), target=path.resolve(base,name);
  if(!target.startsWith(base+path.sep)) throw new Error("Instagram state path escapes durable state directory");
  const check=fs.existsSync(target)?fs.realpathSync(target):fs.realpathSync(path.dirname(target));
  if(check!==base&&!check.startsWith(base+path.sep)) throw new Error("Instagram state symlink escapes durable state directory");
  return target;
}
function localDate(now,timezone) {
  return new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(now));
}

/**
 * Separate Instagram dispatch worker. Instagram API publishing is immediate, so it
 * only publishes inside a narrow post-time window; it does not pretend to schedule.
 * Queue records require a signed Instagram-specific approval and an independently
 * policy-eligible Facebook source payload with the exact same caption and media hash.
 */
export async function runAutonomousInstagramPublisher({
  configPath=path.join(root,"config/instagram-publishing.json"),
  queuePath=path.join(root,"content/instagram-autonomous-queue.json"),
  stateDir=process.env.FACEBOOK_STATE_DIR, env=process.env, rootDir=root,
  fetchImpl=fetch, now=Date.now(), verifyAccount=verifyInstagramBusinessAccount,
  publish=publishInstagramReel, publishImage=publishInstagramImagePost, reconcile=reconcileInstagramReel, reconcileImage=reconcileInstagramImagePost,
  policyEvaluator=evaluateFinalFacebookPayload
}={}) {
  const config=readJson(configPath);
  if(config?.emergencyStop!==false||config?.publishingEnabled!==true||config?.dryRun!==false||
     env.INSTAGRAM_PUBLISH_ENABLED!=="YES") {
    return {status:"SAFE_NOOP",reason:"INSTAGRAM_PUBLISHING_DISABLED_DRY_RUN_OR_EMERGENCY_STOP_ACTIVE",published:0,skipped:0};
  }
  if(typeof stateDir!=="string"||!path.isAbsolute(stateDir)) throw new Error("FACEBOOK_STATE_DIR must be an absolute durable operator-controlled directory");
  if(!ID.test(String(config.instagramBusinessAccountId??""))||!ID.test(String(config.facebookPageId??""))) throw new Error("Owner-verified Instagram account ID and linked Facebook Page ID are required");
  if(env.NATURE_FRONTIERS_INSTAGRAM_ACCOUNT_ID!==config.instagramBusinessAccountId) throw new Error("Runtime Instagram account ID must exactly match secure configuration");
  if(env.NATURE_FRONTIERS_FACEBOOK_PAGE_ID!==config.facebookPageId) throw new Error("Runtime linked Page ID must exactly match secure configuration");
  if(typeof env.META_USER_ACCESS_TOKEN!=="string"||env.META_USER_ACCESS_TOKEN.length<20) throw new Error("Meta user access token is missing from the secure runtime environment");
  if(typeof env.INSTAGRAM_APPROVAL_HMAC_SECRET!=="string"||Buffer.byteLength(env.INSTAGRAM_APPROVAL_HMAC_SECRET,"utf8")<32) throw new Error("Instagram approval signing secret is missing or too short");
  if(config.destination!=="nature_frontiers_instagram"||config.timezone!=="Africa/Johannesburg") throw new Error("Instagram destination/timezone configuration is invalid");
  fs.mkdirSync(stateDir,{recursive:true,mode:0o700});
  const canonicalRoot=fs.realpathSync(rootDir), canonicalState=fs.realpathSync(stateDir);
  const within=(candidate,base)=>candidate===base||candidate.startsWith(base+path.sep);
  const q=path.resolve(rootDir,queuePath);
  if(!within(q,canonicalRoot)&&!within(q,canonicalState)) throw new Error("Instagram queue path escapes approved repository/state roots");
  if(!fs.existsSync(q)) throw new Error("Instagram autonomous queue is missing");
  const queueFile=fs.realpathSync(q);
  if(!within(queueFile,canonicalRoot)&&!within(queueFile,canonicalState)) throw new Error("Instagram queue symlink escapes approved roots");
  const ledgerFile=safeStatePath(stateDir,"instagram-attempt-ledger.json");
  const historyFile=safeStatePath(stateDir,"instagram-history.json");
  const lockFile=safeStatePath(stateDir,"instagram-publishing.lock");
  const facebookHistoryFile=safeStatePath(stateDir,"facebook-history.json");
  const release=lock(lockFile);
  try {
    let queue=readJson(queueFile), ledger=fs.existsSync(ledgerFile)?readJson(ledgerFile):[];
    let history=fs.existsSync(historyFile)?readJson(historyFile):[];
    const facebookHistory=fs.existsSync(facebookHistoryFile)?readJson(facebookHistoryFile):[];
    if(!Array.isArray(queue)||!Array.isArray(ledger)||!Array.isArray(history)||!Array.isArray(facebookHistory)) throw new Error("Instagram queue or durable history is malformed; publishing blocked");
    const nowMs=Number(now), nowIso=iso(nowMs);
    const updateAttempt=(slotId,patch)=>{
      const i=ledger.findIndex(x=>x.slotId===slotId);
      if(i<0) throw new Error("Instagram attempt ledger entry disappeared");
      ledger[i]={...ledger[i],...patch}; atomicJson(ledgerFile,ledger);
    };
    const unresolved=ledger.some(x=>x&&["PUBLISHING","UPLOADING","UNCERTAIN"].includes(x.status));
    let accountResult=null;
    if(queue.length||unresolved) {
      accountResult=await verifyAccount({
        instagramAccountId:config.instagramBusinessAccountId,expectedInstagramAccountId:config.instagramBusinessAccountId,
        facebookPageId:config.facebookPageId,expectedFacebookPageId:config.facebookPageId,
        accessToken:env.META_USER_ACCESS_TOKEN,apiVersion:config.apiVersion,fetchImpl
      });
      if(accountResult?.verified!==true||accountResult.instagramAccountId!==config.instagramBusinessAccountId||accountResult.facebookPageId!==config.facebookPageId) {
        throw new Error("Exact Instagram account, required permissions and linked Nature Frontiers Page were not verified");
      }
    }
    // Reconcile prior remote attempts first. A missing media ID is unresolved and never retried.
    for(let i=0;i<ledger.length;i++) {
      const prior=ledger[i];
      if(!prior||!["PUBLISHING","UPLOADING","UNCERTAIN"].includes(prior.status)) continue;
      if(prior.status!=="UNCERTAIN") { ledger[i]={...prior,status:"UNCERTAIN",retryAllowed:false,reason:"PROCESS_RESTARTED_DURING_INSTAGRAM_MUTATION"}; atomicJson(ledgerFile,ledger); }
      const current=ledger[i];
      const reconcileAttempt=current.kind==="INSTAGRAM_IMAGE_PUBLISH_ATTEMPT"?reconcileImage:reconcile;
      const result=await reconcileAttempt({
        mediaId:current.remoteMediaId??null,containerId:current.remoteContainerId??null,
        instagramAccountId:config.instagramBusinessAccountId,expectedInstagramAccountId:config.instagramBusinessAccountId,
        accessToken:env.META_USER_ACCESS_TOKEN,apiVersion:config.apiVersion,fetchImpl
      });
      if(result?.outcome==="CONFIRMED"&&result.receipt?.status==="PUBLISHED_VERIFIED") {
        ledger[i]={...current,status:"PUBLISHED_VERIFIED",completedAt:nowIso,reconciliation:result,retryAllowed:false};
        history.push({...ledger[i],payload:undefined});
      } else {
        ledger[i]={...current,status:"UNCERTAIN",reconciliation:result,retryAllowed:false,reason:result?.reason??"INSTAGRAM_OUTCOME_UNRESOLVED_NO_RETRY"};
      }
      atomicJson(ledgerFile,ledger); atomicJson(historyFile,history);
    }

    let published=0,skipped=0;
    const keep=[];
    for(const payload of queue) {
      if(!payload||typeof payload!=="object"||payload.destination!=="nature_frontiers_instagram"||
         payload.instagramAccountId!==config.instagramBusinessAccountId||payload.facebookPageId!==config.facebookPageId||
         payload.timezone!==config.timezone||typeof payload.slotId!=="string"||!payload.slotId) {
        history.push({slotId:payload?.slotId??null,status:"BLOCKED_MALFORMED_OR_WRONG_DESTINATION",checkedAt:nowIso}); skipped++; continue;
      }
      const scheduled=Date.parse(payload.scheduledAt);
      if(!Number.isFinite(scheduled)) { history.push({slotId:payload.slotId,status:"BLOCKED_INVALID_SCHEDULE",checkedAt:nowIso}); skipped++; continue; }
      if(nowMs<scheduled) { keep.push(payload); continue; }
      if(nowMs>scheduled+5*60_000) { history.push({slotId:payload.slotId,status:"SKIPPED_MISSED_SLOT",checkedAt:nowIso,reason:"INSTAGRAM_IMMEDIATE_PUBLISH_WINDOW_EXPIRED"}); skipped++; continue; }
      if(history.some(x=>x.slotId===payload.slotId)||ledger.some(x=>x.slotId===payload.slotId)) { skipped++; continue; }
      const today=localDate(nowMs,config.timezone);
      const todays=history.filter(x=>x.status==="PUBLISHED_VERIFIED"&&localDate(Date.parse(x.publishedAt??x.completedAt??""),config.timezone)===today);
      const reelsToday=todays.filter(x=>x.mediaType==="reel").length;
      const feedToday=todays.filter(x=>x.mediaType==="feed_post").length;
      if(payload.mediaType==="reel"&&reelsToday>=2) { history.push({slotId:payload.slotId,status:"BLOCKED_DAILY_REEL_CAP",checkedAt:nowIso}); skipped++; continue; }
      if(payload.mediaType==="feed_post"&&feedToday>=1) { history.push({slotId:payload.slotId,status:"BLOCKED_DAILY_FEED_CAP",checkedAt:nowIso}); skipped++; continue; }
      const previousTimes=todays.map(x=>Date.parse(x.publishedAt??x.completedAt??"")).filter(Number.isFinite);
      if(previousTimes.some(x=>nowMs-x<4*60*60_000)) { history.push({slotId:payload.slotId,status:"BLOCKED_MINIMUM_INTERVAL",checkedAt:nowIso}); skipped++; continue; }
      const isReel=payload.mediaType==="reel",isFeed=payload.mediaType==="feed_post";
      if((!isReel&&!isFeed)||!payload.media||typeof payload.media.path!=="string"||!/^[a-f0-9]{64}$/.test(payload.media.sha256??"")||
         (isFeed&&(typeof payload.media.url!=="string"||!payload.media.url.startsWith("https://")))) {
        history.push({slotId:payload.slotId,status:"BLOCKED_UNSUPPORTED_OR_UNPINNED_MEDIA",checkedAt:nowIso}); skipped++; continue;
      }
      if(isReel&&config.facebookLoginForBusinessEnabled!==true) {
        history.push({slotId:payload.slotId,status:"BLOCKED_RESUMABLE_UPLOAD_CAPABILITY_UNVERIFIED",checkedAt:nowIso}); skipped++; continue;
      }
      if(isFeed&&(!Array.isArray(config.allowedImageDomains)||!config.allowedImageDomains.length)) {
        history.push({slotId:payload.slotId,status:"BLOCKED_PUBLIC_IMAGE_HOST_NOT_ALLOWLISTED",checkedAt:nowIso}); skipped++; continue;
      }
      if(typeof payload.caption!=="string"||!payload.caption.trim()||payload.sourcePayload?.caption!==payload.caption||payload.sourcePayload?.mediaType!==payload.mediaType||
         !Array.isArray(payload.sourcePayload?.media)||!payload.sourcePayload.media.some(x=>x?.sha256===payload.media.sha256&&x?.path===payload.media.path)) {
        history.push({slotId:payload.slotId,status:"BLOCKED_SOURCE_PAYLOAD_MISMATCH",checkedAt:nowIso}); skipped++; continue;
      }
      const approval=verifyInstagramApprovalReceipt(payload,{secret:env.INSTAGRAM_APPROVAL_HMAC_SECRET,now:nowIso});
      if(!approval.valid) { history.push({slotId:payload.slotId,status:"BLOCKED_INSTAGRAM_APPROVAL",checkedAt:nowIso,blockers:approval.errors}); skipped++; continue; }
      const decision=await policyEvaluator(payload.sourcePayload,{
        expectedPageId:config.facebookPageId,expectedPageName:config.facebookPageName??"Nature Frontiers SA",
        history:[],evidenceRoot:rootDir,now:nowIso,timezone:config.timezone,maxPostsPerLocalDay:999,
        maxReelsPerLocalDay:999,maxFeedPostsPerLocalDay:999,minimumIntervalMinutes:0,fetchImpl
      });
      if(decision?.eligible!==true) { history.push({slotId:payload.slotId,status:"BLOCKED_SOURCE_POLICY",checkedAt:nowIso,policyDecision:decision}); skipped++; continue; }

      const attempt={kind:isReel?"INSTAGRAM_REEL_PUBLISH_ATTEMPT":"INSTAGRAM_IMAGE_PUBLISH_ATTEMPT",slotId:payload.slotId,destination:"nature_frontiers_instagram",
        status:"PUBLISHING",startedAt:nowIso,scheduledAt:payload.scheduledAt,mediaType:payload.mediaType,
        contentFingerprint:approval.payloadFingerprint??instagramApprovalFingerprint(payload),
        sourcePolicyDecision:decision,remoteContainerId:null,remoteMediaId:null,retryAllowed:false};
      ledger.push(attempt); atomicJson(ledgerFile,ledger);
      try {
        const common={
          instagramAccountId:config.instagramBusinessAccountId,expectedInstagramAccountId:config.instagramBusinessAccountId,
          accessToken:env.META_USER_ACCESS_TOKEN,apiVersion:config.apiVersion,accountVerified:true,
          approvalVerified:true,publishingEnabled:true,dryRun:false,emergencyStop:false,fetchImpl,
          onContainerId:async info=>updateAttempt(payload.slotId,{status:"UPLOADING",remoteContainerId:info.containerId,containerCreatedAt:info.createdAt}),
          onMediaId:async info=>updateAttempt(payload.slotId,{status:"PUBLISHING",remoteMediaId:info.mediaId,remotePublishedAt:info.publishedAt})
        };
        const receipt=isReel
          ? await publish({draft:{kind:"INSTAGRAM_REEL_DRAFT",caption:payload.caption,media:payload.media},
              ...common,resumableUploadSupported:true,shareToFeed:payload.shareToFeed!==false,rootDir})
          : await publishImage({draft:{kind:"INSTAGRAM_IMAGE_DRAFT",caption:payload.caption,media:{url:payload.media.url,sha256:payload.media.sha256,altText:payload.media.altText}},
              ...common,allowedImageDomains:config.allowedImageDomains??[]});
        if(receipt?.status!=="PUBLISHED_VERIFIED"||receipt.verifiedRemotely!==true||!receipt.mediaId) throw new Error("Instagram adapter did not return a remotely verified publication receipt");
        const final={...ledger.find(x=>x.slotId===payload.slotId),status:"PUBLISHED_VERIFIED",completedAt:nowIso,
          remoteMediaId:receipt.mediaId,remoteContainerId:receipt.containerId,permalink:receipt.permalink,
          publishedAt:receipt.publishedAt??nowIso,verifiedRemotely:true,retryAllowed:false};
        updateAttempt(payload.slotId,final);
        history.push({...final,payload:undefined});
        atomicJson(historyFile,history); published++;
      } catch(error) {
        const uncertain=error?.uncertain===true;
        updateAttempt(payload.slotId,{status:uncertain?"UNCERTAIN":"BLOCKED",reason:uncertain?"INSTAGRAM_MUTATION_OUTCOME_UNCERTAIN_NO_RETRY":"INSTAGRAM_PUBLISH_REJECTED_BEFORE_CONFIRMED_COMPLETION",
          remoteContainerId:error?.containerId??ledger.find(x=>x.slotId===payload.slotId)?.remoteContainerId??null,
          remoteMediaId:error?.mediaId??ledger.find(x=>x.slotId===payload.slotId)?.remoteMediaId??null,retryAllowed:false});
        history.push({...ledger.find(x=>x.slotId===payload.slotId),payload:undefined});
        atomicJson(historyFile,history); skipped++;
      }
    }
    atomicJson(queueFile,keep); atomicJson(ledgerFile,ledger); atomicJson(historyFile,history);
    return {status:"COMPLETED",published,skipped,queueCount:keep.length,accountVerified:accountResult?.verified===true};
  } finally { release(); }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const result=await runAutonomousInstagramPublisher();
    console.log(JSON.stringify(result,null,2));
  } catch(error) {
    console.error("BLOCKED: Instagram publisher stopped safely:",error instanceof Error?error.message:"unknown error");
    process.exitCode=1;
  }
}
