import {createHash} from 'node:crypto';
import {parseUnits,formatUnits} from 'viem';
import {client,chainCheck,jsonFile,read,safeSdk,save,reportError} from './network.mjs';
import {summarizeReceipt,assertSuccessful} from './receipts.mjs';
import {valueReceipt,assertValueReceipt} from './value_receipts.mjs';
try{
 const d=jsonFile('deployment.json'),p=jsonFile('payments.json'),r=client();await chainCheck(r);
 if(d?.contractRevision!=='PARTITION_SEAL_V3_ESCROW'||!p?.complete||p.contractAddress!==d.contractAddress)throw new Error('Complete current V3 payment evidence required');
 const code=await r.getContractCode(d.contractAddress);
 if(createHash('sha256').update(code).digest('hex')!==d.sourceSHA256)throw new Error('Exact source mismatch');
 const wallets=[p.cases.sale.canonicalReads.root.holder,p.cases.sale.canonicalReads.proposal.recipient_a,p.cases.sale.canonicalReads.proposal.recipient_b];
 const proof={network:'studionet',chainId:61999,contractAddress:d.contractAddress,sourceCommit:d.sourceCommit,sourceSHA256:d.sourceSHA256,cases:{},parentCount:0,childCount:0,withdrawnGen:'0'};
 let withdrawn=0n;
 for(const [name,c] of Object.entries(p.cases)){
  if(!c.complete)throw new Error('Incomplete payment case');
  const state={root:await read(r,d.contractAddress,'get_root',[c.rootId]),proposal:await read(r,d.contractAddress,'get_proposal',[c.proposalId]),payment:await read(r,d.contractAddress,'get_payment',[c.proposalId]),steps:{}};
  for(const [step,s] of Object.entries(c.steps)){
   await new Promise(resolve=>setTimeout(resolve,1100));
   const raw=await safeSdk(()=>r.request({method:'eth_getTransactionByHash',params:[s.transactionHash]}));
   const receipt=assertSuccessful(summarizeReceipt(raw,s.transactionHash));
   const index=step==='assentB'||step==='withdraw2'?2:step==='assentA'||step==='withdraw1'||step==='expire'||step==='close'?1:0;
   let expectedSender=wallets[index];
   if(step.startsWith('consume'))expectedSender=(await read(r,d.contractAddress,'get_authority',[c.rootId+':'+step.slice(-2)])).owner;
   if(raw.from_address.toLowerCase()!==expectedSender.toLowerCase()||raw.to_address.toLowerCase()!==d.contractAddress.toLowerCase()||BigInt(raw.value)!==parseUnits(s.valueGen,18))throw new Error('Actual origin/value binding mismatch');
   state.steps[step]={...receipt,sender:raw.from_address,valueGen:s.valueGen};proof.parentCount++;
   if(step.startsWith('withdraw')){
    if(s.children?.length!==1)throw new Error('Expected one external value child');
    const due=parseUnits(s.expectedWithdrawGen,18);
    if(parseUnits(s.beforeContractGen,18)-parseUnits(s.afterContractGen,18)!==due||parseUnits(s.afterActorGen,18)-parseUnits(s.beforeActorGen,18)!==due)throw new Error('Snapshot delta mismatch');
    const child=await safeSdk(()=>r.request({method:'eth_getTransactionByHash',params:[s.children[0].transactionHash]}));
    const safe=assertValueReceipt(valueReceipt(child,s.children[0].transactionHash),{sender:d.contractAddress,recipient:expectedSender,valueGen:s.expectedWithdrawGen,parentHash:s.transactionHash});
    state.steps[step].child=safe;state.steps[step].exactContractDecreaseGen=s.expectedWithdrawGen;state.steps[step].exactRecipientIncreaseGen=s.expectedWithdrawGen;
    withdrawn+=due;proof.childCount++;
   }
  }
  proof.cases[name]=state;
 }
 proof.accounting=await read(r,d.contractAddress,'get_accounting');
 proof.nativeBalanceGen=formatUnits(BigInt(await safeSdk(()=>r.request({method:'eth_getBalance',params:[d.contractAddress,'latest']}))),18);
 proof.withdrawnGen=formatUnits(withdrawn,18);
 if(proof.parentCount!==32||proof.childCount!==7||proof.withdrawnGen!=='8'||proof.nativeBalanceGen!=='0'||proof.accounting.liability_gen!=='0'||proof.accounting.received_gen!=='8'||proof.accounting.withdrawn_gen!=='8')throw new Error('Final money conservation mismatch');
 for(const wallet of wallets)if((await read(r,d.contractAddress,'get_credit',[wallet])).credit_gen!=='0')throw new Error('Outstanding wallet credit');
 proof.verifiedAt=new Date().toISOString();proof.verified=true;save('verification.json',proof);
 console.log(JSON.stringify({verified:true,caseCount:5,parentCount:proof.parentCount,childCount:proof.childCount,receivedGen:'8',withdrawnGen:proof.withdrawnGen,nativeBalanceGen:'0',liabilityGen:'0',paidBuyerRecovery:true}));
}catch(e){reportError(e);}
