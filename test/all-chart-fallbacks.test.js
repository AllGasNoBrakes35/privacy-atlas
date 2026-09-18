import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {priceSamples,ranges} from '../dist/history.js';import {newestHistory} from '../dist/history-cache.js';
test('every saved asset/range stays drawable after an API failure',async()=>{
 const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const render=source.slice(source.indexOf('function renderPriceChart(){'),source.indexOf('async function get('));
 const start=source.indexOf('async function refreshHistory('),refresh=source.slice(start,source.indexOf('for(const range of ranges)',start));
 const elements=new Map();let drawn=[];
 const context={asset:null,current:()=>context.asset,data:{},chartDays:90,historyLoadTimer:null,bundledHistory:new Map(),historyBundlesLoaded:new Set(),ensureHistoryBundle:async()=>{},historyCache:new Map(),historyPending:new Set(),historyAttempted:new Set(),historyErrors:new Map(),selected:null,priceSamples,newestHistory,ranges,Date,setTimeout:()=>0,clearTimeout:()=>{},when:t=>new Date(t).toISOString(),node:()=>({}),drawPriceChart:(svg,readout,rows)=>{drawn=rows},saveHistoryCache:()=>{},chartStorage:null,loadHistory:async()=>{throw Error('Provider request failed (429)')},$:id=>{if(!elements.has(id))elements.set(id,{children:[],append(){},textContent:''});return elements.get(id)}};
 vm.createContext(context);vm.runInContext(render+'\n'+refresh,context);
 const dir=new URL('../dist/data/history/',import.meta.url);
 let checked=0;
 for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){
  const id=file.slice(0,-5),saved=JSON.parse(fs.readFileSync(new URL(file,dir)));context.selected=id;context.asset={id,name:id};context.historyBundlesLoaded.add(id);
  for(const [days,h]of Object.entries(saved)){context.chartDays=Number(days);context.bundledHistory.set(`${id}:${days}`,h);await vm.runInContext(`refreshHistory(${JSON.stringify(id)},${Number(days)})`,context);assert.ok(drawn.length>=2,`${id}:${days} lost fallback`);assert.match(elements.get('chartInfo').textContent,/429/);checked++;}
 }
 assert.ok(checked>0);console.log(`Verified ${checked} saved asset/range charts under simulated provider failure.`);
});
