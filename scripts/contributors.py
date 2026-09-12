"""Fetch named GitHub contributors; these are historical commit counts, not team roles."""
import json,pathlib,subprocess,concurrent.futures,datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
projects=json.loads((ROOT/'dist/data/projects.json').read_text())['projects']
repos={k:v['github'] for k,v in projects.items() if v.get('github')}
repos.update(json.loads((ROOT/'dist/data/repositories.json').read_text()))
def work(pair):
 id,g=pair;url='https://api.github.com/repos/'+g['name']+'/contributors?per_page=3'
 p=subprocess.run(['curl','-fLsS','--max-time','12',url],capture_output=True)
 try:
  d=json.loads(p.stdout)
  if not isinstance(d,list):return id,None
  return id,{'source':url,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'people':[{'name':x['login'],'url':x['html_url'],'commits':x['contributions']} for x in d if x.get('type')=='User']}
 except:return id,None
out={}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for id,d in pool.map(work,repos.items()):
  if d:out[id]=d
(ROOT/'dist/data/contributors.json').write_text(json.dumps(out,indent=2)+'\n')
print('Contributor lists:',len(out),flush=True)
