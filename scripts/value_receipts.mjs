import {formatUnits} from 'viem';
export function valueReceipt(raw,hash){
 const leaders=raw?.consensus_data?.leader_receipt;
 const leader=Array.isArray(leaders)?leaders[0]:leaders;
 const result=raw?.execution_result??raw?.txExecutionResultName??leader?.execution_result??null;
 const status=raw?.status===7||raw?.status==='7'?'FINALIZED':String(raw?.status??raw?.networkStatus??'UNKNOWN');
 const sender=raw?.from_address??raw?.from??raw?.fromAddress;
 const recipient=raw?.to_address??raw?.to??raw?.toAddress;
 const value=raw?.value??raw?.txDataDecoded?.value;
 return {transactionHash:hash,status,sender:/^0x[0-9a-f]{40}$/i.test(sender??'')?sender:null,
  recipient:/^0x[0-9a-f]{40}$/i.test(recipient??'')?recipient:null,
  valueGen:value===undefined?null:formatUnits(BigInt(value),18),executionResult:result,
  parentHash:raw?.triggered_by??raw?.triggeredBy??null,
  explicitError:Boolean(raw?.error)||['ERROR','FAILURE','UNDETERMINED'].includes(result)};
}
export function assertValueReceipt(safe,{sender,recipient,valueGen,parentHash}){
 if(safe.status!=='FINALIZED'||safe.explicitError||safe.sender?.toLowerCase()!==sender.toLowerCase()||safe.recipient?.toLowerCase()!==recipient.toLowerCase()||safe.valueGen!==valueGen||(parentHash&&safe.parentHash!==parentHash))throw new Error('Native transfer proof incomplete');
 return safe;
}
