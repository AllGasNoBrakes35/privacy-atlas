import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {supplementalIds,coverageScope,ensureCuratedCoverage} from '../dist/ecosystem.js';
import {mergeMarketCoins} from '../dist/markets.js';
const base='https://api.coingecko.com/api/v3';
const get=path=>JSON.parse(execFileSync('curl',['--fail','--silent','--show-error','--max-time','25',base+path],{encoding:'utf8',maxBuffer:20e6}));
mkdirSync('dist/data',{recursive:true});
let previous={coins:[],histories:{}};
try{previous=JSON.parse(readFileSync('dist/data/snapshot.json','utf8'));}catch{}
let coins=[];
for(let page=1;page<=20;page++){
 const rows=get(`/coins/markets?vs_currency=usd&category=privacy-coins&per_page=250&page=${page}&sparkline=false&price_change_percentage=7d,30d`);
 if(!Array.isArray(rows))throw Error('Invalid markets');coins.push(...rows);if(rows.length<250)break;
 if(page===20)throw Error('Pagination limit reached');
}
const errors={};
try{const extra=get(`/coins/markets?vs_currency=usd&ids=${supplementalIds.join(',')}&sparkline=false&price_change_percentage=7d,30d`);if(!Array.isArray(extra))throw Error('Invalid supplemental markets');coins=mergeMarketCoins(coins,extra);}
catch{errors.supplemental='Curated quotes could not refresh; saved quotes retain their original timestamps.';}
coins=mergeMarketCoins(previous.coins??[],coins);
coins=ensureCuratedCoverage(coins,JSON.parse(readFileSync('dist/data/curated-identities.json','utf8')));
const histories={...previous.histories};
for(const c of coins){
 try{const h=get(`/coins/${encodeURIComponent(c.id)}/market_chart?vs_currency=usd&days=90&interval=daily`);if(!Array.isArray(h.prices))throw Error('No prices');histories[c.id]=h.prices;}
 catch(e){errors[c.id]='Historical data unavailable';}
 console.log(c.id,histories[c.id]?.length??'unavailable');
}
writeFileSync('dist/data/snapshot.json',JSON.stringify({fetchedAt:new Date().toISOString(),source:'CoinGecko API',scope:coverageScope,coins,histories,errors}));
console.log('Saved',coins.length,'coins');
