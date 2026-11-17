import test from "node:test";
import assert from "node:assert/strict";
import { buildInterstitialCalendar, validateInterstitialCandidate } from "../scripts/nature-frontiers-interstitial-content.mjs";
import { NATURE_FRONTIERS_REQUIRED_POST_LINKS } from "../scripts/facebook-policy-engine.mjs";

const candidate=(overrides={})=>({
 id:"nf-photo-lion-001",brand:"Nature Frontiers",type:"wildlife_photo",title:"A lion's quiet signal",
 caption:"A closer look at how lions communicate. What detail would you notice first? Affiliate disclosure: we may earn a commission. " + NATURE_FRONTIERS_REQUIRED_POST_LINKS.join(" "),
 original:true,status:"approved",createdAt:"2026-11-01T00:00:00Z",
 media:{path:"media/nature-frontiers/lion.jpg",sha256:"a".repeat(64),altText:"Adult lion resting in golden grass"},
 claims:[{text:"Lions use scent marking to communicate territorial information.",sources:["https://www.nationalgeographic.com/animals/mammals/facts/lion"]}],
 rights:{status:"cleared",evidence:["https://example.org/licence"]},
 approval:{status:"approved",reviewer:"editor",receiptUrl:"https://example.org/approval"},
 ...overrides
});
const videos=[
 {brand:"Nature Frontiers",status:"scheduled",scheduledAt:"2026-11-18T06:00:00Z"},
 {brand:"Nature Frontiers",status:"scheduled",scheduledAt:"2026-11-20T06:00:00Z"},
 {brand:"Nature Frontiers",status:"scheduled",scheduledAt:"2026-11-22T06:00:00Z"}
];

test("holds any candidate without explicit rights, source evidence and human approval",()=>{
 const item=candidate({rights:{status:"not_assessed",evidence:[]},approval:{status:"pending"}});
 assert.ok(validateInterstitialCandidate(item).length>=2);
});
test("proposes approved original wildlife photo only in a real gap and never enables publishing",()=>{
 const plan=buildInterstitialCalendar({videos,candidates:[candidate()],now:"2026-11-17T00:00:00Z"});
 assert.equal(plan.placements.length,1);
 assert.equal(plan.placements[0].status,"PROPOSED_NOT_SCHEDULED");
 assert.equal(plan.placements[0].publishReady,false);
 assert.equal(plan.policy.publishEnabled,false);
});
test("holds text claims with missing sources and duplicate IDs",()=>{
 const plan=buildInterstitialCalendar({videos,candidates:[candidate({type:"animal_fact",media:null}),candidate({type:"animal_fact",media:null,claims:[{text:"A fact"}]})],now:"2026-11-17T00:00:00Z"});
 assert.equal(plan.placements.length,1);
 assert.ok(plan.decisions.some(x=>x.status==="HELD"));
});
test("does not exceed weekly cap or schedule more than one item per local day",()=>{
 const items=[candidate(),candidate({id:"nf-fact-002",type:"animal_fact",media:null}),candidate({id:"nf-text-003",type:"wildlife_text",media:null})];
 const plan=buildInterstitialCalendar({videos:[...videos,{brand:"Nature Frontiers",status:"scheduled",scheduledAt:"2026-11-24T06:00:00Z"}],candidates:items,now:"2026-11-17T00:00:00Z",maxPerWeek:1});
 assert.ok(plan.placements.length<=1);
 assert.equal(new Set(plan.placements.map(x=>x.localDate)).size,plan.placements.length);
});
test("rejects unknown brand and malformed video schedule",()=>{
 assert.throws(()=>buildInterstitialCalendar({videos:[{brand:"SonicVhibez",status:"scheduled",scheduledAt:"2026-11-18T06:00:00Z"}],candidates:[]}));
});
