import {actors,client,chainCheck,finalized,read,jsonFile,save,reportError,EXPLORER} from './network.mjs';
try {
 const deployment=jsonFile('deployment.json');
 if(deployment?.executionResult!=='SUCCESS'||deployment.network!=='studionet')throw new Error('Verified deployment required');
 const address=deployment.contractAddress, reader=client();await chainCheck(reader);
 const accounts=actors(), signer=client(accounts[0]);
 let record=jsonFile('recovery.json')??{network:'studionet',chainId:61999,contractAddress:address,sourceCommit:deployment.sourceCommit,sourceSHA256:deployment.sourceSHA256,
  rootId:'partition-recovery-'+deployment.sourceSHA256.slice(0,8),rootExpiry:Math.floor(Date.now()/1000)+300,steps:{},canonicalReads:{}};
 if(record.contractAddress!==address)throw new Error('Recovery identity mismatch');
 async function step(name,functionName,args){
  const existing=record.steps[name];
  if(existing?.status==='FINALIZED'&&existing?.executionResult==='SUCCESS')return;
  const hash=existing?.transactionHash??await signer.writeContract({address,functionName,args});
  record.steps[name]={transactionHash:hash,status:'SUBMITTED',functionName,valueGen:'0'};save('recovery.json',record);
  console.log(JSON.stringify({step:name,status:'SUBMITTED',transactionHash:hash}));
  const receipt=await finalized(reader,hash);
  record.steps[name]={...record.steps[name],...receipt,explorerUrl:EXPLORER+'/tx/'+hash};save('recovery.json',record);
  console.log(JSON.stringify({step:name,status:receipt.status,executionResult:receipt.executionResult}));
 }
 const root=record.rootId;
 await step('create','create_root',[root,'archive','May inspect the archive privately with attribution; no distribution.','May print the archive privately with attribution; no distribution.',record.rootExpiry]);
 if(!record.proposalDeadline){record.proposalDeadline=Math.floor(Date.now()/1000)+90;save('recovery.json',record);}
 await step('propose','propose_partition',[root,accounts[1].address,'May inspect the archive privately with attribution; no distribution.',accounts[2].address,'May print the archive privately with attribution; no distribution.',record.proposalDeadline]);
 const frozen=await read(reader,address,'get_root',[root]);const pid=frozen.proposal_id;
 record.proposalId=pid;
 record.canonicalReads.frozen={root:frozen,U0:await read(reader,address,'get_authority',[root+':U0']),U1:await read(reader,address,'get_authority',[root+':U1'])};save('recovery.json',record);
 async function waitUntil(time,label){
  while(Math.floor(Date.now()/1000)<time+2){
   const remaining=time+2-Math.floor(Date.now()/1000);
   console.log(JSON.stringify({waitingFor:label,remainingSeconds:remaining}));
   await new Promise(resolve=>setTimeout(resolve,Math.min(remaining,20)*1000));
  }
 }
 await waitUntil(record.proposalDeadline,'proposal expiry');
 await step('expire','expire_proposal',[pid]);
 const restored=await read(reader,address,'get_root',[root]);
 const u0=await read(reader,address,'get_authority',[root+':U0']),u1=await read(reader,address,'get_authority',[root+':U1']);
 if(restored.status!=='ACTIVE'||u0.consumed||u1.consumed||u0.owner.toLowerCase()!==accounts[0].address.toLowerCase()||u1.owner.toLowerCase()!==accounts[0].address.toLowerCase())throw new Error('Original authority not restored');
 record.canonicalReads.restored={root:restored,proposal:await read(reader,address,'get_proposal',[pid]),U0:u0,U1:u1};save('recovery.json',record);
 await waitUntil(record.rootExpiry,'root expiry');
 await step('close','close_root',[root]);
 const closed=await read(reader,address,'get_root',[root]);
 const final0=await read(reader,address,'get_authority',[root+':U0']),final1=await read(reader,address,'get_authority',[root+':U1']);
 if(closed.status!=='CLOSED'||final0.active||final1.active)throw new Error('Expired root remained active');
 record.canonicalReads.closed={root:closed,U0:final0,U1:final1};record.complete=true;record.verifiedAt=new Date().toISOString();save('recovery.json',record);
 console.log(JSON.stringify({recovery:'EXPIRED_PROPOSAL_RESTORED_ROOT_THEN_CLOSED',complete:true}));
}catch(e){reportError(e);}
