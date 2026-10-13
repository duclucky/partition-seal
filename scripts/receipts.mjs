const ERROR_RESULTS = new Set(['ERROR','FAILURE','UNDETERMINED','DISAGREE','CANCELED','TIMEOUT','MAJORITY_DISAGREE']);
export function summarizeReceipt(receipt, hash) {
  const leaders=receipt?.consensus_data?.leader_receipt;
  const leader=Array.isArray(leaders)?leaders[0]:leaders;
  const raw=receipt?.txExecutionResultName??receipt?.executionResult??receipt?.execution_result??leader?.execution_result;
  const execution=typeof raw==='string'?raw:raw?.result??raw?.status??'UNKNOWN';
  const status=receipt?.status===7||receipt?.status==='7'?'FINALIZED':receipt?.networkStatus??receipt?.statusName??String(receipt?.status??'UNKNOWN');
  const result=receipt?.resultName??receipt?.result_name??'UNKNOWN';
  const address=receipt?.txDataDecoded?.contractAddress??receipt?.contractAddress??receipt?.data?.contract_address??receipt?.to_address;
  const validators=receipt?.consensus_data?.validators??receipt?.consensus_data?.validators_receipts;
  return {transactionHash:hash,status,executionResult:execution,consensusResult:result,
    contractAddress:/^0x[0-9a-f]{40}$/i.test(address??'')?address:null,
    validatorCount:Array.isArray(validators)?validators.length:null};
}
export function assertSuccessful(receipt) {
  if(receipt.status!=='FINALIZED'||receipt.executionResult!=='SUCCESS'||ERROR_RESULTS.has(receipt.consensusResult))
    throw new Error('Receipt has no finalized successful execution');
  return receipt;
}
