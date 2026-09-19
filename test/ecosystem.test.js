import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {curatedIds,ecosystem,ensureCuratedCoverage,rolesFor,supplementalIds} from '../dist/ecosystem.js';
import {mergeMarketCoins} from '../dist/markets.js';
import {profiles} from '../dist/profiles.js';
import {researchFor} from '../dist/research.js';
import {privacyRating} from '../dist/privacy-scores.js';
const read=name=>JSON.parse(readFileSync(new URL('../dist/data/'+name+'.json',import.meta.url)));
test('every curated asset has a unique bundled identity, research and ongoing refresh coverage',()=>{
 const coins=read('snapshot').coins,identities=read('curated-identities');
 assert.equal(new Set(coins.map(c=>c.id)).size,coins.length);
 assert.equal(identities.length,curatedIds.length);
 for(const id of curatedIds){assert.ok(coins.some(c=>c.id===id));assert.ok(identities.some(c=>c.id===id));assert.ok(supplementalIds.includes(id));assert.ok(profiles[id]);assert.ok(researchFor({id}).sources.length);assert.ok(rolesFor(id).length);assert.equal(privacyRating(id).score,null);}
 assert.ok(curatedIds.includes('midnight-3'));assert.ok(!curatedIds.includes('midnight'));
});
test('category-only refresh and failed supplemental quotes preserve curated assets and quote dates',()=>{
 const rose={id:'oasis-network',name:'Oasis',symbol:'rose',current_price:1,last_updated:'2026-09-18T00:00:00Z'};
 const unrelated={id:'monero',name:'Monero',symbol:'xmr',current_price:10,last_updated:'2026-09-18T01:00:00Z'};
 const merged=mergeMarketCoins([rose],[unrelated,{...rose,current_price:null}]);
 assert.deepEqual(merged.find(c=>c.id===rose.id),rose);
 assert.ok(rolesFor(rose.id).includes('Confidential computing'));
});
test('missing quotes do not remove curated coverage or invent market values',()=>{
 const identity={id:'secret',name:'Secret',symbol:'scrt'};
 const coins=ensureCuratedCoverage([], [identity]);
 assert.equal(coins[0].current_price,null);assert.equal(coins[0].last_updated,null);
 assert.equal(ensureCuratedCoverage(coins,[identity]).length,1);
 assert.ok(ecosystem.secret.limits.includes('Native SCRT'));
});
