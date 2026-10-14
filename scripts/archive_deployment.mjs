import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {EVIDENCE,client,chainCheck,jsonFile,reportError} from './network.mjs';
try{
 const old=jsonFile('deployment.json');
 const version=old?.contractRevision==='PARTITION_SEAL_V2_ESCROW'?'v2':'v1';
 const destination=path.join(EVIDENCE,'archive','partition-seal-'+version+'.json');
 if(!old&&fs.existsSync(destination)){console.log('V1_ALREADY_ARCHIVED');}
 else{
  if(!['PARTITION_SEAL_V1','PARTITION_SEAL_V2_ESCROW'].includes(old?.contractRevision))throw new Error('Only verified prior revisions may be archived');
  const reader=client();await chainCheck(reader);
  const balance=BigInt(await reader.request({method:'eth_getBalance',params:[old.contractAddress,'latest']}));
  const code=await reader.getContractCode(old.contractAddress);
  if(balance!==0n||createHash('sha256').update(code).digest('hex')!==old.sourceSHA256)throw new Error('Legacy liability/source mismatch');
  const accounting=version==='v2'?await reader.readContract({address:old.contractAddress,functionName:'get_accounting',args:[],stateStatus:'finalized'}):null;
  const ledger=typeof accounting==='string'?JSON.parse(accounting):accounting;
  if(ledger&&ledger.liability_gen!=='0')throw new Error('Outstanding old escrow/credit');
  const archive={status:version==='v1'?'SUPERSEDED_NONCUSTODIAL':'SUPERSEDED_RECOVERY_RESTRICTION',reason:version==='v1'?'Owner approved paid escrow':'Holder-only recovery violates actor-abandonment guarantee; all paid escrow/credits recovered before V3',
   archivedAt:new Date().toISOString(),nativeBalanceGen:'0',deployment:old,
   accounting:ledger,payments:jsonFile('payments.json'),lifecycle:jsonFile('lifecycle.json'),recovery:jsonFile('recovery.json'),consensus:jsonFile('consensus.json'),validatorDiagnostic:jsonFile('validator-diagnostic.json')};
  if(fs.existsSync(destination))throw new Error('Archive exists; reconcile exact prior migration');
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(archive,null,2)+'\n');
  for(const name of ['deployment.json','payments.json','lifecycle.json','recovery.json','consensus.json','validator-diagnostic.json']){
   const original=path.join(EVIDENCE,name);if(fs.existsSync(original))fs.unlinkSync(original);
  }
  console.log(JSON.stringify({status:version.toUpperCase()+'_ARCHIVED',contractAddress:old.contractAddress,nativeBalanceGen:'0',recoverableEvidence:true}));
 }
}catch(e){reportError(e);}
