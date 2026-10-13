import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeReceipt,assertSuccessful} from '../scripts/receipts.mjs';
const address='0x'+'a'.repeat(40), hash='0x'+'b'.repeat(64);
test('raw Studio successful leader and finality projected without config',()=>{
 const safe=summarizeReceipt({status:'FINALIZED',result_name:'MAJORITY_AGREE',data:{contract_address:address},consensus_data:{leader_receipt:[{execution_result:'SUCCESS',node_config:{private_key:'DO_NOT_PROJECT'}}]}},hash);
 assert.equal(assertSuccessful(safe).contractAddress,address);
 assert.equal(JSON.stringify(safe).includes('DO_NOT_PROJECT'),false);
});
test('normalized SDK success and numeric finalized shape',()=>{
 const safe=summarizeReceipt({status:7,resultName:'MAJORITY_AGREE',txExecutionResultName:'SUCCESS',txDataDecoded:{contractAddress:address}},hash);
 assert.equal(assertSuccessful(safe).status,'FINALIZED');
});
for(const fixture of [
 {status:'FINALIZED',execution_result:'ERROR'}, {status:'FINALIZED'},
 {status:'ACCEPTED',execution_result:'SUCCESS'},
 {status:'FINALIZED',execution_result:'SUCCESS',result_name:'UNDETERMINED'},
 {status:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'ERROR'}]}},
]) test('failure/missing/pending result never becomes success '+JSON.stringify(fixture),()=>{
 assert.throws(()=>assertSuccessful(summarizeReceipt(fixture,hash)));
});
