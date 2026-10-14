import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {EVIDENCE,client,chainCheck,jsonFile,reportError} from './network.mjs';
try{
 const old=jsonFile('deployment.json');
 const destination=path.join(EVIDENCE,'archive','partition-seal-v1.json');
 if(!old&&fs.existsSync(destination)){console.log('V1_ALREADY_ARCHIVED');}
 else{
  if(old?.contractRevision!=='PARTITION_SEAL_V1')throw new Error('Only verified V1 may be archived by this migration');
  const reader=client();await chainCheck(reader);
  const balance=BigInt(await reader.request({method:'eth_getBalance',params:[old.contractAddress,'latest']}));
  const code=await reader.getContractCode(old.contractAddress);
  if(balance!==0n||createHash('sha256').update(code).digest('hex')!==old.sourceSHA256)throw new Error('Legacy liability/source mismatch');
  const archive={status:'SUPERSEDED_NONCUSTODIAL',reason:'Owner approved V2 purchase escrow and real1-2GEN payment verification',
   archivedAt:new Date().toISOString(),nativeBalanceGen:'0',deployment:old,
   lifecycle:jsonFile('lifecycle.json'),recovery:jsonFile('recovery.json'),consensus:jsonFile('consensus.json'),validatorDiagnostic:jsonFile('validator-diagnostic.json')};
  if(fs.existsSync(destination))throw new Error('Archive exists; reconcile exact prior migration');
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(archive,null,2)+'\n');
  for(const name of ['deployment.json','lifecycle.json','recovery.json','consensus.json','validator-diagnostic.json']){
   const original=path.join(EVIDENCE,name);if(fs.existsSync(original))fs.unlinkSync(original);
  }
  console.log(JSON.stringify({status:'V1_ARCHIVED',contractAddress:old.contractAddress,nativeBalanceGen:'0',recoverableEvidence:true}));
 }
}catch(e){reportError(e);}
