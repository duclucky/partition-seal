import test from 'node:test';
import assert from 'node:assert/strict';
import {valueReceipt,assertValueReceipt} from '../scripts/value_receipts.mjs';
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
