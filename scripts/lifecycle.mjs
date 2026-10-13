import {EXPLORER,actors,client,chainCheck,finalized,read,jsonFile,save,reportError} from './network.mjs';
const U0='May read the registered article for private study with attribution; no distribution.';
const U1='May print the registered article for private study with attribution; no distribution.';
const A='May view the registered article privately with source credit; no sharing.';
const B='May make a paper copy of the registered article for private study with source credit; no sharing.';
try{
 const deployment=jsonFile('deployment.json');
 if(deployment?.network!=='studionet'||deployment.chainId!==61999||deployment.executionResult!=='SUCCESS')throw new Error('Verified deployment required');
 const address=deployment.contractAddress,reader=client();await chainCheck(reader);
 const accounts=actors(),signers=accounts.map(client);
 let record=jsonFile('lifecycle.json')??{network:'studionet',chainId:61999,contractAddress:address,sourceCommit:deployment.sourceCommit,sourceSHA256:deployment.sourceSHA256,
   rootId:'partition-demo-'+deployment.sourceSHA256.slice(0,8),
   holder:accounts[0].address,recipientA:accounts[1].address,recipientB:accounts[2].address,
   rootExpiry:Math.floor(Date.now()/1000)+7200,proposalDeadline:Math.floor(Date.now()/1000)+3600,
   steps:{},canonicalReads:{},limits:'Internal protocol rights only; no external ownership/execution, native GEN custody, browser or adoption proof.'};
 if(record.contractAddress!==address)throw new Error('Lifecycle deployment mismatch');
 async function step(name,index,functionName,args){
  if(record.steps[name]?.status==='FINALIZED'&&record.steps[name]?.executionResult==='SUCCESS')return;
  let pending=record.steps[name];
  if(!pending?.transactionHash){
   const hash=await signers[index].writeContract({address,functionName,args});
   pending={transactionHash:hash,status:'SUBMITTED',functionName,valueGen:'0'};
   record.steps[name]=pending;save('lifecycle.json',record);
   console.log(JSON.stringify({step:name,status:'SUBMITTED',transactionHash:hash,valueGen:'0'}));
  }
  const receipt=await finalized(reader,pending.transactionHash);
  record.steps[name]={...pending,...receipt,explorerUrl:EXPLORER+'/tx/'+pending.transactionHash};save('lifecycle.json',record);
  console.log(JSON.stringify({step:name,status:receipt.status,executionResult:receipt.executionResult}));
 }
 const rootId=record.rootId;
 await step('create',0,'create_root',[rootId,'article',U0,U1,record.rootExpiry]);
 let root=await read(reader,address,'get_root',[rootId]);
 if(root.holder.toLowerCase()!==record.holder.toLowerCase())throw new Error('Wrong root holder');
 await step('propose',0,'propose_partition',[rootId,record.recipientA,A,record.recipientB,B,record.proposalDeadline]);
 root=await read(reader,address,'get_root',[rootId]);const pid=root.proposal_id;
 let proposal=await read(reader,address,'get_proposal',[pid]);
 await step('assentA',1,'assent',[pid,proposal.digest]);
 await step('assentB',2,'assent',[pid,proposal.digest]);
 proposal=await read(reader,address,'get_proposal',[pid]);
 if(!proposal.assent_a||!proposal.assent_b)throw new Error('Both canonical assents required');
 await step('review',0,'review_partition',[pid]);
 root=await read(reader,address,'get_root',[rootId]);proposal=await read(reader,address,'get_proposal',[pid]);
 const attempt=await read(reader,address,'get_attempt',[pid+':T'+proposal.attempts]);
 record.canonicalReads={root,proposal,attempt,U0:await read(reader,address,'get_authority',[rootId+':U0']),U1:await read(reader,address,'get_authority',[rootId+':U1'])};save('lifecycle.json',record);
 if(root.status!=='SPLIT'||proposal.status!=='PARTITIONED')throw new Error('Review did not partition; diagnose current attempt before retry');
 for(const unit of ['U0','U1']){
  const authority=await read(reader,address,'get_authority',[rootId+':'+unit]);
  const index=accounts.findIndex(a=>a.address.toLowerCase()===authority.owner.toLowerCase());
  if(index<1)throw new Error('Original holder retained authority');
  await step('consume'+unit,index,'consume',[rootId+':'+unit]);
  const current=await read(reader,address,'get_authority',[rootId+':'+unit]);
  if(!current.consumed||current.active)throw new Error('Consumption missing');
  record.canonicalReads[unit]=current;save('lifecycle.json',record);
 }
 const rawBalance=await reader.request({method:'eth_getBalance',params:[address,'latest']});
 if(BigInt(rawBalance)!==0n)throw new Error('Unexpected native balance');
 record.nativeBalanceGen='0';record.completePrimaryLifecycle=true;record.verifiedAt=new Date().toISOString();save('lifecycle.json',record);
 console.log(JSON.stringify({lifecycle:'PARTITIONED_AND_BOTH_CONSUMED',rootId,proposalId:pid,nativeBalanceGen:'0',complete:true}));
}catch(e){reportError(e);}
