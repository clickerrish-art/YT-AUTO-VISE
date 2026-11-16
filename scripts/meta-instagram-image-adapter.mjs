import crypto from "node:crypto";
import { META_GRAPH_API_VERSION } from "./meta-graph-api-version.mjs";
import { spawnSync } from "node:child_process";

const ID=/^\d{5,30}$/;
const VERSION=/^v\d+\.\d+$/;
const graph=(version,edge)=>`https://graph.facebook.com/${version}/${edge}`;
const headers=token=>({authorization:"Bearer "+token,accept:"application/json"});
export class InstagramImageError extends Error {
 constructor(message,{status=null,code=null,uncertain=false,containerId=null,mediaId=null}={}) {
  super(message);this.name="InstagramImageError";Object.assign(this,{status,code,uncertain,containerId,mediaId});
 }
}
function validate({instagramAccountId,expectedInstagramAccountId,accessToken,apiVersion}) {
 if(!ID.test(String(instagramAccountId??""))||instagramAccountId!==expectedInstagramAccountId) throw new InstagramImageError("Instagram professional account ID does not match the owner-verified allowlist");
 if(typeof accessToken!=="string"||accessToken.length<20) throw new InstagramImageError("Meta user access token is not configured securely");
 if(!VERSION.test(apiVersion)) throw new InstagramImageError("Meta Graph API version is invalid");
}
async function json(response,{mutation=false,token="",containerId=null,mediaId=null}={}) {
 let data;try{data=await response.json();}catch{throw new InstagramImageError("Meta returned an unreadable Instagram image response",{status:response.status,uncertain:mutation,containerId,mediaId});}
 if(!response.ok||data?.error) {
  const message=typeof data?.error?.message==="string"?data.error.message.split(token).join("[REDACTED]").slice(0,400):"Instagram Graph API image request failed";
  throw new InstagramImageError(message,{status:response.status,code:data?.error?.code??null,uncertain:mutation,containerId,mediaId});
 }
 return data;
}
function safeImageUrl(value,allowedDomains) {
 let url;try{url=new URL(value);}catch{throw new InstagramImageError("Instagram feed image URL is invalid");}
 const host=url.hostname.toLowerCase();
 const allowed=Array.isArray(allowedDomains)&&allowedDomains.some(domain=>host===String(domain).toLowerCase()||host.endsWith("."+String(domain).toLowerCase()));
 if(url.protocol!=="https:"||url.username||url.password||url.port||url.hash||url.search||!allowed||
    host==="localhost"||host.endsWith(".localhost")||host==="127.0.0.1"||host==="::1") {
  throw new InstagramImageError("Instagram image URL must be HTTPS, query-free and on an exact approved public media host");
 }
 return url;
}
function validInstagramFeedPermalink(value) {
 if(typeof value!=="string") return false;
 try {
  const url=new URL(value);
  return url.protocol==="https:"&&
   (url.hostname==="www.instagram.com"||url.hostname==="instagram.com")&&
   !url.username&&!url.password&&!url.port&&!url.search&&!url.hash&&
   /^\/p\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
 } catch { return false; }
}
function validPublishedTimestamp(value) {
 return typeof value==="string"&&/(?:Z|[+-]\d{2}:?\d{2})$/.test(value)&&Number.isFinite(Date.parse(value));
}
function inspectJpeg(bytes) {
 const result=spawnSync("ffprobe",["-v","error","-select_streams","v:0","-show_entries","stream=codec_name,width,height","-of","json","-"],{input:bytes,encoding:"utf8",timeout:15000});
 if(result.error||result.status!==0) throw new InstagramImageError("ffprobe is unavailable or could not inspect the Instagram image");
 let parsed;try{parsed=JSON.parse(result.stdout);}catch{throw new InstagramImageError("ffprobe returned invalid Instagram image metadata");}
 const stream=(parsed.streams??[]).find(x=>x.codec_name==="mjpeg"&&Number(x.width)>0&&Number(x.height)>0);
 if(!stream) throw new InstagramImageError("Instagram feed image must be a decodable JPEG");
 const width=Number(stream.width),height=Number(stream.height),ratio=width/height;
 if(width<320||width>1440||height<320||height>1800||ratio<0.8||ratio>1.91) throw new InstagramImageError("Instagram feed JPEG dimensions or aspect ratio are outside supported limits");
 return {width,height,aspectRatio:ratio};
}

