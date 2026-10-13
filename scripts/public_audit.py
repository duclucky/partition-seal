"""Audit public tree and Git history paths without printing sensitive matches."""
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT).decode('utf8').splitlines()

top=Path(git('rev-parse','--show-toplevel')[0]).resolve()
assert top==ROOT and (ROOT.parent/'.git').exists() is False
paths=set(git('ls-files'))|set(git('diff','--cached','--name-only'))
allowed=re.compile(r'^(?:\.gitignore|\.gitattributes|\.env\.example|\.github/workflows/check\.yml|README\.md|requirements-dev\.txt|package(?:-lock)?\.json|gltest\.config\.yaml|contracts/partition_seal\.py|scripts/[a-z_]+\.(?:py|mjs|ps1)|tests/(?:direct/[a-z_]+\.py|receipts\.test\.mjs)|docs/(?:[A-Z_-]+\.md|SUBMISSION-DESCRIPTION\.txt|evidence/studionet/[a-z_-]+\.json))$')
bad=[p for p in paths if not allowed.fullmatch(p)]
assert not bad,'Public allowlist mismatch; inspect locally'
historical=git('log','--all','--name-only','--format=')
for name in set(historical):
    if name:
        assert allowed.fullmatch(name),'Forbidden historical path; inspect locally'
pattern=re.compile(r'(?:PRIVATE_KEY|SECRET|PASSWORD|API_KEY)[ \t]*[=:][ \t]*[\x22\x27]?(?:0x)?[0-9A-Za-z_/-]{32,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',re.I)
# Empty example assignments must not consume a later variable on the next line.
assert pattern.search('PRIVATE_KEY='+'q'*40)
assert not pattern.search('PRIVATE_KEY=\nSTUDIONET_INTEGRATOR_PRIVATE_KEY=')
for name in paths:
    content=subprocess.check_output(['git','show',':'+name],cwd=ROOT).decode('utf8')
    assert not pattern.search(content),'Potential staged secret; contents not printed'
checked_blobs=set()
for revision in git('rev-list','--all'):
    for entry in git('ls-tree','-r',revision):
        meta,name=entry.split('\t',1)
        assert allowed.fullmatch(name),'Forbidden historical tree path'
        blob=meta.split()[-1]
        if blob not in checked_blobs:
            content=subprocess.check_output(['git','cat-file','blob',blob],cwd=ROOT).decode('utf8')
            assert not pattern.search(content),'Potential historical secret; contents not printed'
            checked_blobs.add(blob)
assert (ROOT/'.env').is_file()
for name in ['.env','.venv','node_modules','AGENTS.md','CLAUDE.md']:
    assert git('check-ignore',name),f'{name} not ignored'
subprocess.check_call(['git','diff','--check'],cwd=ROOT)
subprocess.check_call(['git','diff','--cached','--check'],cwd=ROOT)
print(f'PUBLIC_ALLOWLIST_HISTORY_SECRET_IGNORE_AUDIT_OK: {len(paths)} public files, {len(checked_blobs)} historical blobs; ignored local env/runtime preserved')
