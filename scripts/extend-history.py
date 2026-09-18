"""Refresh annual saved histories; keep public-provider coverage limitations explicit."""
import concurrent.futures,json,threading,time,urllib.request,urllib.error
from pathlib import Path
root=Path('dist/data');coins=json.loads((root/'snapshot.json').read_text())['coins']
lock=threading.Lock();next_request=0

def collect(coin):
 global next_request
 asset=coin['id'];path=root/'history'/(asset+'.json');saved=json.loads(path.read_text()) if path.exists() else {};error=None
 for attempt in range(2):
  with lock:
   wait=max(0,next_request-time.monotonic());next_request=max(next_request,time.monotonic())+7
  if wait:time.sleep(wait)
  try:
   u='https://api.coingecko.com/api/v3/coins/'+urllib.parse.quote(asset,safe='')+'/market_chart?vs_currency=usd&days=365'
   raw=json.load(urllib.request.urlopen(u,timeout=25));now=int(time.time()*1000)
   prices=sorted({p[0]:p for p in raw.get('prices',[]) if len(p)>=2 and isinstance(p[1],(float,int)) and p[1]>0 and 0<=p[0]<=now}.values())
   if len(prices)<2:raise ValueError('Insufficient prices')
   h={'prices':prices,'asOf':now,'source':'CoinGecko','currency':'USD','description':'Saved daily price samples','url':'https://www.coingecko.com/en/coins/'+asset}
   saved['365']=h
   older=saved.get('max',{})
   if older.get('source')==h['source'] and older.get('currency')==h['currency']:
    combined=sorted({p[0]:p for p in older.get('prices',[])+prices}.values())
   else:combined=prices
   saved['max']={**h,'prices':combined,'description':'Available source history · earlier prices may be unavailable' if combined[0][0]<prices[0][0] else 'Available history · public source limited to the past year; not lifetime history'}
   error=None;break
  except Exception as e:
   error=str(e)
   if '429' not in error:break
   time.sleep(30)
 if '365' not in saved:
  candidates=[h for h in saved.values() if h.get('prices')]
  if candidates:
   h=max(candidates,key=lambda h:len(h['prices']))
   saved['365']={**h,'description':'Partial 1-year history · older source data unavailable'}
   saved['max']={**h,'description':'Available saved history only · earlier prices unavailable'}
 path.write_text(json.dumps(saved,separators=(',',':')))
 record={'id':asset,'ranges':list(saved),'annualFetchError':error,'firstDate':saved.get('max',{}).get('prices',[[None]])[0][0]}
 with lock:print(json.dumps(record),flush=True)
 return record
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:report=list(pool.map(collect,coins))
(root/'long-history-coverage.json').write_text(json.dumps({'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'assets':report},separators=(',',':')))
# Retain legacy fixture consumed by the regression suite.
(root/'monero-history.json').write_text((root/'history/monero.json').read_text())
print('FINISHED',len(report),'assets',sum(not r['annualFetchError'] for r in report),'annual histories',flush=True)