/** Publish one approved Instagram feed image using a public, hash-pinned JPEG URL. */
export async function publishInstagramImagePost({
 draft,instagramAccountId,expectedInstagramAccountId,accessToken,apiVersion=META_GRAPH_API_VERSION,
 accountVerified=false,approvalVerified=false,publishingEnabled=false,dryRun=true,emergencyStop=true,
 allowedImageDomains=[],onContainerId=null,onMediaId=null,fetchImpl=fetch,inspect=inspectJpeg,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),timeoutMs=60000
}) {
 validate({instagramAccountId,expectedInstagramAccountId,accessToken,apiVersion});
 if(!draft||draft.kind!=="INSTAGRAM_IMAGE_DRAFT"||typeof draft.caption!=="string"||!draft.caption.trim()||
    typeof draft.media?.url!=="string"||!/^[a-f0-9]{64}$/.test(draft.media?.sha256??"")) throw new InstagramImageError("Captioned, checksum-bound Instagram JPEG draft is required");
 if(accountVerified!==true) throw new InstagramImageError("Exact Instagram professional account and linked Page were not verified");
 if(approvalVerified!==true) throw new InstagramImageError("Instagram feed publication requires verified editorial approval");
 if(publishingEnabled!==true||dryRun!==false||emergencyStop!==false) throw new InstagramImageError("Instagram feed publishing requires live switch, dry-run disabled and emergency stop cleared");
 const url=safeImageUrl(draft.media.url,allowedImageDomains);
 let response;
 try{response=await fetchImpl(url,{method:"GET",redirect:"error",signal:AbortSignal.timeout(timeoutMs),headers:{accept:"image/jpeg"}});}
 catch{throw new InstagramImageError("Public Instagram image could not be fetched; no Meta mutation was attempted");}
 if(!response.ok) throw new InstagramImageError("Public Instagram image host returned HTTP "+response.status);
 const type=String(response.headers?.get?.("content-type")??"").split(";")[0].trim().toLowerCase();
 if(type!=="image/jpeg") throw new InstagramImageError("Instagram feed image host must return image/jpeg");
 const bytes=Buffer.from(await response.arrayBuffer());
 if(!bytes.length||bytes.length>8*1024*1024||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff) throw new InstagramImageError("Instagram feed image must be a valid JPEG no larger than 8 MiB");
 const sha256=crypto.createHash("sha256").update(bytes).digest("hex");
 if(sha256!==draft.media.sha256) throw new InstagramImageError("Public Instagram JPEG bytes do not match the reviewed SHA-256");
 const media=inspect(bytes);
 const form=new URLSearchParams({image_url:url.toString(),caption:draft.caption,...(draft.media.altText?{alt_text:draft.media.altText}:{})});
 let created;
 try {
  response=await fetchImpl(graph(apiVersion,encodeURIComponent(instagramAccountId)+"/media"),{
   method:"POST",headers:{...headers(accessToken),"content-type":"application/x-www-form-urlencoded"},body:form,
   redirect:"error",signal:AbortSignal.timeout(timeoutMs)
  });
  created=await json(response,{mutation:true,token:accessToken});
 }catch(error){if(error instanceof InstagramImageError)throw error;throw new InstagramImageError("Instagram image container creation ended without a definitive response; do not retry",{uncertain:true});}
 const containerId=String(created.id??"");
 if(!ID.test(containerId)) throw new InstagramImageError("Meta did not return a valid Instagram image container ID; reconcile before retry",{uncertain:true});
 if(typeof onContainerId==="function") {
  try{await onContainerId({containerId,createdAt:new Date().toISOString()});}
  catch{throw new InstagramImageError("Instagram image container ID could not be durably recorded; stop and reconcile",{uncertain:true,containerId});}
 }
 let statusCode="";
 for(let attempt=0;attempt<5;attempt++) {
  if(attempt>0) await wait(60_000);
  try{response=await fetchImpl(graph(apiVersion,encodeURIComponent(containerId)+"?fields=id,status_code"),{method:"GET",headers:headers(accessToken),redirect:"error",signal:AbortSignal.timeout(timeoutMs)});}
  catch{throw new InstagramImageError("Instagram image container status is unavailable; do not publish or retry",{uncertain:true,containerId});}
  const status=await json(response,{token:accessToken,containerId});
  if(status.id!==containerId) throw new InstagramImageError("Instagram image container status ID mismatch",{uncertain:true,containerId});
  statusCode=String(status.status_code??"").toUpperCase();
  if(statusCode==="FINISHED") break;
  if(["ERROR","EXPIRED"].includes(statusCode)) throw new InstagramImageError("Instagram image container processing ended with status "+statusCode,{containerId});
  if(statusCode!=="IN_PROGRESS") throw new InstagramImageError("Instagram image container returned an unknown status; fail closed",{uncertain:true,containerId});
 }
 if(statusCode!=="FINISHED") throw new InstagramImageError("Instagram image container did not reach FINISHED within five checks",{uncertain:true,containerId});
 let published;
 try {
  const publishForm=new URLSearchParams({creation_id:containerId});
  response=await fetchImpl(graph(apiVersion,encodeURIComponent(instagramAccountId)+"/media_publish"),{
   method:"POST",headers:{...headers(accessToken),"content-type":"application/x-www-form-urlencoded"},body:publishForm,
   redirect:"error",signal:AbortSignal.timeout(timeoutMs)
  });
  published=await json(response,{mutation:true,token:accessToken,containerId});
 }catch(error){if(error instanceof InstagramImageError)throw error;throw new InstagramImageError("Instagram image publish outcome is uncertain; reconcile and do not retry",{uncertain:true,containerId});}
 const mediaId=String(published.id??"");
 if(!ID.test(mediaId)) throw new InstagramImageError("Instagram did not return a valid image media ID; reconcile before retry",{uncertain:true,containerId});
 if(typeof onMediaId==="function") {
  try{await onMediaId({containerId,mediaId,publishedAt:new Date().toISOString()});}
  catch{throw new InstagramImageError("Instagram image media ID could not be durably recorded; do not retry",{uncertain:true,containerId,mediaId});}
 }
 try{response=await fetchImpl(graph(apiVersion,encodeURIComponent(mediaId)+"?fields=id,media_type,media_product_type,permalink,timestamp"),{method:"GET",headers:headers(accessToken),redirect:"error",signal:AbortSignal.timeout(timeoutMs)});}
 catch{throw new InstagramImageError("Instagram image publication read-back failed; outcome remains unresolved",{uncertain:true,containerId,mediaId});}
 const verified=await json(response,{token:accessToken,containerId,mediaId});
 if(verified.id!==mediaId||verified.media_type!=="IMAGE"||verified.media_product_type!=="FEED"||
    !validInstagramFeedPermalink(verified.permalink)||!validPublishedTimestamp(verified.timestamp)) {
  throw new InstagramImageError("Instagram read-back did not confirm the expected feed image and permalink",{uncertain:true,containerId,mediaId});
 }
 return {status:"PUBLISHED_VERIFIED",instagramAccountId,containerId,mediaId,permalink:verified.permalink,
  publishedAt:verified.timestamp??null,media,sha256,uploadedBytes:bytes.length,verifiedRemotely:true};
}

