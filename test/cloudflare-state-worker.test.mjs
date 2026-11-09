import test from "node:test";
import assert from "node:assert/strict";
import { constantTimeEqual, handleRequest, operatorIdentity, validateDashboardState } from "../cloudflare/worker.js";

const TOKEN="test-operator-token-that-is-long-enough";
const ACTOR="sonicvhibez-owner";
const state=(items=[])=>({version:1,queueItems:items,audit:[],jobs:[],uploads:[],campaigns:[],publishingEnabled:false});
class Statement {
  constructor(db,sql){this.db=db;this.sql=sql;this.values=[]}
  bind(...v){this.values=v;return this}
  first(){return this.db.first(this.sql,this.values)}
  run(){return this.db.run(this.sql,this.values)}
  all(){return this.db.all(this.sql,this.values)}
}
class MemoryD1 {
  constructor(){this.row=null;this.backups=[]}
  prepare(sql){return new Statement(this,sql)}
  async first(sql,v){
    if(sql.includes("FROM dashboard_state")) return this.row?{...this.row}:null;
    if(sql.includes("FROM dashboard_backups WHERE backup_id")){
      const b=this.backups.find(x=>x.backup_id===v[0]);
      return b?{state_json:b.state_json,sha256:b.sha256}:null;
    }
    throw Error("Unexpected first SQL: "+sql);
  }
  async all(sql){
    if(!sql.includes("FROM dashboard_backups")) throw Error("Unexpected all SQL: "+sql);
    return {results:this.backups.map(({backup_id,source_revision,sha256,created_at,reason})=>({backup_id,source_revision,sha256,created_at,reason}))};
  }
  async run(sql,v){
    if(sql.startsWith("INSERT OR IGNORE INTO dashboard_state")){
      if(this.row)return {meta:{changes:0}};
      const [singleton_id,state_json,updated_at]=v; const revision=1;
      this.row={singleton_id,revision,state_json,updated_at};return {meta:{changes:1}};
    }
    if(sql.includes("INSERT INTO dashboard_backups")&&sql.includes("SELECT ?, revision, state_json")){
      const [backup_id,sha256,created_at,actor,singleton_id,expected]=v;
      if(!this.row||this.row.singleton_id!==singleton_id||this.row.revision!==expected)return {meta:{changes:0}};
      this.backups.push({backup_id,source_revision:this.row.revision,state_json:this.row.state_json,sha256,created_at,reason:"AUTOMATIC_PRE_UPDATE:"+actor});
      return {meta:{changes:1}};
    }
    if(sql.startsWith("UPDATE dashboard_state")){
      const [state_json,updated_at,singleton_id,expected]=v;
      if(!this.row||this.row.singleton_id!==singleton_id||this.row.revision!==expected)return {meta:{changes:0}};
      this.row={...this.row,revision:this.row.revision+1,state_json,updated_at};return {meta:{changes:1}};
    }
    if(sql.startsWith("INSERT INTO dashboard_backups")&&sql.includes("VALUES")){
      const [backup_id,source_revision,state_json,sha256,created_at,reason]=v;
      this.backups.push({backup_id,source_revision,state_json,sha256,created_at,reason});return {meta:{changes:1}};
    }
    throw Error("Unexpected run SQL: "+sql);
  }
  async batch(stmts){
    const row=this.row&&{...this.row}, backups=this.backups.map(x=>({...x}));
    try{const out=[];for(const s of stmts)out.push(await this.run(s.sql,s.values));return out}
    catch(e){this.row=row;this.backups=backups;throw e}
  }
}
const env=(db=new MemoryD1())=>({STATE_DB:db,DASHBOARD_OPERATOR_TOKEN:TOKEN,DASHBOARD_OPERATOR_ID:"  "+ACTOR+"  "});
const req=(path,method="GET",value,headers={})=>new Request("https://worker.test"+path,{
  method,headers:{...(path.startsWith("/api/")?{"x-operator-token":TOKEN}:{}),...headers,...(value===undefined?{}:{"content-type":"application/json"})},
  ...(value===undefined?{}:{body:JSON.stringify(value)})
});
const json=r=>r.json();

