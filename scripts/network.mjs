import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClient,createAccount} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionStatus} from 'genlayer-js/types';
import {summarizeReceipt,assertSuccessful} from './receipts.mjs';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const EVIDENCE=path.join(ROOT,'docs/evidence/studionet');
export const ENDPOINT='https://studio.genlayer.com/api';
export const EXPLORER='https://explorer-studio.genlayer.com';
export function jsonFile(name) {
 const p=path.join(EVIDENCE,name);
 return fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):null;
}
export function save(name,value){
 fs.mkdirSync(EVIDENCE,{recursive:true});
 fs.writeFileSync(path.join(EVIDENCE,name+'.tmp'),JSON.stringify(value,null,2)+'\n');
 fs.renameSync(path.join(EVIDENCE,name+'.tmp'),path.join(EVIDENCE,name));
}
function env(){
 const values={};
 for(const p of [path.join(ROOT,'..','.env'),path.join(ROOT,'.env')]){
  if(!fs.existsSync(p))continue;
  for(const line of fs.readFileSync(p,'utf8').split(/\r?\n/)){
   const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
   if(m)values[m[1]]=m[2].replace(/^['"]|['"]$/g,'');
  }
 }
 return values;
}
export function actors(){
 const values=env();
 const names=['STUDIONET_PRIVATE_KEY','STUDIONET_STEWARD_PRIVATE_KEY','STUDIONET_INTEGRATOR_PRIVATE_KEY'];
 const accounts=names.map(n=>{
  const v=values[n];if(!/^(0x)?[0-9a-f]{64}$/i.test(v??''))throw new Error('Required authorized actor key unavailable');
  return createAccount(v.startsWith('0x')?v:'0x'+v);
 });
 if(new Set(accounts.map(a=>a.address.toLowerCase())).size!==3)throw new Error('Three distinct authorized actors required');
 return accounts;
}
export const client=account=>createClient({chain:studionet,endpoint:ENDPOINT,...(account?{account}:{})});
export async function chainCheck(reader){
 if(studionet.id!==61999||Number(BigInt(await reader.request({method:'eth_chainId',params:[]})))!==61999)throw new Error('Wrong network identity');
}
export async function finalized(reader,hash){
 const receipt=await reader.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:4000,retries:100});
 return assertSuccessful(summarizeReceipt(receipt,hash));
}
export async function read(reader,address,functionName,args=[]){
 const value=await reader.readContract({address,functionName,args,stateStatus:'finalized'});
 return typeof value==='string'?JSON.parse(value):value;
}
export function reportError(e){
 // Never print SDK exceptions: they may embed complete transactions/validator configs.
 console.log(JSON.stringify({failed:true,errorType:e?.name==='TimeoutError'?'TimeoutError':'OperationError',detail:'Inspect persisted safe operation state; no automatic replay.'}));
 process.exitCode=1;
}
