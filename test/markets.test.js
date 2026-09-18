import test from 'node:test';import assert from 'node:assert/strict';import {mergeMarketCoins} from '../dist/markets.js';
const old={id:'monero',name:'Monero',symbol:'xmr',current_price:100,last_updated:'2026-09-01T00:00:00Z'};
test('partial updates retain missing assets and reject invalid or older prices',()=>{
 const second={...old,id:'zcash'},newer={...old,current_price:110,last_updated:'2026-09-02T00:00:00Z'};
 assert.deepEqual(mergeMarketCoins([old,second],[newer]),[newer,second]);
 for(const update of [{...newer,current_price:null},{...newer,current_price:NaN},{...newer,last_updated:'2026-08-01T00:00:00Z'},{...newer,last_updated:null}])assert.deepEqual(mergeMarketCoins([old],[update]),[old]);
});
