import test from "node:test";
import assert from "node:assert/strict";
import {approveInstagramCandidate} from "../scripts/instagram-approval-service.mjs";
import {verifyInstagramApprovalReceipt} from "../scripts/instagram-autonomous-publisher.mjs";
import {createFacebookAutonomousApprovalReceipt} from "../scripts/facebook-policy-engine.mjs";

const account="123456789012345",page="1431329126735709",secret="i".repeat(40),fbSecret="f".repeat(40);
const config={destination:"nature_frontiers_instagram",timezone:"Africa/Johannesburg",instagramBusinessAccountId:account,
 facebookPageId:page,facebookPageName:"Nature Frontiers SA",allowedImageDomains:["example.test"]};
const env={INSTAGRAM_APPROVAL_HMAC_SECRET:secret,FACEBOOK_APPROVAL_HMAC_SECRET:fbSecret,NATURE_FRONTIERS_INSTAGRAM_ACCOUNT_ID:account,NATURE_FRONTIERS_FACEBOOK_PAGE_ID:page};
function payload(){
 const sourcePayload={destination:"nature_frontiers_facebook",destinationPageId:page,slotId:"slot-1",scheduledAt:"2026-11-15T12:00:00.000+02:00",
  caption:"A sourced wildlife fact.",mediaType:"reel",timezone:"Africa/Johannesburg",
  media:[{path:"media/reel.mp4",sha256:"a".repeat(64)}],claims:[]};
 sourcePayload.approval=createFacebookAutonomousApprovalReceipt(sourcePayload,{reviewer:"Facebook editor",reason:"Source approved",secret:fbSecret,now:"2026-11-15T09:00:00.000Z"});
 return {destination:"nature_frontiers_instagram",slotId:"slot-1",scheduledAt:"2026-11-15T12:00:00.000+02:00",
  timezone:"Africa/Johannesburg",mediaType:"reel",caption:sourcePayload.caption,media:{path:"media/reel.mp4",sha256:"a".repeat(64)},
  instagramAccountId:account,facebookPageId:page,sourcePayload};
}
const eligible=async()=>({eligible:true,reason:"test"});
test("authenticated Instagram approval binds exact account, schedule, caption and source payload",async()=>{
 const candidate=payload();const result=await approveInstagramCandidate({payload:candidate,reviewer:"Dashboard operator",reason:"Reviewed exact Instagram version",
  config,env,now:"2026-11-15T09:00:00.000Z",policyEvaluator:eligible});
 assert.equal(result.approved,true);
 const verified=verifyInstagramApprovalReceipt(result.payload,{secret,now:"2026-11-15T09:00:00.000Z"});
 assert.equal(verified.valid,true);assert.equal(result.publishingEnabled,false);
});
test("Instagram approval blocks mismatched account, Page, source payload and non-future schedule",async()=>{
 const candidate=payload();candidate.instagramAccountId="999999999999999";
 const result=await approveInstagramCandidate({payload:candidate,reviewer:"Operator",reason:"Reviewed",config,env,
  now:"2026-11-15T09:00:00.000Z",policyEvaluator:eligible});
 assert.equal(result.approved,false);assert.ok(result.blockers.includes("INSTAGRAM_DESTINATION_OR_ACCOUNT_BINDING_MISMATCH"));
});
test("Instagram approval requires the Facebook source payload to pass the existing rights and editorial policy",async()=>{
 const result=await approveInstagramCandidate({payload:payload(),reviewer:"Operator",reason:"Reviewed",config,env,
  now:"2026-11-15T09:00:00.000Z",policyEvaluator:async()=>({eligible:false,blockers:["rights evidence missing"]})});
 assert.equal(result.approved,false);assert.ok(result.blockers.includes("FACEBOOK_SOURCE_EDITORIAL_AND_RIGHTS_POLICY_NOT_ELIGIBLE"));
});
test("Instagram feed approval requires an allowlisted public image host",async()=>{
 const candidate=payload();candidate.mediaType="feed_post";candidate.media.url="https://evil.example.net/image.jpg";
 const result=await approveInstagramCandidate({payload:candidate,reviewer:"Operator",reason:"Reviewed",config:{...config,allowedImageDomains:["example.test"]},env,
  now:"2026-11-15T09:00:00.000Z",policyEvaluator:eligible});
 assert.equal(result.approved,false);assert.ok(result.blockers.includes("PUBLIC_FEED_IMAGE_MUST_USE_AN_ALLOWLISTED_HTTPS_HOST"));
});
