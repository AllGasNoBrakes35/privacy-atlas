import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {priceSamples,ranges} from '../dist/history.js';
import {newestHistory} from '../dist/history-cache.js';
test('actual chart rendering keeps all Monero ranges visible after live refresh fails',async()=>{
 const saved=JSON.parse(fs.readFileSync(new URL('../dist/data/monero-history.json',import.meta.url)));
 const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const render=source.slice(source.indexOf('function renderPriceChart(){'),source.indexOf('async function get('));
 const refresh=source.slice(source.indexOf('async function refreshHistory('),source.indexOf('for(const range of ranges)',source.indexOf('async function refreshHistory(')));
 const elements=new Map();let lastRows=[];
 const context={current:()=>({id:'monero',name:'Monero'}),data:{},chartDays:90,historyLoadTimer:null,bundledHistory:new Map(),historyBundlesLoaded:new Set(['monero']),ensureHistoryBundle:async()=>{},historyCache:new Map(Object.entries(saved).map(([days,h])=>[`monero:${days}`,h])),historyPending:new Set(),historyAttempted:new Set(),historyErrors:new Map(),selected:'monero',priceSamples,newestHistory,ranges,Date,setTimeout:()=>0,clearTimeout:()=>{},when:t=>new Date(t).toISOString(),node:()=>({}),drawPriceChart:(svg,readout,rows)=>{lastRows=rows},saveHistoryCache:()=>{},chartStorage:null,loadHistory:async()=>{throw Error('Provider request failed (429)')},$:id=>{if(!elements.has(id))elements.set(id,{children:[],append(){},textContent:''});return elements.get(id)}};
 vm.createContext(context);vm.runInContext(render+'\n'+refresh,context);
 for(const {days}of ranges){context.chartDays=days;await vm.runInContext(`refreshHistory('monero',${days})`,context);assert.ok(lastRows.length>2,`${days} day chart disappears`);assert.match(elements.get('chartInfo').textContent,/429/);assert.ok(elements.get('chartTitle').textContent.includes(ranges.find(r=>r.days===days).label));}
});
