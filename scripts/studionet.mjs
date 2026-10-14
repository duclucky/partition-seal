import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ROOT,EXPLORER,actors,client,chainCheck,finalized,read,jsonFile,save,reportError,safeSdk} from './network.mjs';
const filename='contracts/partition_seal.py';
const source=fs.readFileSync(path.join(ROOT,filename));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceSHA256=sha(source);
try{
 const reader=client();await chainCheck(reader);
 const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
 const committed=execFileSync('git',['show','HEAD:'+filename],{cwd:ROOT});
 if(sha(committed)!==sourceSHA256)throw new Error('Uncommitted contract source');
 let record=jsonFile('deployment.json');
 if(record&&(record.network!=='studionet'||record.chainId!==61999||record.sourceSHA256!==sourceSHA256))throw new Error('Deployment revision mismatch; explicit archive required');
 if(!record){
  const account=actors()[0];
  const signer=client(account);
  const hash=await safeSdk(()=>signer.deployContract({code:new Uint8Array(source),args:[]}));
  record={network:'studionet',chainId:61999,sourceCommit:commit,sourceSHA256,contractRevision:'PARTITION_SEAL_V3_ESCROW',contractApiVersion:'v0.2.16',dependsRunner:'py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6',
   transactionHash:hash,status:'SUBMITTED',valueGen:'0',submittedAt:new Date().toISOString()};
  save('deployment.json',record);console.log(JSON.stringify({step:'deploy',transactionHash:hash,status:'SUBMITTED',valueGen:'0'}));
 }
 const receipt=await finalized(reader,record.transactionHash);
 if(!receipt.contractAddress&&!record.contractAddress)throw new Error('Deployment address absent');
 const address=receipt.contractAddress??record.contractAddress;
 const schema=await reader.getContractSchema(address);
 const methods=Object.keys(schema.methods??{});
 const expected=['create_root','propose_partition','assent','review_partition','consume','expire_proposal','close_root','withdraw','get_root','get_proposal','get_attempt','get_authority','get_policy','get_payment','get_credit','get_accounting'];
 if(!schema.ctor||expected.some(x=>!methods.includes(x)))throw new Error('Expected contract schema absent');
 const policy=await read(reader,address,'get_policy');
 if(policy.revision!=='PARTITION_SEAL_V3_ESCROW'||policy.chain_id!==61999||policy.native_value_custody!==true||policy.price_per_recipient_gen!=='1')throw new Error('Wrong canonical policy');
 if(schema.methods.assent.payable!==true)throw new Error('Payable assent metadata absent');
 const code=await reader.getContractCode(address);
 if(sha(Buffer.from(code,'utf8'))!==sourceSHA256)throw new Error('Deployed source differs');
 record={...record,...receipt,contractAddress:address,explorerAddressUrl:EXPLORER+'/address/'+address,explorerDeployTxUrl:EXPLORER+'/tx/'+record.transactionHash,schema:{constructor:true,methods:methods.sort(),count:methods.length},canonicalPolicy:policy,verifiedAt:new Date().toISOString()};
 save('deployment.json',record);console.log(JSON.stringify({step:'deploy',status:record.status,executionResult:record.executionResult,contractAddress:address,methodCount:methods.length,explorerAddressUrl:record.explorerAddressUrl,sourceMatches:true}));
}catch(e){reportError(e);}
