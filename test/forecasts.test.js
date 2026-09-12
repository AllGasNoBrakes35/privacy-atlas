import test from 'node:test';
import assert from 'node:assert/strict';
import {projectForecast,assumptions} from '../dist/forecasts.js';
test('dilution reduces a price target with the same project outlook',()=>{
 const c={id:'example',current_price:10,circulating_supply:1000};
 const m={merit:.08,adoption:.02,dilution:0};
 const a=projectForecast(c,3,m),b=projectForecast(c,3,{...m,dilution:.1});
 assert.equal(a.cap,b.cap);assert.ok(b.price<a.price);assert.ok(Math.abs(b.price-10)<1e-10);
 assert.ok(a.low<a.price&&a.high>a.price);
});
test('linear issuance and missing evidence are handled explicitly',()=>{
 const c={id:'monero',current_price:100,circulating_supply:19000000};
 assert.equal(projectForecast(c,5).futureSupply,19788400);
 assert.equal(projectForecast({...c,circulating_supply:0},1),null);
 assert.equal(projectForecast({...c,current_price:NaN},1),null);
 assert.equal(projectForecast({...c,id:'unknown'},1),null);
 assert.equal(projectForecast(c,2),null);
 for(const id of Object.keys(assumptions))for(const y of [1,3,5]){
  const r=projectForecast({...c,id},y);assert.ok(r.low<r.price&&r.price<r.high);assert.ok(Number.isFinite(r.price));
 }
});
