import ast
from pathlib import Path

root=Path(__file__).resolve().parents[1]
source=(root/'contracts/partition_seal.py').read_text(encoding='utf8')
source.encode('ascii')
assert source.splitlines()[:3]==['# v0.2.16','# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }','from genlayer import *']
classes=[node for node in ast.parse(source).body if isinstance(node,ast.ClassDef) and any(ast.unparse(base)=='gl.Contract' for base in node.bases)]
assert len(classes)==1 and classes[0].name=='PartitionSeal'
assert not any((root/name).exists() for name in ['frontend','app','src/app'])
assert 'run_nondet_unsafe' not in source and 'strict_eq' not in source
payable=[]
for node in classes[0].body:
 if isinstance(node,ast.FunctionDef):
  decorators=[ast.unparse(d) for d in node.decorator_list]
  reads_value=any(isinstance(n,ast.Attribute) and ast.unparse(n)=='gl.message.value' for n in ast.walk(node))
  if 'gl.public.write.payable' in decorators:payable.append(node.name)
  if reads_value:assert 'gl.public.write.payable' in decorators
assert payable==['assent']
assert '@gl.evm.contract_interface' in source and '_Recipient(sender).emit_transfer(value=u256(amount))' in source
assert 'gl.chain.Account' not in source
print('ASCII_HEADER_CLASS_PAYABLE_EOA_NO_APP_OK: PartitionSeal, pinned Studionet v0.2.16, assent1GEN escrow')
