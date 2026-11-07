import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createContentJob } from "../scripts/content-job-lifecycle.mjs";
import { shortParentRelationshipSha256 } from "../scripts/short-parent-relationship.mjs";

const root=process.cwd(),token="parent-relationship-test-"+"x".repeat(40),operator="parent-relationship-owner@example.test";
const channelId="UC"+"A".repeat(22),videoId="abcdefghijk",hash=x=>crypto.createHash("sha256").update(x).digest("hex");
async function port(){const s=createServer();await new Promise((r,j)=>{s.once("error",j);s.listen(0,"127.0.0.1",r)});const p=s.address().port;await new Promise(r=>s.close(r));return p}
function launch(p,stateDir,uploadDir){const child=spawn(process.execPath,["scripts/dashboard-server.mjs"],{cwd:root,env:{...process.env,DASHBOARD_OPERATOR_TOKEN:token,DASHBOARD_OPERATOR_ID:operator,DASHBOARD_STATE_DIR:stateDir,UPLOAD_LOG_DIR:path.relative(root,uploadDir).split(path.sep).join("/"),PORT:String(p),DASHBOARD_HOST:"127.0.0.1",SONICVHIBEZ_CHANNEL_ID:channelId,YOUTUBE_CLIENT_ID:"",YOUTUBE_CLIENT_SECRET:"",YOUTUBE_REFRESH_TOKEN:"",META_PAGE_ACCESS_TOKEN:"",META_USER_ACCESS_TOKEN:"",NATURE_FRONTIERS_FACEBOOK_PAGE_ID:"",FACEBOOK_PUBLISH_ENABLED:""},stdio:["ignore","pipe","pipe"]});let logs="";child.stdout.on("data",x=>logs+=x);child.stderr.on("data",x=>logs+=x);return{child,port:p,get logs(){return logs}}}
async function ready(s){const base="http://127.0.0.1:"+s.port;for(let i=0;i<100;i++){if(s.child.exitCode!==null||s.child.signalCode!==null)throw Error(s.logs);try{if((await fetch(base+"/healthz")).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error("server readiness timeout "+s.logs)}
async function stop(s){if(!s||s.child.exitCode!==null||s.child.signalCode!==null)return;const p=new Promise((r,j)=>{const timer=setTimeout(()=>j(Error("shutdown timeout")),5000);s.child.once("exit",()=>{clearTimeout(timer);r()})});s.child.kill("SIGTERM");await p}

test("Short-parent binding is idempotent under concurrency, rejects conflicts and survives restart",async t=>{
 const stateDir=fs.mkdtempSync(path.join(os.tmpdir(),"parent-rel-state-")),fixture=fs.mkdtempSync(path.join(root,".parent-rel-fixture-")),uploads=path.join(fixture,"uploads");fs.mkdirSync(uploads,{recursive:true});
 const stateFile=path.join(stateDir,"dashboard-state.json");
 const write=(name,data)=>{const p=path.join(fixture,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,data);return{path:path.relative(root,p).split(path.sep).join("/"),sha256:hash(data)}};
 const json=(name,value)=>write(name,Buffer.from(JSON.stringify(value,null,2)+"\n"));
 const parentMedia=write("media/parent.mp4",Buffer.from("fixture-only parent media; not production video"));
 const childMedia=write("media/child.mp4",Buffer.from("fixture-only child media; not production video"));
 const parentMeta=json("metadata/parent.json",{title:"Fixture Parent Documentary",channel:"SonicVhibez",visibility:"private"});
 const parent=createContentJob({idempotencyKey:"parent-rel-parent-20261103",title:"Fixture parent documentary",topic:"Synthetic parent relationship test fixture",contentType:"long_form",scheduledDay:"Tuesday",scheduledDate:"2026-11-03",publicationCycleId:"fixture-cycle"});
 parent.state="PRIVATE_UPLOAD_VERIFIED";parent.publicationCycleId="fixture-cycle";parent.outputArtifacts=[parentMedia];parent.metadataPath=parentMeta.path;parent.metadataVersion=parentMeta.sha256;parent.humanApproval={decision:"APPROVE",reviewer:operator,reviewedAt:"2026-11-01T12:00:00.000Z",fixtureOnly:true};
 const child=createContentJob({idempotencyKey:"parent-rel-child-20261107",title:"Fixture Short excerpt",topic:"Synthetic child relationship test fixture",contentType:"short",scheduledDay:"Saturday",scheduledDate:"2026-11-07",publicationCycleId:"fixture-cycle"});
 child.state="GENERATED";child.publicationCycleId="fixture-cycle";child.outputArtifacts=[childMedia];child.metadataPath=json("metadata/child.json",{title:"Fixture Short excerpt",parentContentId:parent.id,parentVideoId:videoId,parentVideoUrl:"https://www.youtube.com/watch?v="+videoId}).path;child.metadataVersion=hash(fs.readFileSync(path.join(root,child.metadataPath)));
 const receipt={jobId:parent.id,videoId,channelId,channelTitle:"SonicVhibez",title:"Fixture Parent Documentary",privacyStatus:"private",remoteStatusVerified:true,channelHistoryReconciled:true,historyVerifiedAt:"2026-11-06T18:00:00.000Z",historyVideoCount:12,actualPublishedAt:"2026-11-05T17:00:00.000Z",fixtureOnly:true};
 fs.writeFileSync(path.join(uploads,"parent-receipt.json"),JSON.stringify(receipt,null,2)+"\n");
 fs.writeFileSync(path.join(uploads,"upload-attempts.json"),JSON.stringify({attempts:[{attemptId:"fixture-parent-attempt",jobId:parent.id,artifactSha256:parentMedia.sha256,status:"PRIVATE_UPLOAD_VERIFIED",channelTitle:"SonicVhibez",visibility:"private",remoteVideoId:videoId,channelId,receiptPath:"parent-receipt.json"}]},null,2)+"\n");
 fs.writeFileSync(stateFile,JSON.stringify({version:1,queueItems:[],campaigns:[],audit:[],jobs:[parent,child],uploads:[],facebookDrafts:[],facebookPosts:[],facebookAttempts:[]},null,2)+"\n",{mode:0o600});
 let instance=launch(await port(),stateDir,uploads);
 t.after(async()=>{await stop(instance).catch(()=>{});fs.rmSync(stateDir,{recursive:true,force:true});fs.rmSync(fixture,{recursive:true,force:true})});
 await ready(instance);
 const base=()=>"http://127.0.0.1:"+instance.port,headers={"content-type":"application/json","x-operator-token":token};
 const payload={jobId:child.id,parentJobId:parent.id,parentMediaPath:parentMedia.path,childMediaPath:childMedia.path,parentQualityEvidencePath:"test/fixtures/parent-quality-evidence.json",sourceSegments:[{sceneId:"parent-scene-01",startSeconds:5,endSeconds:15}],confirmRelationshipReviewed:true,relationshipReviewNotes:"Fixture-only exact parent identity and source-scene mapping review."};
 const post=async body=>{const r=await fetch(base()+"/api/jobs/parent-relationship",{method:"POST",headers,body:JSON.stringify(body)});return{status:r.status,body:await r.json()}};
 assert.equal((await fetch(base()+"/api/jobs/parent-relationship",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)})).status,401);
 const beforeInvalid=fs.readFileSync(stateFile);assert.equal((await post({...payload,confirmRelationshipReviewed:false})).status,400);assert.deepEqual(fs.readFileSync(stateFile),beforeInvalid);
 const pair=await Promise.all([post(payload),post(payload)]);assert.deepEqual(pair.map(x=>x.status),[200,200],JSON.stringify(pair));assert.equal(pair.filter(x=>x.body.reused===true).length,1);
 const accepted=pair.find(x=>x.body.reused!==true);assert.ok(accepted);assert.equal(accepted.body.nativeRelatedVideoStatus,"BLOCKED_EXTERNAL");assert.equal(accepted.body.publishingEnabled,false);
 const relationship=accepted.body.job.shortParentRelationship;assert.equal(relationship.parentRemoteVideoId,videoId);assert.equal(relationship.parentPrivacyStatus,"private");assert.equal(relationship.relationshipReviewer,operator);assert.equal(accepted.body.relationshipSha256,shortParentRelationshipSha256(relationship));
 const beforeConflict=fs.readFileSync(stateFile);const conflict=await post({...payload,relationshipReviewNotes:"Conflicting review must not replace the original."});assert.equal(conflict.status,409);assert.deepEqual(fs.readFileSync(stateFile),beforeConflict);
 const retry=await post(payload);assert.equal(retry.status,200);assert.equal(retry.body.reused,true);assert.deepEqual(fs.readFileSync(stateFile),beforeConflict);
 let saved=JSON.parse(fs.readFileSync(stateFile,"utf8"));assert.equal(saved.audit.filter(x=>x.action==="SHORT_PARENT_RELATIONSHIP_BOUND"&&x.jobId===child.id).length,1);assert.equal(saved.jobs.find(x=>x.id===child.id).publishingEnabled,false);
 await stop(instance);instance=launch(await port(),stateDir,uploads);await ready(instance);
 const recovered=await(await fetch(base()+"/api/state",{headers:{"x-operator-token":token}})).json();const recoveredChild=recovered.jobs.find(x=>x.id===child.id);
 assert.equal(recoveredChild.shortParentRelationship.relationshipEvidenceSha256,relationship.relationshipEvidenceSha256);assert.equal(recoveredChild.shortParentRelationship.nativeRelatedVideo.status,"BLOCKED_EXTERNAL");assert.equal(recovered.audit.filter(x=>x.action==="SHORT_PARENT_RELATIONSHIP_BOUND"&&x.jobId===child.id).length,1);assert.equal(recovered.publishingEnabled,false);
});
