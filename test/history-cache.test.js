import test from 'node:test';
import assert from 'node:assert/strict';
import {newestHistory,readHistoryCache,saveHistoryCache} from '../dist/history-cache.js';
import {priceSamples,ranges} from '../dist/history.js';
import fs from 'node:fs';
const history=time=>({prices:[[time-1,1],[time,2]],asOf:time});
test('prefer freshest downloaded or bundled series',()=>{
 const older=history(10),newer=history(20);assert.equal(newestHistory(newer,older),newer);assert.equal(newestHistory(null,older),older);
});
test('local cache round trip and blocked storage are safe',()=>{
 let value=null;const storage={getItem(){return value},setItem(k,v){value=v}};
 saveHistoryCache(storage,new Map([['monero:1',history(10)]]));assert.equal(readHistoryCache(storage).get('monero:1').asOf,10);
 assert.equal(readHistoryCache(undefined).size,0);assert.doesNotThrow(()=>saveHistoryCache(undefined,new Map()));
 value='not JSON';assert.equal(readHistoryCache(storage).size,0);
});
test('all five Monero ranges remain drawable during later provider outages',()=>{
 const saved=JSON.parse(fs.readFileSync(new URL('../dist/data/monero-history.json',import.meta.url)));
 for(const {days} of ranges){const h=saved[days];assert.ok(h&&h.asOf);const rows=priceSamples(h.prices,h.asOf,days);assert.ok(rows.length>2,`${days} day range`);assert.ok(rows.at(-1)[0]-rows[0][0]>=days*86400000*.9,`${days} day coverage`);}
});
