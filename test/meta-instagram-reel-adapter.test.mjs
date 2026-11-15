import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { publishInstagramReel, reconcileInstagramReel, verifyInstagramBusinessAccount, InstagramReelError } from "../scripts/meta-instagram-reel-adapter.mjs";

const token = "x".repeat(40), account = "123456789012345", root = fs.mkdtempSync(path.join(os.tmpdir(),"ig-reel-test-"));
const file = path.join(root,"reel.mp4"), bytes = Buffer.from("test-video-bytes");
fs.writeFileSync(file,bytes);
const draft = { kind:"INSTAGRAM_REEL_DRAFT", caption:"Educational wildlife Reel.", media:{path:"reel.mp4",sha256:crypto.createHash("sha256").update(bytes).digest("hex")} };
const media = { width:1080,height:1920,durationSeconds:55,frameRate:30 };
const ok = (data,status=200) => ({ ok:status>=200&&status<300,status,json:async()=>data });
const run = (fetchImpl, extra={}) => publishInstagramReel({ draft,instagramAccountId:account,expectedInstagramAccountId:account,accessToken:token,
  accountVerified:true,approvalVerified:true,publishingEnabled:true,dryRun:false,emergencyStop:false,rootDir:root,inspect:()=>media,fetchImpl,...extra });

test("Instagram Reel uses resumable container upload, bounded processing, publish and remote read-back",async()=>{
  const calls=[],persisted=[];
  const result=await run(async(url,options={})=>{
    calls.push({url:String(url),method:options.method});
    if(String(url).endsWith("/media")&&options.method==="POST") return ok({id:"123456789012346"});
    if(String(url).includes("rupload.facebook.com")) return ok({success:true});
    if(String(url).includes("status_code")) return ok({id:"123456789012346",status_code:"FINISHED"});
    if(String(url).endsWith("/media_publish")) return ok({id:"123456789012347"});
    if(String(url).includes("fields=id,media_type,permalink,timestamp")) return ok({id:"123456789012347",media_type:"REELS",permalink:"https://www.instagram.com/reel/abc/",timestamp:"2026-11-15T10:00:00+0000"});
    throw new Error("unexpected endpoint "+url);
  },{onContainerId:async x=>persisted.push(x.containerId),onMediaId:async x=>persisted.push(x.mediaId)});
  assert.equal(result.status,"PUBLISHED_VERIFIED");
  assert.deepEqual(persisted,["123456789012346","123456789012347"]);
  assert.equal(calls.filter(x=>x.method==="POST").length,3);
});

test("safe defaults and missing exact approval stop before the first provider call",async()=>{
  let calls=0;
  await assert.rejects(()=>publishInstagramReel({draft,instagramAccountId:account,expectedInstagramAccountId:account,accessToken:token,
    rootDir:root,inspect:()=>media,fetchImpl:async()=>{calls++;return ok({});}}),/not verified|approval/i);
  assert.equal(calls,0);
});

test("container ID is durably recorded before binary upload and callback failure prevents upload",async()=>{
  let uploads=0;
  await assert.rejects(()=>run(async(url,options={})=>{
    if(String(url).endsWith("/media")) return ok({id:"123456789012346"});
    if(String(url).includes("rupload")) uploads++;
    return ok({success:true});
  },{onContainerId:async()=>{throw new Error("disk full");}}),/durably recorded/i);
  assert.equal(uploads,0);
});

test("uncertain publish result carries persisted container ID and never retries",async()=>{
  let publishCalls=0;
  await assert.rejects(()=>run(async(url,options={})=>{
    if(String(url).endsWith("/media")) return ok({id:"123456789012346"});
    if(String(url).includes("rupload")) return ok({success:true});
    if(String(url).includes("status_code")) return ok({id:"123456789012346",status_code:"FINISHED"});
    if(String(url).endsWith("/media_publish")) { publishCalls++; throw new Error("socket reset"); }
    throw new Error("unexpected endpoint");
  }),error=>error instanceof InstagramReelError&&error.uncertain&&error.containerId==="123456789012346");
  assert.equal(publishCalls,1);
});

test("unknown container status fails closed before media_publish",async()=>{
  let publishes=0;
  await assert.rejects(()=>run(async(url,options={})=>{
    if(String(url).endsWith("/media")) return ok({id:"123456789012346"});
    if(String(url).includes("rupload")) return ok({success:true});
    if(String(url).includes("status_code")) return ok({id:"123456789012346",status_code:"UNKNOWN"});
    if(String(url).endsWith("/media_publish")) publishes++;
    return ok({});
  }),/unknown processing status/i);
  assert.equal(publishes,0);
});

test("reconciliation confirms only a persisted exact Reel media ID",async()=>{
  const result=await reconcileInstagramReel({mediaId:"123456789012347",containerId:"123456789012346",
    instagramAccountId:account,expectedInstagramAccountId:account,accessToken:token,
    fetchImpl:async()=>ok({id:"123456789012347",media_type:"REELS",permalink:"https://www.instagram.com/reel/abc/",timestamp:"2026-11-15T10:00:00+0000"})});
  assert.equal(result.outcome,"CONFIRMED");
  const unresolved=await reconcileInstagramReel({containerId:"123456789012346",instagramAccountId:account,
    expectedInstagramAccountId:account,accessToken:token,fetchImpl:async()=>{throw new Error("must not call");}});
  assert.equal(unresolved.outcome,"UNRESOLVED");
});

test("account verification requires exact professional identity and publishing scopes",async()=>{
  const responses=[
    ok({id:"987654321"}),
    ok({data:[{permission:"instagram_basic",status:"granted"},{permission:"instagram_content_publish",status:"granted"}]}),
    ok({id:account,username:"naturefrontiers",account_type:"BUSINESS"})
  ];
  const result=await verifyInstagramBusinessAccount({instagramAccountId:account,expectedInstagramAccountId:account,accessToken:token,
    fetchImpl:async()=>responses.shift()});
  assert.equal(result.verified,true);
  assert.equal(result.accountType,"BUSINESS");
});