/** Reconcile a persisted Instagram feed media ID without creating or publishing a container. */
export async function reconcileInstagramImagePost({mediaId,containerId=null,instagramAccountId,expectedInstagramAccountId,accessToken,apiVersion=META_GRAPH_API_VERSION,fetchImpl=fetch,timeoutMs=10000}) {
 validate({instagramAccountId,expectedInstagramAccountId,accessToken,apiVersion});
 if(!ID.test(String(mediaId??""))) return {outcome:"UNRESOLVED",reason:"INSTAGRAM_MEDIA_ID_MISSING_NO_RETRY",containerId};
 try{
  const response=await fetchImpl(graph(apiVersion,encodeURIComponent(mediaId)+"?fields=id,media_type,media_product_type,permalink,timestamp"),{method:"GET",headers:headers(accessToken),redirect:"error",signal:AbortSignal.timeout(timeoutMs)});
  const data=await json(response,{token:accessToken,containerId,mediaId});
  if(data.id!==mediaId||data.media_type!=="IMAGE"||data.media_product_type!=="FEED"||!validInstagramFeedPermalink(data.permalink)||!validPublishedTimestamp(data.timestamp))
   return {outcome:"UNRESOLVED",reason:"INSTAGRAM_IMAGE_READBACK_MISMATCH",mediaId,containerId};
  return {outcome:"CONFIRMED",receipt:{status:"PUBLISHED_VERIFIED",mediaId,containerId,permalink:data.permalink,publishedAt:data.timestamp??null}};
 }catch{return {outcome:"UNRESOLVED",reason:"INSTAGRAM_IMAGE_READBACK_FAILED_NO_RETRY",mediaId,containerId};}
}
