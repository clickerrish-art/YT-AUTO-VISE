import { isValidZonedIsoTimestamp } from "./schedule-policy.mjs";
import { evaluateFinalFacebookPayload, verifyFacebookAutonomousApprovalReceipt } from "./facebook-policy-engine.mjs";
import { createInstagramApprovalReceipt } from "./instagram-autonomous-publisher.mjs";

const ID=/^\d{5,30}$/;
export async function approveInstagramCandidate({
 payload,reviewer,reason,config,env=process.env,now=new Date().toISOString(),
 evidenceRoot=process.cwd(),policyEvaluator=evaluateFinalFacebookPayload
}={}) {
 const blockers=[];
 if(!config||config.destination!=="nature_frontiers_instagram"||config.timezone!=="Africa/Johannesburg") blockers.push("INSTAGRAM_DESTINATION_OR_TIMEZONE_CONFIGURATION_INVALID");
 if(!ID.test(String(config?.instagramBusinessAccountId??""))||!ID.test(String(config?.facebookPageId??""))) blockers.push("OWNER_VERIFIED_INSTAGRAM_AND_LINKED_PAGE_IDS_REQUIRED");
 if(env.NATURE_FRONTIERS_INSTAGRAM_ACCOUNT_ID!==config?.instagramBusinessAccountId) blockers.push("RUNTIME_INSTAGRAM_ACCOUNT_ID_MISMATCH");
 if(env.NATURE_FRONTIERS_FACEBOOK_PAGE_ID!==config?.facebookPageId) blockers.push("RUNTIME_LINKED_FACEBOOK_PAGE_ID_MISMATCH");
 if(typeof env.INSTAGRAM_APPROVAL_HMAC_SECRET!=="string"||Buffer.byteLength(env.INSTAGRAM_APPROVAL_HMAC_SECRET,"utf8")<32) blockers.push("INSTAGRAM_APPROVAL_HMAC_SECRET_MISSING_OR_TOO_SHORT");
 if(!payload||typeof payload!=="object"||Array.isArray(payload)) blockers.push("INSTAGRAM_CANDIDATE_MALFORMED");
 if(blockers.length) return {approved:false,blockers};
 if(payload.destination!=="nature_frontiers_instagram"||payload.instagramAccountId!==config.instagramBusinessAccountId||payload.facebookPageId!==config.facebookPageId)
  blockers.push("INSTAGRAM_DESTINATION_OR_ACCOUNT_BINDING_MISMATCH");
 if(typeof payload.slotId!=="string"||!payload.slotId.trim()) blockers.push("DURABLE_SLOT_ID_REQUIRED");
 if(payload.timezone!==config.timezone||!isValidZonedIsoTimestamp(payload.scheduledAt)||Date.parse(payload.scheduledAt)<=Date.parse(now))
  blockers.push("FUTURE_JOHANNESBURG_PUBLICATION_TIME_REQUIRED");
 if(!["reel","feed_post"].includes(payload.mediaType)) blockers.push("UNSUPPORTED_INSTAGRAM_FORMAT");
 if(typeof payload.caption!=="string"||!payload.caption.trim()||payload.sourcePayload?.caption!==payload.caption||
    payload.sourcePayload?.destination!=="nature_frontiers_facebook"||payload.sourcePayload?.destinationPageId!==config.facebookPageId||payload.sourcePayload?.mediaType!==payload.mediaType||
    !Array.isArray(payload.sourcePayload?.media)||!payload.media||typeof payload.media.path!=="string"||
    !/^[a-f0-9]{64}$/.test(payload.media.sha256??"")||
    !payload.sourcePayload.media.some(x=>x?.path===payload.media.path&&x?.sha256===payload.media.sha256))
  blockers.push("FACEBOOK_SOURCE_POLICY_PAYLOAD_OR_MEDIA_BINDING_MISMATCH");
 if(payload.shareToFeed!=null&&typeof payload.shareToFeed!=="boolean") blockers.push("INVALID_SHARE_TO_FEED_SETTING");
 if(payload.mediaType==="feed_post") {
  let url;try{url=new URL(payload.media?.url);}catch{}
  const host=url?.hostname?.toLowerCase()??"";
  const allowed=Array.isArray(config.allowedImageDomains)&&config.allowedImageDomains.some(domain=>host===String(domain).toLowerCase()||host.endsWith("."+String(domain).toLowerCase()));
  if(!url||url.protocol!=="https:"||url.username||url.password||url.port||url.search||url.hash||!allowed)
   blockers.push("PUBLIC_FEED_IMAGE_MUST_USE_AN_ALLOWLISTED_HTTPS_HOST");
 }
 if(blockers.length) return {approved:false,blockers};
 const sourceApproval=verifyFacebookAutonomousApprovalReceipt(payload.sourcePayload,{secret:env.FACEBOOK_APPROVAL_HMAC_SECRET,now});
 if(!sourceApproval.valid) return {approved:false,blockers:["FACEBOOK_SOURCE_HUMAN_APPROVAL_SIGNATURE_INVALID"],approvalErrors:sourceApproval.errors};
 const policy=await policyEvaluator(payload.sourcePayload,{
  expectedPageId:config.facebookPageId,expectedPageName:config.facebookPageName??"Nature Frontiers SA",
  history:[],evidenceRoot,now,timezone:config.timezone,
  maxPostsPerLocalDay:999,maxReelsPerLocalDay:999,maxFeedPostsPerLocalDay:999,minimumIntervalMinutes:0
 });
 if(policy?.eligible!==true) return {approved:false,blockers:["FACEBOOK_SOURCE_EDITORIAL_AND_RIGHTS_POLICY_NOT_ELIGIBLE"],policy};
 const approval=createInstagramApprovalReceipt(payload,{reviewer,reason,secret:env.INSTAGRAM_APPROVAL_HMAC_SECRET,now});
 return {approved:true,payload:{...payload,approval},policy,reviewer,approvedAt:now,publishingEnabled:false};
}
