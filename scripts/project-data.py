"""Refresh sourced project metadata and logo files without replacing known data on failure."""
import concurrent.futures, json, pathlib, subprocess, time, threading, datetime, re, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/data/projects.json'
LOCK=threading.Lock()
LAST=0
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def get(url, paced=False):
    global LAST
    if paced:
        with LOCK:
            delay=max(0,7-(time.monotonic()-LAST))
            if delay: time.sleep(delay)
            LAST=time.monotonic()
    p=subprocess.run(['curl','-fLsS','--max-time','25','-H','Accept: application/json',url],capture_output=True)
    if p.returncode: raise ValueError('Source unavailable or rate limited')
    return json.loads(p.stdout)
coins=json.loads((ROOT/'dist/data/snapshot.json').read_text())['coins']
data=json.loads(OUT.read_text()) if OUT.exists() else {'projects':{}}
if '--missing' in sys.argv:
    coins=[c for c in coins if not data['projects'].get(c['id'],{}).get('checkedAt')]
def work(c):
    id=c['id']; old=data['projects'].get(id,{})
    item=dict(old); item.update(id=id,name=c['name'],marketSource=f'https://www.coingecko.com/en/coins/{id}')
    try:
        d=get(f'https://api.coingecko.com/api/v3/coins/{id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false',True)
        if d.get('id')!=id: raise ValueError('Source identity mismatch')
        item.update(checkedAt=now(),hashingAlgorithm=d.get('hashing_algorithm'),platform=d.get('asset_platform_id'),categories=d.get('categories',[]),websites=[u for u in d.get('links',{}).get('homepage',[]) if u.startswith('https://')],repositories=d.get('links',{}).get('repos_url',{}).get('github',[]))
        item.pop('error',None)
        repos=item['repositories']
        # Preserve the vendor order and disclose that selection in the UI.
        repo=next((r for r in repos if re.fullmatch(r'https://github.com/[\w.-]+/[\w.-]+/?',r)),None)
        if repo:
            path=repo.removeprefix('https://github.com/').rstrip('/')
            try:
                g=get('https://api.github.com/repos/'+path)
                if not g.get('full_name') or g.get('private') is not False: raise ValueError('Repository unavailable')
                item['github']={'url':g['html_url'],'name':g['full_name'],'owner':g['owner']['login'],'ownerUrl':g['owner']['html_url'],'description':g.get('description'),'pushedAt':g.get('pushed_at'),'license':(g.get('license') or {}).get('spdx_id'),'archived':g.get('archived'),'fork':g.get('fork'),'checkedAt':now(),'apiSource':'https://api.github.com/repos/'+path}
                item.pop('githubError',None)
            except Exception as e: item['githubError']=str(e)
    except Exception as e: item['error']=str(e)
    # Download the exact logo associated with this vendor ID, not a similarly named coin.
    logo=c.get('image','')
    if logo.startswith('https://coin-images.coingecko.com/'):
        target=ROOT/'dist/logos'/f'{id}.png';target.parent.mkdir(exist_ok=True)
        if not target.exists():
            p=subprocess.run(['curl','-fLsS','--max-time','20',logo],capture_output=True)
            if p.returncode==0 and p.stdout.startswith(b'\x89PNG\r\n\x1a\n'): target.write_bytes(p.stdout)
        if target.exists(): item.update(logo=f'logos/{id}.png',logoSource=logo)
    return id,item
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    for future in concurrent.futures.as_completed([pool.submit(work,c) for c in coins]):
        id,item=future.result(); data['projects'][id]=item;data['checkedAt']=now()
        OUT.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
        print(id,'metadata' if item.get('checkedAt') else 'unavailable','github' if item.get('github') else '',flush=True)
