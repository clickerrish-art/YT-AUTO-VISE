import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {publishInstagramImagePost,reconcileInstagramImagePost,InstagramImageError} from "../scripts/meta-instagram-image-adapter.mjs";

const token="x".repeat(40),account="123456789012345",url="https://cdn.example.test/nature.jpg";
const bytes=Buffer.from([0xff,0xd8,0xff,0xdb,1,2,3]);
const sha256=crypto.createHash("sha256").update(bytes).digest("hex");
const draft={kind:"INSTAGRAM_IMAGE_DRAFT",caption:"Wildlife education image.",media:{url,sha256,altText:"Wildlife in a natural habitat"}};
const media={width:1080,height:1350,aspectRatio:0.8};
const ok=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data,headers:{get:()=> "image/jpeg"},arrayBuffer:async()=>bytes});
const run=(fetchImpl,extra={})=>publishInstagramImagePost({draft,instagramAccountId:account,expectedInstagramAccountId:account,accessToken:token,
 accountVerified:true,approvalVerified:true,publishingEnabled:true,dryRun:false,emergencyStop:false,allowedImageDomains:["example.test"],
 inspect:()=>media,fetchImpl,...extra});

test("Instagram feed image uses public hash-pinned JPEG, container processing, publish and read-back",async()=>{
 const calls=[],persisted=[];
 const result=await run(async(url,options={})=>{
  calls.push({url:String(url),method:options.method});
  if(String(url)===draft.media.url)return ok({});
  if(String(url).endsWith("/media")&&options.method==="POST")return ok({id:"123456789012346"});
  if(String(url).includes("status_code"))return ok({id:"123456789012346",status_code:"FINISHED"});
  if(String(url).endsWith("/media_publish"))return ok({id:"123456789012347"});
  if(String(url).includes("media_product_type"))return ok({id:"123456789012347",media_type:"IMAGE",media_product_type:"FEED",permalink:"https://www.instagram.com/p/abc/"});
  throw new Error("unexpected endpoint "+url);
 },{onContainerId:async x=>persisted.push(x.containerId),onMediaId:async x=>persisted.push(x.mediaId)});
 assert.equal(result.status,"PUBLISHED_VERIFIED");assert.deepEqual(persisted,["123456789012346","123456789012347"]);
 assert.equal(calls.filter(x=>x.method==="POST").length,2);
});

test("unapproved, unsafe or mismatched images fail before container creation",async()=>{
 let mutations=0;
 await assert.rejects(()=>publishInstagramImagePost({draft,instagramAccountId:account,expectedInstagramAccountId:account,accessToken:token,
  accountVerified:true,publishingEnabled:true,dryRun:false,emergencyStop:false,allowedImageDomains:["example.test"],fetchImpl:async()=>{mutations++;return ok({});}}),/approval/i);
 await assert.rejects(()=>run(async(url,options={})=>{if(options.method==="POST")mutations++;return ok({});},{allowedImageDomains:["other.test"]}),/approved public media host/i);
 assert.equal(mutations,0);
});

test("uncertain image publish preserves the container ID and never retries",async()=>{
 let publishCalls=0;
 await assert.rejects(()=>run(async(url,options={})=>{
  if(String(url)===draft.media.url)return ok({});
  if(String(url).endsWith("/media")&&options.method==="POST")return ok({id:"123456789012346"});
  if(String(url).includes("status_code"))return ok({id:"123456789012346",status_code:"FINISHED"});
  if(String(url).endsWith("/media_publish")){publishCalls++;throw new Error("connection reset");}
  throw new Error("unexpected endpoint");
 }),error=>error instanceof InstagramImageError&&error.uncertain&&error.containerId==="123456789012346");
 assert.equal(publishCalls,1);
});

test("image reconciliation confirms only exact IMAGE FEED media",async()=>{
 const result=await reconcileInstagramImagePost({mediaId:"123456789012347",instagramAccountId:account,expectedInstagramAccountId:account,accessToken:token,
  fetchImpl:async()=>ok({id:"123456789012347",media_type:"IMAGE",media_product_type:"FEED",permalink:"https://www.instagram.com/p/abc/"})});
 assert.equal(result.outcome,"CONFIRMED");
});

test("publication read-back rejects foreign hosts, non-feed paths and missing or malformed timestamps",async()=>{
 const invalid=[
  {id:"123456789012347",media_type:"IMAGE",media_product_type:"FEED",permalink:"https://evil.example/p/abc/",timestamp:"2026-11-15T10:00:00+0000"},
  {id:"123456789012347",media_type:"IMAGE",media_product_type:"FEED",permalink:"https://www.instagram.com/reel/abc/",timestamp:"2026-11-15T10:00:00+0000"},
  {id:"123456789012347",media_type:"IMAGE",media_product_type:"FEED",permalink:"https://www.instagram.com/p/abc/",timestamp:null},
  {id:"123456789012347",media_type:"IMAGE",media_product_type:"FEED",permalink:"https://www.instagram.com/p/abc/",timestamp:"not-a-time"}
 ];
 for(const data of invalid) {
  await assert.rejects(()=>run(async(url,options={})=>{
   if(String(url)===draft.media.url)return ok({});
   if(String(url).endsWith("/media")&&options.method==="POST")return ok({id:"123456789012346"});
   if(String(url).includes("status_code"))return ok({id:"123456789012346",status_code:"FINISHED"});
   if(String(url).endsWith("/media_publish"))return ok({id:"123456789012347"});
   if(String(url).includes("media_product_type"))return ok(data);
   throw new Error("unexpected endpoint "+url);
  }),error=>error instanceof InstagramImageError&&error.uncertain&&error.mediaId==="123456789012347");
 }
});
test("reconciliation rejects foreign permalinks and invalid publication timestamps",async()=>{
 for(const data of [
  {id:"123456789012347",media_type:"IMAGE",media_product_type:"FEED",permalink:"https://evil.example/p/abc/",timestamp:"2026-11-15T10:00:00+0000"},
  {id:"123456789012347",media_type:"IMAGE",media_product_type:"FEED",permalink:"https://www.instagram.com/p/abc/",timestamp:null}
 ]) {
  const result=await reconcileInstagramImagePost({mediaId:"123456789012347",instagramAccountId:account,expectedInstagramAccountId:account,accessToken:token,fetchImpl:async()=>ok(data)});
  assert.equal(result.outcome,"UNRESOLVED");
 }
});
