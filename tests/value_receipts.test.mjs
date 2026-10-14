import test from 'node:test';
import assert from 'node:assert/strict';
import {valueReceipt,assertValueReceipt} from '../scripts/value_receipts.mjs';
import {safeSdk} from '../scripts/network.mjs';
const sender='0x'+'a'.repeat(40),recipient='0x'+'b'.repeat(40),parentHash='0x'+'c'.repeat(64);
const expected={sender,recipient,valueGen:'1',parentHash};
const raw={status:'FINALIZED',from_address:sender,to_address:recipient,value:'1000000000000000000',triggered_by:parentHash};
test('native child without GenVM execution result still requires complete bound proof',()=>{
 const safe=valueReceipt({...raw,node_config:{private_key:'NEVER_PROJECT'}},parentHash);
 assertValueReceipt(safe,expected);assert.equal(JSON.stringify(safe).includes('NEVER_PROJECT'),false);
});
for(const mutation of [{status:'PENDING'},{from_address:recipient},{to_address:sender},{value:'1'},{triggered_by:'wrong'},{execution_result:'ERROR'},{error:{message:'private'}}]){
 test('native proof rejects incomplete binding '+Object.keys(mutation)[0],()=>assert.throws(()=>assertValueReceipt(valueReceipt({...raw,...mutation},parentHash),expected)));
}
test('concurrent SDK calls keep raw logs suppressed until the last call finishes',async()=>{
 const original={error:console.error,warn:console.warn,log:console.log};
 const leaked=[],safe=[];
 const capture=(...args)=>leaked.push(args);
 console.error=console.warn=capture;console.log=value=>safe.push(value);
 try{
  let release;const gate=new Promise(resolve=>release=resolve);
  const slow=safeSdk(async()=>{await gate;console.error('fixture never expose');});
  await safeSdk(async()=>{console.warn('fixture never expose');});
  console.error('fixture never expose');release();await slow;
  assert.equal(leaked.length,0);assert.equal(safe.length,3);
  assert.equal(console.error,capture);assert.equal(console.warn,capture);
 }finally{Object.assign(console,original);}
});
test('SDK exception propagates and console is restored after redaction',async()=>{
 const original={error:console.error,warn:console.warn,log:console.log};
 const failure=new Error('unit failure');const safe=[];
 console.log=value=>safe.push(value);
 try{
  await assert.rejects(safeSdk(async()=>{console.error('fixture never expose');throw failure;}),error=>error===failure);
  assert.equal(console.error,original.error);assert.equal(console.warn,original.warn);
  assert.equal(safe.length,1);
 }finally{Object.assign(console,original);}
});
