import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const copiedFiles=["config/weekly-content-plan.json","content/queue.json",".github/workflows/generate-long-form-narration.yml",".github/workflows/free-narration-artifact.yml","scripts/schedule-policy.mjs"];
test("authoritative validator accepts rolling cycle policy and draft-only fallback",()=>{
 const result=spawnSync(process.execPath,["scripts/validate-schedule.mjs"],{cwd:repoRoot,encoding:"utf8"});
 assert.equal(result.status,0,result.stdout+result.stderr);
 assert.match(result.stdout,/PASS: rolling long_form, long_form, short cycle/);
 assert.match(result.stdout,/BLOCKED — LIVE HISTORY/);
});
function runWithPlanMutation(mutate){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),"sonicvhibez-schedule-"));
 try{
  for(const file of copiedFiles){const target=path.join(temp,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(repoRoot,file),target);}
  const planPath=path.join(temp,"config/weekly-content-plan.json");const plan=JSON.parse(fs.readFileSync(planPath,"utf8"));const queuePath=path.join(temp,"content/queue.json");const queue=JSON.parse(fs.readFileSync(queuePath,"utf8"));mutate(plan,queue);fs.writeFileSync(planPath,JSON.stringify(plan,null,2));fs.writeFileSync(queuePath,JSON.stringify(queue,null,2));
  return spawnSync(process.execPath,[path.join(repoRoot,"scripts/validate-schedule.mjs")],{cwd:temp,encoding:"utf8"});
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
test("validator surfaces the mathematically incompatible weekly target and requires an owner decision",()=>{
 const result=spawnSync(process.execPath,["scripts/validate-schedule.mjs"],{cwd:repoRoot,encoding:"utf8"});
 assert.equal(result.status,0,result.stdout+result.stderr);
 assert.match(result.stdout,/BLOCKED — CADENCE DECISION/);
 assert.match(result.stdout,/2 long-form \+ 1 Short per week conflicts with 72-hour spacing/);
});
test("validator rejects missing or falsely approved cadence decisions",()=>{
 const missing=runWithPlanMutation(plan=>{delete plan.cadenceDecision;});
 assert.notEqual(missing.status,0);assert.match(missing.stderr,/cadenceDecision must explicitly record owner decision status/);
 const falseApproval=runWithPlanMutation(plan=>{plan.cadenceDecision.status="OWNER_APPROVED";plan.cadenceDecision.ownerApproved=false;});
 assert.notEqual(falseApproval.status,0);assert.match(falseApproval.stderr,/OWNER_APPROVED status requires ownerApproved=true/);
});
test("validator rejects stale weekly-count fields",()=>{
 const result=runWithPlanMutation(plan=>{plan.targetCadence={longFormVideosPerWeek:2,shortsPerWeek:1,totalVideosPerWeek:3};});
 assert.notEqual(result.status,0);assert.match(result.stderr,/stale weekly-count cadence fields must be removed/);
});
test("validator rejects any draft fallback cyclic gap shorter than 72 hours",()=>{
 const result=runWithPlanMutation(plan=>{plan.schedule[1].day="Thursday";plan.schedule[1].cronUtc="0 15 * * 4";});
 assert.notEqual(result.status,0);assert.match(result.stderr,/draft-preparation fallback contains a cyclic gap shorter than 72 hours/);
});
test("validator rejects incorrect weekday, UTC time and format",()=>{
 const weekday=runWithPlanMutation(plan=>{plan.schedule[0].day="Wednesday";});
 assert.notEqual(weekday.status,0);assert.match(weekday.stderr,/draft-preparation fallback missing Tuesday/);
 const time=runWithPlanMutation(plan=>{plan.schedule[0].cronUtc="0 16 * * 2";});
 assert.notEqual(time.status,0);assert.match(time.stderr,/Tuesday cronUtc must be 0 15/);
 const format=runWithPlanMutation(plan=>{plan.schedule[0].format="short";});
 assert.notEqual(format.status,0);assert.match(format.stderr,/Tuesday format must be long_form/);
});
test("validator rejects incorrect cycle order, duration and unsafe publishing",()=>{
 const order=runWithPlanMutation(plan=>{plan.publicationCycle.formats=["long_form","short","long_form"];});
 assert.notEqual(order.status,0);assert.match(order.stderr,/publicationCycle formats must be long_form/);
 const duration=runWithPlanMutation(plan=>{plan.schedule[1].targetDurationSeconds.max=75;});
 assert.notEqual(duration.status,0);assert.match(duration.stderr,/Saturday Short must target 50–60 seconds/);
 const publishing=runWithPlanMutation(plan=>{plan.publishingEnabled=true;});
 assert.notEqual(publishing.status,0);assert.match(publishing.stderr,/publishing must remain disabled/);
});
test("validator accepts a non-default minimum gap when schedule, queue and derived cycle agree",()=>{
 const result=runWithPlanMutation((plan,queue)=>{
  plan.minimumPublicationSpacingHours=96;
  plan.spacingPolicy.minimumHoursBetweenPosts=96;
  plan.spacingPolicy.minimumCycleHours=288;
  plan.spacingPolicy.explanation="Test configuration: a 96-hour gap requires 288 hours across three cyclic gaps.";
  plan.publicationCycle.minimumHoursBetweenConsecutivePublications=96;
  plan.publicationCycle.minimumCycleHours=288;
  plan.publicationCycle.description="Test configuration: long-form, long-form, Short with 96 elapsed hours between actual publications.";
  queue.cadence.minimumHoursBetweenConsecutivePublications=96;
  queue.cadence.minimumCycleHours=288;
 });
 assert.equal(result.status,0,result.stdout+result.stderr);
});
