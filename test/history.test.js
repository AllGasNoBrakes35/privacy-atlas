import test from 'node:test';
import assert from 'node:assert/strict';
import {loadHistory,exchangeSamples,priceSamples,ranges} from '../dist/history.js';
import {DAY} from '../dist/math.js';
const now=1000*DAY,prices=[[997*DAY,1],[998*DAY,2]];
const ok=data=>({ok:true,json:async()=>data});
test('primary USD history avoids fallback',async()=>{
 const urls=[];const h=await loadHistory('minotari',{now,fetcher:async u=>{urls.push(u);return ok({prices});}});
 assert.equal(h.currency,'USD');assert.equal(h.source,'CoinGecko');assert.equal(urls.length,1);assert.deepEqual(h.prices,prices);
});
test('failed primary uses explicit XTM pair and labels USDT',async()=>{
 const urls=[];const h=await loadHistory('minotari',{now,fetcher:async u=>{urls.push(u);if(urls.length===1)throw Error('429');return ok(prices.map(([t,p])=>[t,0,0,0,String(p),0,t+DAY-1]));}});
 assert.equal(h.currency,'USDT');assert.equal(h.source,'MEXC');assert.ok(urls[1].includes('symbol=XTMUSDT'));assert.deepEqual(h.prices,prices.map(([t,p])=>[t+DAY-1,p]));
});
test('empty primary tries fallback; does not invent ticker mappings',async()=>{
 let calls=0;await assert.rejects(loadHistory('unknown-coin',{now,fetcher:async()=>{calls++;return ok({prices:[]});}}));assert.equal(calls,1);
});
test('both provider failures produce a clear error',async()=>{
 await assert.rejects(loadHistory('minotari',{now,fetcher:async()=>({ok:false,status:429})}),/CoinGecko and the MEXC fallback/);
});
test('exchange samples exclude unfinished candles and invalid prices',()=>{
 const rows=[[997*DAY,0,0,0,'1',0,998*DAY-1],[998*DAY,0,0,0,'NaN',0,999*DAY-1],[999*DAY,0,0,0,'-2',0,1000*DAY-1],[1000*DAY,0,0,0,'3',0,1001*DAY-1]];
 assert.deepEqual(exchangeSamples(rows,now),[[998*DAY-1,1]]);
});

test('every range requests its own duration and preserves intraday timestamps',async()=>{
 for(const {days} of ranges){
  let url;const intraday=[[now-3600000,1],[now-1800000,2]];
  const h=await loadHistory('monero',{now,days,fetcher:async u=>{url=u;return ok({prices:intraday});}});
  assert.equal(new URL(url).searchParams.get('days'),String(days));
  assert.equal(new URL(url).searchParams.has('interval'),false);
  assert.deepEqual(h.prices,intraday);
 }
});
test('filtering uses real requested window and rejects future/invalid samples',()=>{
 const raw=[[now-2*DAY,1],[now-DAY/2,2],[now-DAY/2,3],[now+1,4],[now-1,0]];
 assert.deepEqual(priceSamples(raw,now,1),[[now-DAY/2,3]]);
});
test('fallback interval and limit cover each selected range within provider limit',async()=>{
 for(const {days}of ranges){let count=0,url;await loadHistory('minotari',{now,days,fetcher:async u=>{if(count++===0)throw Error('down');url=new URL(u);return ok([[now-7200000,0,0,0,'1',0,now-3600001],[now-3600000,0,0,0,'2',0,now-1]]);}});assert.ok(Number(url.searchParams.get('limit'))<=500);assert.equal(url.searchParams.get('interval'),days===1?'5m':days===7?'1h':days===30?'4h':'1d');}
});
test('rate limit pauses repeated provider requests without discarding saved data',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return {ok:false,status:429}};
 await assert.rejects(loadHistory('monero',{now,fetcher}));
 await assert.rejects(loadHistory('zcash',{now,fetcher}),/temporarily rate limited/);
 assert.equal(calls,1);
});
test('all-time keeps older samples and labels the annual fallback honestly',async()=>{
 const ancient=[[now-900*DAY,1],[now-DAY,2]];
 assert.deepEqual(priceSamples(ancient,now,'max'),ancient);
 assert.equal(priceSamples(ancient,now,365).length,1);
 const urls=[];const h=await loadHistory('monero',{now,days:'max',fetcher:async u=>{urls.push(u);return urls.length===1?{ok:false,status:401}:ok({prices});}});
 assert.equal(new URL(urls[1]).searchParams.get('days'),'365');
 assert.match(h.description,/not lifetime history/);
});
