import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {runAutonomousInstagramPublisher,createInstagramApprovalReceipt} from "../scripts/instagram-autonomous-publisher.mjs";

const account="123456789012345",page="1431329126735709",secret="i".repeat(40);
function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"ig-publisher-"));
 const state=path.join(root,"state");fs.mkdirSync(state);
 const configPath=path.join(root,"instagram.json"),queuePath=path.join(root,"queue.json");
 const config={version:1,destination:"nature_frontiers_instagram",facebookPageId:page,facebookPageName:"Nature Frontiers SA",
   instagramBusinessAccountId:account,publishingEnabled:true,dryRun:false,emergencyStop:false,timezone:"Africa/Johannesburg",
   apiVersion:"v26.0",facebookLoginForBusinessEnabled:true};
 fs.writeFileSync(configPath,JSON.stringify(config));
 const sourcePayload={destination:"nature_frontiers_facebook",destinationPageId:page,slotId:"slot-1",caption:"Educational wildlife note.",
   media:[{path:"media/reel.mp4",sha256:"a".repeat(64)}],claims:[]};
 const payload={destination:"nature_frontiers_instagram",slotId:"slot-1",scheduledAt:"2026-11-15T10:00:00.000Z",
   timezone:"Africa/Johannesburg",mediaType:"reel",caption:sourcePayload.caption,media:{path:"media/reel.mp4",sha256:"a".repeat(64)},
   claims:[],shareToFeed:true,instagramAccountId:account,facebookPageId:page,sourcePayload};
 payload.approval=createInstagramApprovalReceipt(payload,{reviewer:"Editor",reason:"Exact Instagram version reviewed",secret,now:"2026-11-15T09:00:00.000Z"});
 fs.writeFileSync(queuePath,JSON.stringify([payload]));
 return {root,state,configPath,queuePath,payload,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
const env=()=>({INSTAGRAM_PUBLISH_ENABLED:"YES",NATURE_FRONTIERS_INSTAGRAM_ACCOUNT_ID:account,NATURE_FRONTIERS_FACEBOOK_PAGE_ID:page,
 META_USER_ACCESS_TOKEN:"m".repeat(40),INSTAGRAM_APPROVAL_HMAC_SECRET:secret});
const verified=async()=>({verified:true,instagramAccountId:account,facebookPageId:page});
const eligible=async()=>({eligible:true,policyRuleVersion:"nf-facebook-autonomous-policy-2026-11-v4"});

test("Instagram worker defaults are safe no-op before touching provider or queue",async()=>{
 const f=setup();try{
  f.config=JSON.parse(fs.readFileSync(f.configPath));f.config.publishingEnabled=false;f.config.dryRun=true;f.config.emergencyStop=true;fs.writeFileSync(f.configPath,JSON.stringify(f.config));
  let calls=0;const result=await runAutonomousInstagramPublisher({configPath:f.configPath,queuePath:f.queuePath,stateDir:f.state,rootDir:f.root,env:env(),verifyAccount:async()=>{calls++;}});
  assert.equal(result.status,"SAFE_NOOP");assert.equal(calls,0);
 }finally{f.cleanup();}
});

test("approved Instagram Reel dispatch persists container and media IDs and records verified receipt",async()=>{
 const f=setup();try{
  const result=await runAutonomousInstagramPublisher({configPath:f.configPath,queuePath:f.queuePath,stateDir:f.state,rootDir:f.root,
   now:Date.parse("2026-11-15T10:00:00.000Z"),env:env(),verifyAccount:verified,policyEvaluator:eligible,
   publish:async args=>{
    await args.onContainerId({containerId:"123456789012346",createdAt:"2026-11-15T10:00:01.000Z"});
    await args.onMediaId({containerId:"123456789012346",mediaId:"123456789012347",publishedAt:"2026-11-15T10:00:02.000Z"});
    return {status:"PUBLISHED_VERIFIED",verifiedRemotely:true,containerId:"123456789012346",mediaId:"123456789012347",
      permalink:"https://www.instagram.com/reel/abc/",publishedAt:"2026-11-15T10:00:02.000Z"};
   }});
  assert.equal(result.published,1);assert.equal(result.queueCount,0);
  const ledger=JSON.parse(fs.readFileSync(path.join(f.state,"instagram-attempt-ledger.json"),"utf8"));
  assert.equal(ledger[0].status,"PUBLISHED_VERIFIED");assert.equal(ledger[0].remoteContainerId,"123456789012346");
  assert.equal(ledger[0].remoteMediaId,"123456789012347");
 }finally{f.cleanup();}
});

test("worker does not publish before its due time and keeps the approved queue entry",async()=>{
 const f=setup();try{
  let publishes=0;const result=await runAutonomousInstagramPublisher({configPath:f.configPath,queuePath:f.queuePath,stateDir:f.state,rootDir:f.root,
   now:Date.parse("2026-11-15T09:59:00.000Z"),env:env(),verifyAccount:verified,policyEvaluator:eligible,publish:async()=>{publishes++;}});
  assert.equal(publishes,0);assert.equal(result.queueCount,1);
 }finally{f.cleanup();}
});

test("expired Instagram dispatch slot is skipped and never caught up",async()=>{
 const f=setup();try{
  let publishes=0;const result=await runAutonomousInstagramPublisher({configPath:f.configPath,queuePath:f.queuePath,stateDir:f.state,rootDir:f.root,
   now:Date.parse("2026-11-15T10:06:00.000Z"),env:env(),verifyAccount:verified,policyEvaluator:eligible,publish:async()=>{publishes++;}});
  assert.equal(publishes,0);assert.equal(result.skipped,1);assert.equal(result.queueCount,0);
 }finally{f.cleanup();}
});

test("invalid or modified Instagram approval blocks before any provider mutation",async()=>{
 const f=setup();try{
  const queue=JSON.parse(fs.readFileSync(f.queuePath,"utf8"));queue[0].caption="Modified after approval";fs.writeFileSync(f.queuePath,JSON.stringify(queue));
  let publishes=0;const result=await runAutonomousInstagramPublisher({configPath:f.configPath,queuePath:f.queuePath,stateDir:f.state,rootDir:f.root,
   now:Date.parse("2026-11-15T10:00:00.000Z"),env:env(),verifyAccount:verified,policyEvaluator:eligible,publish:async()=>{publishes++;}});
  assert.equal(publishes,0);assert.equal(result.skipped,1);
 }finally{f.cleanup();}
});

test("interrupted Instagram publish with a persisted media ID reconciles without re-uploading",async()=>{
 const f=setup();try{
  fs.writeFileSync(f.queuePath,"[]");
  fs.writeFileSync(path.join(f.state,"instagram-attempt-ledger.json"),JSON.stringify([{kind:"INSTAGRAM_REEL_PUBLISH_ATTEMPT",slotId:"old-slot",status:"PUBLISHING",
    remoteContainerId:"123456789012346",remoteMediaId:"123456789012347",retryAllowed:false}]));
  let publishes=0,reconciles=0;
  const result=await runAutonomousInstagramPublisher({configPath:f.configPath,queuePath:f.queuePath,stateDir:f.state,rootDir:f.root,
   now:Date.parse("2026-11-15T10:00:00.000Z"),env:env(),verifyAccount:verified,policyEvaluator:eligible,
   publish:async()=>{publishes++;},reconcile:async()=>{reconciles++;return {outcome:"CONFIRMED",receipt:{status:"PUBLISHED_VERIFIED",mediaId:"123456789012347"}};}});
  assert.equal(publishes,0);assert.equal(reconciles,1);assert.equal(result.published,0);
  const ledger=JSON.parse(fs.readFileSync(path.join(f.state,"instagram-attempt-ledger.json"),"utf8"));assert.equal(ledger[0].status,"PUBLISHED_VERIFIED");
 }finally{f.cleanup();}
});

test("uncertain Instagram container without a media ID remains unresolved and is never retried",async()=>{
 const f=setup();try{
  fs.writeFileSync(f.queuePath,"[]");
  fs.writeFileSync(path.join(f.state,"instagram-attempt-ledger.json"),JSON.stringify([{kind:"INSTAGRAM_REEL_PUBLISH_ATTEMPT",slotId:"old-slot",status:"UNCERTAIN",
    remoteContainerId:"123456789012346",remoteMediaId:null,retryAllowed:false}]));
  let publishes=0;
  const result=await runAutonomousInstagramPublisher({configPath:f.configPath,queuePath:f.queuePath,stateDir:f.state,rootDir:f.root,
   now:Date.parse("2026-11-15T10:00:00.000Z"),env:env(),verifyAccount:verified,policyEvaluator:eligible,
   publish:async()=>{publishes++;},reconcile:async()=>({outcome:"UNRESOLVED",reason:"INSTAGRAM_MEDIA_ID_MISSING_NO_RETRY"})});
  assert.equal(publishes,0);assert.equal(result.published,0);
  const ledger=JSON.parse(fs.readFileSync(path.join(f.state,"instagram-attempt-ledger.json"),"utf8"));assert.equal(ledger[0].status,"UNCERTAIN");
 }finally{f.cleanup();}
});

test("approved Instagram feed image dispatch persists IDs and verifies the feed receipt",async()=>{
 const f=setup();try{
  const config=JSON.parse(fs.readFileSync(f.configPath,"utf8"));config.allowedImageDomains=["example.test"];fs.writeFileSync(f.configPath,JSON.stringify(config));
  const queue=JSON.parse(fs.readFileSync(f.queuePath,"utf8"));const payload=queue[0];
  payload.mediaType="feed_post";payload.media.url="https://cdn.example.test/wildlife.jpg";payload.media.altText="Wildlife in a natural habitat";
  payload.approval=createInstagramApprovalReceipt(payload,{reviewer:"Editor",reason:"Exact feed image reviewed",secret,now:"2026-11-15T09:00:00.000Z"});
  fs.writeFileSync(f.queuePath,JSON.stringify(queue));
  const result=await runAutonomousInstagramPublisher({configPath:f.configPath,queuePath:f.queuePath,stateDir:f.state,rootDir:f.root,
   now:Date.parse("2026-11-15T10:00:00.000Z"),env:env(),verifyAccount:verified,policyEvaluator:eligible,
   publishImage:async args=>{
    await args.onContainerId({containerId:"123456789012346",createdAt:"2026-11-15T10:00:01.000Z"});
    await args.onMediaId({containerId:"123456789012346",mediaId:"123456789012347",publishedAt:"2026-11-15T10:00:02.000Z"});
    return {status:"PUBLISHED_VERIFIED",verifiedRemotely:true,containerId:"123456789012346",mediaId:"123456789012347",
      permalink:"https://www.instagram.com/p/abc/",publishedAt:"2026-11-15T10:00:02.000Z"};
   }});
  assert.equal(result.published,1);
  const ledger=JSON.parse(fs.readFileSync(path.join(f.state,"instagram-attempt-ledger.json"),"utf8"));
  assert.equal(ledger[0].kind,"INSTAGRAM_IMAGE_PUBLISH_ATTEMPT");assert.equal(ledger[0].status,"PUBLISHED_VERIFIED");
 }finally{f.cleanup();}
});

test("Instagram feed posts have an independent one-per-day cap",async()=>{
 const f=setup();try{
  fs.writeFileSync(f.queuePath,"[]");
  fs.writeFileSync(path.join(f.state,"instagram-history.json"),JSON.stringify([{slotId:"earlier-feed",status:"PUBLISHED_VERIFIED",
   mediaType:"feed_post",publishedAt:"2026-11-15T09:00:00.000Z"}]));
  const result=await runAutonomousInstagramPublisher({configPath:f.configPath,queuePath:f.queuePath,stateDir:f.state,rootDir:f.root,
   now:Date.parse("2026-11-15T14:00:00.000Z"),env:env(),verifyAccount:verified,policyEvaluator:eligible});
  assert.equal(result.skipped,0); // No candidate is queued; prior feed remains in history.
  const history=JSON.parse(fs.readFileSync(path.join(f.state,"instagram-history.json"),"utf8"));assert.equal(history.length,1);
 }finally{f.cleanup();}
});
