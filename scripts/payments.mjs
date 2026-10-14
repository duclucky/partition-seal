import {formatUnits} from 'viem';
import {createHash} from 'node:crypto';
import {actors,client,chainCheck,finalized,read,jsonFile,save,reportError,safeSdk,EXPLORER} from './network.mjs';
import {valueReceipt,assertValueReceipt} from './value_receipts.mjs';
const GEN=10n**18n;
const U0='May read the registered article for private study with attribution; no distribution.';
const U1='May print the registered article for private study with attribution; no distribution.';
const A='May view the registered article privately with source credit; no sharing.';
const B='May make a paper copy of the registered article for private study with source credit; no sharing.';
export async function runPayments(mode='all'){
 const deployment=jsonFile('deployment.json'),reader=client();await chainCheck(reader);
 if(deployment?.contractRevision!=='PARTITION_SEAL_V3_ESCROW'||deployment.executionResult!=='SUCCESS')throw new Error('Verified V3 escrow deployment required');
 const address=deployment.contractAddress;
 const code=await reader.getContractCode(address);
 if(createHash('sha256').update(code).digest('hex')!==deployment.sourceSHA256)throw new Error('Deployed source mismatch');
 const accounts=actors(),signers=accounts.map(client);
 let record=jsonFile('payments.json')??{network:'studionet',chainId:61999,contractAddress:address,sourceCommit:deployment.sourceCommit,sourceSHA256:deployment.sourceSHA256,cases:{}};
 if(record.contractAddress!==address)throw new Error('Payment run deployment mismatch');
 const persist=()=>save('payments.json',record);
 const balance=async owner=>BigInt(await safeSdk(()=>reader.request({method:'eth_getBalance',params:[owner,'latest']})));
 const rawTx=hash=>safeSdk(()=>reader.request({method:'eth_getTransactionByHash',params:[hash]}));
 async function waitRaw(hash){
  for(let tries=0;tries<100;tries++){
   const raw=await rawTx(hash);
   if(raw&&valueReceipt(raw,hash).status==='FINALIZED')return raw;
   await new Promise(resolve=>setTimeout(resolve,4000));
  }
  throw new Error('Native child finalization timeout');
 }
 async function funding(){
  if(record.funding?.verified)return;
  if(!record.funding){
   const available=await balance(accounts[1].address);
   if(available>=2n*GEN){record.funding={notNeeded:true,verified:true,balanceGen:formatUnits(available,18)};persist();return;}
   if(await balance(accounts[0].address)<2n*GEN)throw new Error('Authorized funding source below2GEN');
   record.funding={sender:accounts[0].address,recipient:accounts[1].address,valueGen:'2',beforeRecipientGen:formatUnits(available,18),status:'PREPARED'};persist();
  }
  const f=record.funding;
  if(!f.transactionHash){
   if(f.status!=='PREPARED')throw new Error('Ambiguous funding submit: read nonce and recipient balance before retry');
   const nonce=await reader.getCurrentNonce({address:accounts[0].address});
   f.status='SUBMITTING';f.nonce=Number(nonce);persist();
   const serialized=await accounts[0].signTransaction({to:accounts[1].address,value:2n*GEN,nonce:Number(nonce),chainId:61999,type:'legacy',gas:21000n,gasPrice:0n});
   f.transactionHash=await reader.request({method:'eth_sendRawTransaction',params:[serialized]});f.status='SUBMITTED';persist();
   console.log(JSON.stringify({step:'fund-recipientA',status:f.status,transactionHash:f.transactionHash,valueGen:'2'}));
  }
  const raw=await waitRaw(f.transactionHash);
  f.receipt=assertValueReceipt(valueReceipt(raw,f.transactionHash),f);
  f.afterRecipientGen=formatUnits(await balance(f.recipient),18);
  if(parseGen(f.afterRecipientGen)-parseGen(f.beforeRecipientGen)!==2n*GEN)throw new Error('Funding balance delta mismatch');
  f.status='FINALIZED';f.verified=true;f.explorerUrl=EXPLORER+'/tx/'+f.transactionHash;persist();
  console.log(JSON.stringify({step:'fund-recipientA',status:'FINALIZED',valueGen:'2',recipientBalanceGen:f.afterRecipientGen,verified:true}));
 }
 async function step(c,name,index,functionName,args,valueGen='0'){
  let s=c.steps[name];
  if(s?.verified)return;
  if(!s){
   s={status:'PREPARED',functionName,valueGen,beforeContractGen:formatUnits(await balance(address),18),beforeActorGen:formatUnits(await balance(accounts[index].address),18)};
   c.steps[name]=s;persist();
  }
  if(!s.transactionHash){
   if(s.status!=='PREPARED')throw new Error('Ambiguous submit; reconcile exact root/current transaction before retry');
   s.status='SUBMITTING';persist();
   s.transactionHash=await safeSdk(()=>signers[index].writeContract({address,functionName,args,value:BigInt(valueGen)*GEN}));
   s.status='SUBMITTED';s.explorerUrl=EXPLORER+'/tx/'+s.transactionHash;persist();
   console.log(JSON.stringify({case:c.name,step:name,status:s.status,transactionHash:s.transactionHash,valueGen}));
  }
  const receipt=await finalized(reader,s.transactionHash);Object.assign(s,receipt);persist();
  s.afterContractGen=formatUnits(await balance(address),18);s.afterActorGen=formatUnits(await balance(accounts[index].address),18);
  if(functionName==='assent'&&parseGen(s.afterContractGen)-parseGen(s.beforeContractGen)!==GEN)throw new Error('Deposit exact native balance increase missing');
  if(functionName==='withdraw'){
   const raw=await rawTx(s.transactionHash);
   const children=raw?.triggered_transactions??raw?.triggeredTransactions??raw?.children??[];
   const hashes=children.map(child=>typeof child==='string'?child:child.hash??child.transaction_hash??child.transactionHash).filter(Boolean);
   if(!hashes.length){console.log(JSON.stringify({nativeProofIncomplete:true,parentFieldNames:Object.keys(raw??{}),childCount:children.length}));throw new Error('Withdraw child receipt hash absent');}
   s.children=[];
   for(const hash of hashes){
    const child=await waitRaw(hash);
    const safe=valueReceipt(child,hash);
    if(safe.sender?.toLowerCase()===address.toLowerCase()&&safe.recipient?.toLowerCase()===accounts[index].address.toLowerCase()){
     const amount=parseGen(s.beforeContractGen)-parseGen(formatUnits(await balance(address),18));
     assertValueReceipt(safe,{sender:address,recipient:accounts[index].address,valueGen:formatUnits(amount,18),parentHash:s.transactionHash});
     s.children.push(safe);
    }
   }
   s.afterContractGen=formatUnits(await balance(address),18);s.afterActorGen=formatUnits(await balance(accounts[index].address),18);
   const due=parseGen(s.expectedWithdrawGen);
   if(s.children.length!==1||parseGen(s.beforeContractGen)-parseGen(s.afterContractGen)!==due||parseGen(s.afterActorGen)-parseGen(s.beforeActorGen)!==due)throw new Error('Exact withdraw contract/recipient native delta missing');
  }
  s.verified=true;persist();console.log(JSON.stringify({case:c.name,step:name,status:s.status,executionResult:s.executionResult,verified:true,valueGen}));
 }
 async function withdraw(c,index){
  const name='withdraw'+index;
  if(!c.steps[name]){
   const credit=await read(reader,address,'get_credit',[accounts[index].address]);
   if(credit.credit_gen==='0')throw new Error('Expected withdraw credit absent');
   c.steps[name]={status:'PREPARED',functionName:'withdraw',valueGen:'0',expectedWithdrawGen:credit.credit_gen,
    beforeContractGen:formatUnits(await balance(address),18),beforeActorGen:formatUnits(await balance(accounts[index].address),18)};persist();
  }
  await step(c,name,index,'withdraw',[]);
  if((await read(reader,address,'get_credit',[accounts[index].address])).credit_gen!=='0')throw new Error('Credit not debited');
 }
 async function waitUntil(epoch,c){
  while(Math.floor(Date.now()/1000)<epoch+2){
   const remaining=epoch+2-Math.floor(Date.now()/1000);console.log(JSON.stringify({case:c.name,waitingSeconds:remaining}));
   await new Promise(resolve=>setTimeout(resolve,Math.min(remaining,20)*1000));
  }
 }
 async function runCase(name,kind){
  let c=record.cases[name];
  if(c?.complete){console.log(JSON.stringify({case:name,alreadyVerified:true}));return;}
  if(!c){c={name,kind,rootId:'paid-'+name+'-'+deployment.sourceSHA256.slice(0,8),rootExpiry:Math.floor(Date.now()/1000)+(kind==='close'?300:7200),steps:{}};record.cases[name]=c;persist();}
  await step(c,'create',0,'create_root',[c.rootId,'article',U0,U1,c.rootExpiry]);
  if(!c.deadline){c.deadline=Math.floor(Date.now()/1000)+(['smoke','expiry'].includes(kind)?180:kind==='close'?120:3600);persist();}
  await step(c,'propose',0,'propose_partition',[c.rootId,accounts[1].address,A,accounts[2].address,kind==='rejected'?A:B,c.deadline]);
  let root=await read(reader,address,'get_root',[c.rootId]);c.proposalId=root.proposal_id;persist();
  let proposal=await read(reader,address,'get_proposal',[c.proposalId]);
  if(!c.steps.assentA?.transactionHash&&Math.floor(Date.now()/1000)>=proposal.deadline){
   if(root.status!=='FROZEN'||proposal.assent_a||proposal.assent_b)throw new Error('Expired proposal has commitments; use refund recovery instead of reproposing');
   await step(c,'recoverUnpaidExpired',0,'expire_proposal',[c.proposalId]);
   if(!c.replacementDeadline){c.replacementDeadline=Math.floor(Date.now()/1000)+180;persist();}
   await step(c,'replaceUnpaidExpired',0,'propose_partition',[c.rootId,accounts[1].address,A,accounts[2].address,B,c.replacementDeadline]);
   root=await read(reader,address,'get_root',[c.rootId]);c.proposalId=root.proposal_id;c.deadline=c.replacementDeadline;persist();
   proposal=await read(reader,address,'get_proposal',[c.proposalId]);
  }
  await step(c,'assentA',1,'assent',[c.proposalId,proposal.digest],'1');
  if(!['smoke','close'].includes(kind))await step(c,'assentB',2,'assent',[c.proposalId,proposal.digest],'1');
  if(['smoke','expiry'].includes(kind)){
   await waitUntil(c.deadline,c);await step(c,'expire',1,'expire_proposal',[c.proposalId]);
  }else if(kind==='close'){
   await waitUntil(c.rootExpiry,c);await step(c,'close',1,'close_root',[c.rootId]);
  }else{
   await step(c,'review',0,'review_partition',[c.proposalId]);
   const p=await read(reader,address,'get_proposal',[c.proposalId]);
   c.attempt=await read(reader,address,'get_attempt',[c.proposalId+':T'+p.attempts]);persist();
   if(c.attempt.outcome!==(kind==='sale'?'PARTITIONED':'REJECTED'))throw new Error('Unexpected semantic outcome; diagnose canonical attempt before retry');
  }
  c.beforeWithdraw={payment:await read(reader,address,'get_payment',[c.proposalId]),accounting:await read(reader,address,'get_accounting'),
   credits:await Promise.all(accounts.map(a=>read(reader,address,'get_credit',[a.address])))};persist();
  for(const index of kind==='sale'?[0]:['smoke','close'].includes(kind)?[1]:[1,2])await withdraw(c,index);
  if(kind==='sale'){
   for(const unit of ['U0','U1']){
    const owner=await read(reader,address,'get_authority',[c.rootId+':'+unit]);
    const index=accounts.findIndex(a=>a.address.toLowerCase()===owner.owner.toLowerCase());
    if(index<1)throw new Error('Original holder still owns sold unit');
    await step(c,'consume'+unit,index,'consume',[c.rootId+':'+unit]);
   }
  }
  c.canonicalReads={root:await read(reader,address,'get_root',[c.rootId]),proposal:await read(reader,address,'get_proposal',[c.proposalId]),
   payment:await read(reader,address,'get_payment',[c.proposalId]),accounting:await read(reader,address,'get_accounting'),
   U0:await read(reader,address,'get_authority',[c.rootId+':U0']),U1:await read(reader,address,'get_authority',[c.rootId+':U1'])};
  c.nativeBalanceGen=formatUnits(await balance(address),18);
  if(c.nativeBalanceGen!=='0'||c.canonicalReads.accounting.liability_gen!=='0')throw new Error('Case did not close native liability');
  c.complete=true;c.verifiedAt=new Date().toISOString();persist();console.log(JSON.stringify({case:name,complete:true,rootStatus:c.canonicalReads.root.status,paymentStatus:c.canonicalReads.payment.status,nativeBalanceGen:'0',liabilityGen:'0'}));
 }
 await funding();
 for(const kind of mode==='all'?['smoke','sale','rejected','expiry','close']:[mode]){
  if(!['smoke','sale','rejected','expiry','close'].includes(kind))throw new Error('Unknown payment case');
  await runCase(kind,kind);
 }
 record.lastVerifiedAt=new Date().toISOString();record.complete=['smoke','sale','rejected','expiry','close'].every(k=>record.cases[k]?.complete);persist();
}
function parseGen(text){
 const [whole,fraction='']=String(text).split('.');
 return BigInt(whole)*GEN+BigInt(fraction.padEnd(18,'0'));
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/payments.mjs'))runPayments(process.argv[2]??'all').catch(reportError);
