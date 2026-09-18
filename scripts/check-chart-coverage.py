"""Collect public CoinGecko daily fallbacks with paced, resumable requests."""
import concurrent.futures,json,sys,threading,time,urllib.request,urllib.error
from pathlib import Path
snapshot=json.loads(Path('dist/data/snapshot.json').read_text())
out=Path('dist/data/history');out.mkdir(exist_ok=True)
lock=threading.Lock();next_request=time.monotonic()+(15 if '--repair' in sys.argv else 0);pause_until=0

def fetch(asset,days):
 global next_request,pause_until
 for attempt in range(1 if '--repair' in sys.argv else 2):
  while True:
   with lock:
    wait=max(next_request,pause_until)-time.monotonic()
    if wait<=0:next_request=time.monotonic()+(13 if '--repair' in sys.argv else 7);break
   time.sleep(min(wait,5))
  try:
   url=f'https://api.coingecko.com/api/v3/coins/{urllib.parse.quote(asset,safe="")}/market_chart?vs_currency=usd&days={days}'
   with urllib.request.urlopen(url,timeout=25) as r:raw=json.load(r)
   prices=sorted({p[0]:p for p in raw.get('prices',[]) if isinstance(p,list) and len(p)==2 and isinstance(p[0],(int,float)) and isinstance(p[1],(int,float)) and p[1]>0}.values())
   if len(prices)<2:raise ValueError('Fewer than two verified prices')
   return {'prices':prices,'asOf':prices[-1][0],'source':'CoinGecko','currency':'USD','description':'Saved intraday samples' if days<=90 else 'Saved daily price samples','url':f'https://www.coingecko.com/en/coins/{asset}'}
  except urllib.error.HTTPError as e:
   if e.code==429:
    with lock:pause_until=max(pause_until,time.monotonic()+35)
    if attempt==0 and '--repair' not in sys.argv:continue
   raise

def collect(coin):
 asset=coin['id'];path=out/(asset+'.json');saved=json.loads(path.read_text()) if path.exists() else {};errors={}
 for days in ([180,1,7,30,90] if '--repair' in sys.argv else [180]):
  if str(days) in saved:continue
  try:
   saved[str(days)]=fetch(asset,days)
   if days==180:
    for d in [1,7,30,90]:
     source=saved['180'];p=[p for p in source['prices'] if p[0]>=source['asOf']-d*86400000]
     if len(p)>=2 and str(d) not in saved:saved[str(d)]={**source,'prices':p}
   path.write_text(json.dumps(saved,separators=(',',':')))
  except Exception as e:
   errors[str(days)]=str(e)
   if days==180 and not saved:break
 if '180' in saved:
  for d in [1,7,30,90]:
   source=saved['180'];prices=[p for p in source['prices'] if p[0]>=source['asOf']-d*86400000]
   if len(prices)>=2 and str(d) not in saved:saved[str(d)]={**source,'prices':prices}
  path.write_text(json.dumps(saved,separators=(',',':')))
 record={'id':asset,'ranges':sorted(saved,key=int),'errors':errors}
 with lock:print(json.dumps(record),flush=True)
 return record
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:report=list(pool.map(collect,snapshot['coins']))
Path('dist/data/chart-coverage.json').write_text(json.dumps({'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'assets':report},separators=(',',':')))
print('FINISHED',len(report),'assets',sum(len(r['ranges'])==5 for r in report),'with all ranges',flush=True)
