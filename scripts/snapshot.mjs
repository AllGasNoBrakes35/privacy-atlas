import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const base='https://api.coingecko.com/api/v3';
const get=path=>JSON.parse(execFileSync('curl',['--fail','--silent','--show-error','--max-time','25',base+path],{encoding:'utf8',maxBuffer:20e6}));
mkdirSync('dist/data',{recursive:true});
const coins=[];
for(let page=1;page<=20;page++){
 const rows=get(`/coins/markets?vs_currency=usd&category=privacy-coins&per_page=250&page=${page}&sparkline=false&price_change_percentage=7d,30d`);
 if(!Array.isArray(rows))throw Error('Invalid markets');coins.push(...rows);if(rows.length<250)break;
 if(page===20)throw Error('Pagination limit reached');
}
const histories={},errors={};
for(const c of coins){
 try{const h=get(`/coins/${encodeURIComponent(c.id)}/market_chart?vs_currency=usd&days=90&interval=daily`);if(!Array.isArray(h.prices))throw Error('No prices');histories[c.id]=h.prices;}
 catch(e){errors[c.id]='Historical data unavailable';}
 console.log(c.id,histories[c.id]?.length??'unavailable');
}
writeFileSync('dist/data/snapshot.json',JSON.stringify({fetchedAt:new Date().toISOString(),source:'CoinGecko API',scope:'CoinGecko privacy-coins category',coins,histories,errors}));
console.log('Saved',coins.length,'coins');
