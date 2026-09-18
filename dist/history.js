import {DAY} from './math.js';
export const ranges=[{days:1,label:'1D',name:'1 day'},{days:7,label:'7D',name:'7 days'},{days:30,label:'1M',name:'1 month'},{days:90,label:'3M',name:'3 months'},{days:180,label:'6M',name:'6 months'},{days:365,label:'1Y',name:'1 year'},{days:'max',label:'All time',name:'All available history'}];
const exchangePairs={minotari:'XTMUSDT'};
const providerPauses=new WeakMap();
export function priceSamples(raw,now=Date.now(),days=180){
 const rows=(Array.isArray(raw)?raw:[]).filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[1]>0&&p[0]<=now&&(days==='max'||p[0]>=now-days*DAY)).sort((a,b)=>a[0]-b[0]);
 return [...new Map(rows.map(p=>[p[0],p])).values()];
}
export function exchangeSamples(raw,now=Date.now(),days=90){
 if(!Array.isArray(raw))return [];
 return priceSamples(raw.filter(r=>Array.isArray(r)&&Number.isFinite(Number(r[6]))&&Number(r[6])<now&&Number(r[6])>=Number(r[0])&&Number(r[6])<=Number(r[0])+DAY).map(r=>[Number(r[6]),Number(r[4])]),now,days);
}
async function request(url,fetcher){
 const isCoinGecko=url.startsWith('https://api.coingecko.com/');
 if(isCoinGecko&&Date.now()<(providerPauses.get(fetcher)??0))throw Error('Price provider is temporarily rate limited; saved data remains available');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
 try{const response=await fetcher(url,{signal:controller.signal,cache:'no-store'});if(!response.ok){if(isCoinGecko&&response.status===429)providerPauses.set(fetcher,Date.now()+60000);throw Error(`Provider request failed (${response.status})`);}return await response.json();}
 finally{clearTimeout(timer);}
}
export async function loadHistory(id,{days=90,fetcher=fetch,now=Date.now()}={}){
 if(!ranges.some(r=>r.days===days))throw Error('Unsupported chart range');
 try{
  let data;let limited=false;
  try{data=await request(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`,fetcher);}
  catch(error){if(days!=='max')throw error;data=await request(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=365`,fetcher);limited=true;}
  const prices=priceSamples(data.prices,now,days);
  if(prices.length<2)throw Error('Insufficient chart data');
  return {prices,asOf:now,source:'CoinGecko',currency:'USD',description:limited?'Available history · public source limited to the past year; not lifetime history':'Historical price samples',url:`https://www.coingecko.com/en/coins/${encodeURIComponent(id)}`};
 }catch(error){
  const pair=exchangePairs[id];if(!pair)throw Error(`Historical prices could not be loaded: ${error.name==='AbortError'?'request timed out':error.message}. Try Refresh selected history later.`);
  try{
   const interval=days===1?'5m':days===7?'1h':days===30?'4h':'1d';
   const limit=days===1?288:days===7?168:days===30?180:days==='max'?500:days;
   const raw=await request(`https://api.mexc.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`,fetcher);
   const prices=exchangeSamples(raw,now,days);if(prices.length<2)throw Error('Insufficient chart data');
   return {prices,asOf:now,source:'MEXC',currency:'USDT',description:`Completed ${interval} closes · single exchange${days==='max'?' · up to 500 available daily closes; earlier history may be unavailable':''}`,url:'https://www.mexc.com/exchange/XTM_USDT'};
  }catch{throw Error('CoinGecko and the MEXC fallback are unavailable. Try Refresh selected history later.');}
 }
}