test("constant-time comparison rejects unequal tokens and lengths",()=>{
  assert.equal(constantTimeEqual("secret","secret"),true);
  assert.equal(constantTimeEqual("secret","secreT"),false);
  assert.equal(constantTimeEqual("secret","secret-long"),false);
});
test("operator identity is trimmed and length bounded",()=>{
  assert.equal(operatorIdentity({DASHBOARD_OPERATOR_ID:" owner "}),"owner");
  assert.equal(operatorIdentity({DASHBOARD_OPERATOR_ID:" "}),null);
  assert.equal(operatorIdentity({DASHBOARD_OPERATOR_ID:"x".repeat(121)}),null);
});
test("state schema requires core arrays and rejects publication or active Safari",()=>{
  assert.equal(validateDashboardState(state()).publishingEnabled,false);
  assert.throws(()=>validateDashboardState({version:1,audit:[],jobs:[],uploads:[]}),/queueItems/);
  assert.throws(()=>validateDashboardState({...state(),publicPublishingEnabled:true}),/Publishing must remain disabled/);
  assert.throws(()=>validateDashboardState({...state(),campaigns:[{type:"safari_affiliate",status:"ACTIVE"}]}),/Safari affiliate campaigns/);
});
test("health endpoint is public; API endpoints require operator token",async()=>{
  const e=env();
  const h=await handleRequest(new Request("https://worker.test/healthz"),e);
  assert.equal(h.status,200);assert.equal((await json(h)).publishingEnabled,false);
  const denied=await handleRequest(new Request("https://worker.test/api/state"),e);
  assert.equal(denied.status,401);
});
test("bootstrap is one-time, audited, and readable",async()=>{
  const e=env();
  const first=await handleRequest(req("/api/state/bootstrap","POST",state(["draft-a"])),e);
  assert.equal(first.status,201);
  const b=await json(first);assert.equal(b.revision,1);
  assert.equal(b.state.audit[0].action,"DASHBOARD_STATE_BOOTSTRAPPED");
  assert.equal(b.state.audit[0].actor,ACTOR);
  assert.equal((await handleRequest(req("/api/state/bootstrap","POST",state()),e)).status,409);
  const read=await handleRequest(req("/api/state"),e);
  assert.equal(read.status,200);assert.equal(read.headers.get("etag"),'"1"');
  assert.deepEqual((await json(read)).state.queueItems,["draft-a"]);
});
test("state updates create immutable pre-update backups and reject stale revisions",async()=>{
  const db=new MemoryD1(),e=env(db);
  await handleRequest(req("/api/state/bootstrap","POST",state(["before"])),e);
  const updated=await handleRequest(req("/api/state","PUT",state(["after"]),{"if-match":'"1"'}),e);
  assert.equal(updated.status,200);assert.equal((await json(updated)).revision,2);
  assert.equal(db.backups.length,1);assert.equal(db.backups[0].source_revision,1);
  assert.equal(db.backups[0].reason,"AUTOMATIC_PRE_UPDATE:"+ACTOR);
  assert.match(db.backups[0].sha256,/^[a-f0-9]{64}$/);
  const stale=await handleRequest(req("/api/state","PUT",state(["stale"]),{"if-match":'"1"'}),e);
  assert.equal(stale.status,409);assert.equal(db.row.revision,2);
  assert.deepEqual(JSON.parse(db.row.state_json).queueItems,["after"]);
});
test("operator backup restores prior state with an audit record",async()=>{
  const db=new MemoryD1(),e=env(db);
  await handleRequest(req("/api/state/bootstrap","POST",state(["original"])),e);
  await handleRequest(req("/api/backups","POST"),e);
  const id=db.backups[0].backup_id;
  await handleRequest(req("/api/state","PUT",state(["changed"]),{"if-match":'"1"'}),e);
  const restored=await handleRequest(req("/api/backups/restore","POST",{backupId:id,expectedRevision:2}),e);
  assert.equal(restored.status,200);
  const result=await json(restored);
  assert.equal(result.revision,3);assert.deepEqual(result.state.queueItems,["original"]);
  assert.equal(result.state.audit.at(-1).action,"DASHBOARD_STATE_RESTORED");
  assert.equal(result.state.audit.at(-1).actor,ACTOR);
  assert.equal(db.backups.length,3);
});
test("restore refuses tampered backup bytes",async()=>{
  const db=new MemoryD1(),e=env(db);
  await handleRequest(req("/api/state/bootstrap","POST",state(["original"])),e);
  await handleRequest(req("/api/backups","POST"),e);
  db.backups[0].state_json=JSON.stringify(state(["tampered"]));
  const r=await handleRequest(req("/api/backups/restore","POST",{backupId:db.backups[0].backup_id,expectedRevision:1}),e);
  assert.equal(r.status,409);assert.match((await json(r)).error,/integrity check failed/);
  assert.equal(db.row.revision,1);
});
