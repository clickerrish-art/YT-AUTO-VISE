import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { createMetaPageReel, fetchMetaPageReelStatus, MetaPageReelError } from "../scripts/meta-page-reel-adapter.mjs";

const PAGE = "1431329126735709";
const VIDEO = "987654321098765";
const TOKEN = "test-page-token-" + "x".repeat(30);
const API = "v26.0";
const response = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});
const inspected = {width:1080,height:1920,durationSeconds:35};

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),"nf-reel-test-"));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const bytes = Buffer.from("test-only reel video bytes");
  fs.writeFileSync(path.join(root,"reel.mp4"),bytes);
  return {root,bytes,draft:{kind:"FACEBOOK_PAGE_REEL_DRAFT",caption:"Wildlife education caption",media:{path:"reel.mp4",sha256:crypto.createHash("sha256").update(bytes).digest("hex")}}};
}

test("Page Reel adapter initializes, uploads the exact local bytes, and finalizes as DRAFT by default",async t=>{
  const {root,bytes,draft}=await fixture(t);
  const calls=[];
  const result=await createMetaPageReel({
    draft,pageId:PAGE,expectedPageId:PAGE,accessToken:TOKEN,apiVersion:API,
    permissionsVerified:true,publishingEnabled:true,dryRun:false,emergencyStop:false,rootDir:root,inspect:()=>inspected,
    fetchImpl:async(url,options)=>{
      calls.push({url:String(url),options});
      if(calls.length===1) return response({video_id:VIDEO,upload_url:"https://rupload.facebook.com/video-upload/v26.0/"+VIDEO});
      if(calls.length===2) {
        assert.equal(String(url),"https://rupload.facebook.com/video-upload/v26.0/"+VIDEO);
        assert.equal(options.headers.authorization,"OAuth "+TOKEN);
        assert.equal(options.headers.offset,"0");
        assert.equal(options.headers.file_size,String(bytes.length));
        assert.deepEqual(Buffer.from(options.body),bytes);
        return response({success:true});
      }
      return response({success:true});
    }
  });
  assert.equal(calls.length,3);
  assert.equal(result.status,"REMOTE_DRAFT_UNVERIFIED");
  assert.equal(result.videoState,"DRAFT");
  assert.equal(result.remoteVideoId,VIDEO);
  assert.equal(result.verifiedRemotely,false);
  assert.equal(new URL(calls[0].url).searchParams.has("access_token"),false);
  assert.equal(calls[0].options.redirect,"error");
  const start=new URLSearchParams(calls[0].options.body);
  assert.equal(start.get("upload_phase"),"START");
  const finish=new URLSearchParams(calls[2].options.body);
  assert.equal(finish.get("upload_phase"),"FINISH");
  assert.equal(finish.get("video_id"),VIDEO);
  assert.equal(finish.get("video_state"),"DRAFT");
  assert.equal(finish.get("description"),draft.caption);
});

test("Page Reel publication requires all explicit live approval and safety switches",async t=>{
  const {root,draft}=await fixture(t);
  let calls=0;
  const publish=()=>createMetaPageReel({
    draft,pageId:PAGE,expectedPageId:PAGE,accessToken:TOKEN,apiVersion:API,
    permissionsVerified:true,approvalVerified:true,publishingEnabled:true,dryRun:false,emergencyStop:false,
    videoState:"PUBLISHED",rootDir:root,inspect:()=>inspected,
    fetchImpl:async()=>{calls++;return response(calls===1?{video_id:VIDEO,upload_url:"https://rupload.facebook.com/video-upload/v26.0/"+VIDEO}:{success:true});}
  });
  await assert.rejects(()=>createMetaPageReel({
    draft,pageId:PAGE,expectedPageId:PAGE,accessToken:TOKEN,apiVersion:API,
    permissionsVerified:true,videoState:"PUBLISHED",rootDir:root,inspect:()=>inspected,
    fetchImpl:async()=>{calls++;return response({});}
  }),/live publishing enabled/i);
  assert.equal(calls,0);
  const result=await publish();
  assert.equal(result.status,"REMOTE_PUBLISHED_UNVERIFIED");
  assert.equal(calls,3);
});

test("Page Reel adapter rejects mismatched Page IDs, missing permission checks, and checksum drift before network calls",async t=>{
  const {root,draft}=await fixture(t);
  let calls=0;
  const options={draft,pageId:PAGE,expectedPageId:PAGE,accessToken:TOKEN,apiVersion:API,publishingEnabled:true,dryRun:false,emergencyStop:false,rootDir:root,inspect:()=>inspected,fetchImpl:async()=>{calls++;return response({});}};
  await assert.rejects(()=>createMetaPageReel({...options,expectedPageId:"999999999999999",permissionsVerified:true}),/allowlist/i);
  await assert.rejects(()=>createMetaPageReel({...options,permissionsVerified:false}),/permissions/i);
  await assert.rejects(()=>createMetaPageReel({...options,permissionsVerified:true,draft:{...draft,media:{...draft.media,sha256:"a".repeat(64)}}}),/checksum/i);
  assert.equal(calls,0);
});

test("Page Reel adapter rejects upload URLs outside Meta's rupload host and path",async t=>{
  const {root,draft}=await fixture(t);
  await assert.rejects(()=>createMetaPageReel({
    draft,pageId:PAGE,expectedPageId:PAGE,accessToken:TOKEN,apiVersion:API,permissionsVerified:true,publishingEnabled:true,dryRun:false,emergencyStop:false,
    rootDir:root,inspect:()=>inspected,
    fetchImpl:async()=>response({video_id:VIDEO,upload_url:"https://attacker.example/video-upload/"+VIDEO})
  }),/outside the approved rupload host\/path/i);
});

test("Page Reel upload timeout retains remote video ID and is explicitly uncertain",async t=>{
  const {root,draft}=await fixture(t);
  let calls=0;
  await assert.rejects(()=>createMetaPageReel({
    draft,pageId:PAGE,expectedPageId:PAGE,accessToken:TOKEN,apiVersion:API,permissionsVerified:true,publishingEnabled:true,dryRun:false,emergencyStop:false,
    rootDir:root,inspect:()=>inspected,
    fetchImpl:async()=>{calls++;if(calls===1)return response({video_id:VIDEO,upload_url:"https://rupload.facebook.com/video-upload/v26.0/"+VIDEO});throw new Error("network timeout");}
  }),error=>error instanceof MetaPageReelError && error.uncertain===true && error.remoteVideoId===VIDEO);
  assert.equal(calls,2,"the adapter must not retry an uncertain upload");
});

test("Page Reel status read-back binds the response to the exact remote video ID",async()=>{
  let request;
  const result=await fetchMetaPageReelStatus({
    remoteVideoId:VIDEO,expectedPageId:PAGE,accessToken:TOKEN,apiVersion:API,
    fetchImpl:async(url,options)=>{request={url:String(url),options};return response({id:VIDEO,status:{video_status:"processing",processing_progress:50}});}
  });
  assert.deepEqual(result.status,{video_status:"processing",processing_progress:50});
  assert.match(request.url,/fields=id,status/);
  assert.equal(new URL(request.url).searchParams.has("access_token"),false);
  assert.equal(request.options.headers.authorization,"Bearer "+TOKEN);
  await assert.rejects(()=>fetchMetaPageReelStatus({
    remoteVideoId:VIDEO,expectedPageId:PAGE,accessToken:TOKEN,apiVersion:API,
    fetchImpl:async()=>response({id:"111111111111111",status:{video_status:"ready"}})
  }),/did not match/i);
});
