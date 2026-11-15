import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {runInstagramContentIntake} from "../scripts/instagram-content-intake.mjs";
import {createInstagramApprovalReceipt} from "../scripts/instagram-autonomous-publisher.mjs";

const account="123456789012345",page="1431329126735709",secret="i".repeat(40);
function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"ig-intake-")),content=path.join(root,"content");
 fs.mkdirSync(content);const configPath=path.join(root,"instagram.json"),candidatePath=path.join(content,"candidates.json"),queuePath=path.join(content,"queue.json");
 const config={destination:"nature_frontiers_instagram",timezone:"Africa/Johannesburg",instagramBusinessAccountId:account,facebookPageId:page,facebookPageName:"Nature Frontiers SA"};
 fs.writeFileSync(configPath,JSON.stringify(config));fs.writeFileSync(queuePath,"[]");
 const sourcePayload={destination:"nature_frontiers_facebook",mediaType:"reel",destinationPageId:page,slotId:"slot-1",caption:"A verified wildlife fact.",
   media:[{path:"media/reel.mp4",sha256:"a".repeat(64)}],claims:[]};
 const payload={destination:"nature_frontiers_instagram",slotId:"slot-1",scheduledAt:"2026-11-15T12:00:00.000+02:00",timezone:"Africa/Johannesburg",
   mediaType:"reel",caption:sourcePayload.caption,media:{path:"media/reel.mp4",sha256:"a".repeat(64)},claims:[],shareToFeed:true,
   instagramAccountId:account,facebookPageId:page,sourcePayload};
 payload.approval=createInstagramApprovalReceipt(payload,{reviewer:"Editor",reason:"Reviewed exact Instagram version",secret,now:"2026-11-15T09:00:00.000Z"});
 fs.writeFileSync(candidatePath,JSON.stringify([payload]));
 return {root,configPath,candidatePath,queuePath,payload,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
const env={INSTAGRAM_APPROVAL_HMAC_SECRET:secret};
const eligible=async(_payload,options)=>({eligible:true,options});
test("Instagram intake queues only signed, source-policy-approved future Reel candidates",async()=>{
 const f=setup();try{
  const result=await runInstagramContentIntake({configPath:f.configPath,candidatePath:f.candidatePath,queuePath:f.queuePath,rootDir:f.root,env,
   now:Date.parse("2026-11-15T09:30:00.000Z"),policyEvaluator:eligible});
  assert.equal(result.accepted,1);assert.equal(result.blocked,0);assert.equal(result.queueCount,1);
 }finally{f.cleanup();}
});
test("Instagram intake is idempotent and never duplicates a slot",async()=>{
 const f=setup();try{
  await runInstagramContentIntake({configPath:f.configPath,candidatePath:f.candidatePath,queuePath:f.queuePath,rootDir:f.root,env,
   now:Date.parse("2026-11-15T09:30:00.000Z"),policyEvaluator:eligible});
  const result=await runInstagramContentIntake({configPath:f.configPath,candidatePath:f.candidatePath,queuePath:f.queuePath,rootDir:f.root,env,
   now:Date.parse("2026-11-15T09:30:00.000Z"),policyEvaluator:eligible});
  assert.equal(result.accepted,0);assert.equal(result.duplicate,1);assert.equal(result.queueCount,1);
 }finally{f.cleanup();}
});
test("Instagram intake rejects modified content and source-policy failures",async()=>{
 const f=setup();try{
  const q=JSON.parse(fs.readFileSync(f.candidatePath,"utf8"));q[0].caption="changed";fs.writeFileSync(f.candidatePath,JSON.stringify(q));
  const result=await runInstagramContentIntake({configPath:f.configPath,candidatePath:f.candidatePath,queuePath:f.queuePath,rootDir:f.root,env,
   now:Date.parse("2026-11-15T09:30:00.000Z"),policyEvaluator:eligible});
  assert.equal(result.accepted,0);assert.equal(result.blocked,1);
 }finally{f.cleanup();}
});
test("Instagram intake blocks an owner-unconfigured account rather than guessing an ID",async()=>{
 const f=setup();try{
  const config=JSON.parse(fs.readFileSync(f.configPath,"utf8"));config.instagramBusinessAccountId=null;fs.writeFileSync(f.configPath,JSON.stringify(config));
  const result=await runInstagramContentIntake({configPath:f.configPath,candidatePath:f.candidatePath,queuePath:f.queuePath,rootDir:f.root,env});
  assert.equal(result.status,"BLOCKED_CONFIGURATION");assert.equal(result.accepted,0);
 }finally{f.cleanup();}
});

test("Instagram intake accepts a signed feed image only from an allowlisted public host",async()=>{
 const f=setup();try{
  const config=JSON.parse(fs.readFileSync(f.configPath,"utf8"));config.allowedImageDomains=["example.test"];fs.writeFileSync(f.configPath,JSON.stringify(config));
  const candidates=JSON.parse(fs.readFileSync(f.candidatePath,"utf8"));const payload=candidates[0];
  payload.mediaType="feed_post";payload.sourcePayload.mediaType="feed_post";payload.media.url="https://cdn.example.test/wildlife.jpg";payload.media.altText="Wildlife in a natural habitat";
  payload.approval=createInstagramApprovalReceipt(payload,{reviewer:"Editor",reason:"Exact Instagram feed image reviewed",secret,now:"2026-11-15T09:00:00.000Z"});
  fs.writeFileSync(f.candidatePath,JSON.stringify(candidates));
  const result=await runInstagramContentIntake({configPath:f.configPath,candidatePath:f.candidatePath,queuePath:f.queuePath,rootDir:f.root,env,
   now:Date.parse("2026-11-15T09:30:00.000Z"),policyEvaluator:eligible});
  assert.equal(result.accepted,1);assert.equal(result.blocked,0);
 }finally{f.cleanup();}
});
