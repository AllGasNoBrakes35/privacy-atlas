import {loadHistory,priceSamples,ranges} from './history.js';
import {drawPriceChart} from './chart.js';
import {newestHistory,availableHistory,readHistoryCache,saveHistoryCache} from './history-cache.js';
import {mergeMarketCoins} from './markets.js';
let chartDays=90,historyLoadTimer;
let chartStorage;try{chartStorage=window.localStorage;}catch{}
const historyCache=readHistoryCache(chartStorage);
const bundledHistory=new Map(),historyBundlesLoaded=new Set(),historyBundleRequests=new Map();
const historyPending=new Set(),historyAttempted=new Set(),historyErrors=new Map();
import {profiles,unknown} from './profiles.js';
import {privacyRating} from './privacy-scores.js';
import {logo,renderProject} from './project-info.js';
const $=id=>document.getElementById(id), api='https://api.coingecko.com/api/v3';
let data,selected='monero',mode='Bundled snapshot',busy=false;
const valid=n=>Number.isFinite(n);
const positive=n=>valid(n)&&n>0;
const usd=n=>valid(n)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:n<1?8:n<100?4:2}).format(n):'—';
const compact=n=>positive(n)?'$'+new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(n):'Unreported';
const num=n=>positive(n)?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n):'Unreported';
const percent=n=>valid(n)?`${n>=0?'+':''}${n.toFixed(2)}%`:'—';
const when=t=>t&&Number.isFinite(new Date(t).getTime())?new Date(t).toLocaleString(undefined,{timeZone:'UTC'})+' UTC':'Unknown';
const profile=c=>profiles[c.id]??(c.symbol.toLowerCase()==='xtm'?profiles.minotari:unknown);
const note=t=>{$('notice').textContent=t;};
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function tag(text){return node('span',text,'tag');}
function sum(key){return data.coins.reduce((s,c)=>s+(positive(c[key])?c[key]:0),0);}
function current(){return data.coins.find(c=>c.id===selected);}
function render(){
 $('count').textContent=data.coins.length;$('total').textContent=compact(sum('market_cap'));$('volume').textContent=compact(sum('total_volume'));$('scored').textContent=`${data.coins.filter(c=>privacyRating(c.id).score!==null).length} / ${data.coins.length}`;
 $('freshness').textContent=`${mode} · fetched ${when(data.fetchedAt)}`;
 const query=$('search').value.trim().toLowerCase(),privacy=$('privacy').value,sort=$('sort').value;
 const rows=data.coins.filter(c=>(!query||`${c.name} ${c.symbol}`.toLowerCase().includes(query))&&(!privacy||profile(c).mode===privacy));
 rows.sort((a,b)=>sort==='privacy_score'?(privacyRating(b.id).score??-1)-(privacyRating(a.id).score??-1):sort==='name'?a.name.localeCompare(b.name):(b[sort]??-Infinity)-(a[sort]??-Infinity));
 $('rows').replaceChildren();
 for(const c of rows){
  const rating=privacyRating(c.id),tr=node('tr');tr.classList.add('project-row');if(c.id===selected)tr.classList.add('selected');
  tr.onclick=event=>{if(!event.target.closest('button,a,input,select,textarea'))select(c.id);};
  const first=node('td'),b=node('button',c.name);b.setAttribute('aria-label',`Research ${c.name}`);b.onclick=()=>select(c.id);first.append(logo(c),b,node('small',c.symbol.toUpperCase()));
  const quote=node('td',usd(c.current_price));const age=Date.now()-Date.parse(c.last_updated);
  quote.title=`Provider quote: ${when(c.last_updated)}`;
  if(!valid(age)||age>3600000)quote.append(node('small',' · stale','down'));
  const change=node('td',percent(c.price_change_percentage_24h),c.price_change_percentage_24h<0?'down':'up');
  const privacyCell=node('td');privacyCell.append(tag(profile(c).mode));
  tr.append(first,quote,change,node('td',compact(c.market_cap)),node('td',compact(c.total_volume)),privacyCell,node('td',rating.score===null?'Not rated':`${rating.score} / 10`));
  $('rows').append(tr);
 }
 if(!rows.length){const tr=node('tr'),td=node('td','No assets match these filters.');td.colSpan=7;tr.append(td);$('rows').append(tr);}
 $('coverage').textContent=`Showing ${rows.length} of ${data.coins.length} covered assets. Universe: ${data.scope}. Coverage is not exhaustive; category membership is not a privacy guarantee. Protocol reviews available for ${data.coins.filter(c=>profile(c)!==unknown).length} assets.`;
 renderDetail();
}
function select(id){if(!data.coins.some(c=>c.id===id))throw Error('Unknown asset');selected=id;render();$('detail').scrollIntoView({behavior:'auto',block:'start'});}
function renderDetail(){
 const c=current();if(!c)return;const p=profile(c),rating=privacyRating(c.id);
 renderProject(c,p);
 $('privacyScore').textContent=rating.score===null?'Not rated':`${rating.score} / 10`;
 $('scoreReason').textContent=rating.reason;
 $('scoreDate').textContent=rating.reviewed?`Editorial privacy assessment · ${rating.reviewed}`:'Privacy review pending';
 $('scoreSources').replaceChildren();for(const url of rating.sources){const a=node('a',`Privacy source · ${new URL(url).hostname} ↗`);a.href=url;a.target='_blank';a.rel='noopener';$('scoreSources').append(a,node('br'));}
 $('assetName').textContent=`${c.name} / ${c.symbol.toUpperCase()}`;$('marketLink').href=`https://www.coingecko.com/en/coins/${encodeURIComponent(c.id)}`;
 $('protocol').textContent=p.protocol;$('goals').textContent=p.goal;$('risks').textContent=p.risks;$('economics').textContent=p.economics;
 $('reviewed').textContent=p.reviewed?`Editorial review: ${p.reviewed}. See source status for subsequent changes.`:'Editorial review pending.';
 $('sources').replaceChildren();p.sources.forEach((url,i)=>{const a=node('a',`Project source ${i+1} · ${new URL(url).hostname} ↗`);a.href=url;a.target='_blank';a.rel='noopener';$('sources').append(a);});
 const finance=[['Provider quote time',when(c.last_updated)],['Price',usd(c.current_price)],['Market cap',compact(c.market_cap)],['Vendor FDV',compact(c.fully_diluted_valuation)],['24h reported volume',compact(c.total_volume)],['Volume / market cap',positive(c.market_cap)&&valid(c.total_volume)?(c.total_volume/c.market_cap*100).toFixed(2)+'%':'—'],['7d / 30d return',`${percent(c.price_change_percentage_7d_in_currency)} / ${percent(c.price_change_percentage_30d_in_currency)}`],['Circulating supply',num(c.circulating_supply)],['Total supply',num(c.total_supply)],['Vendor maximum supply',num(c.max_supply)],['Circulating / max',positive(c.max_supply)&&positive(c.circulating_supply)?(c.circulating_supply/c.max_supply*100).toFixed(2)+'%':'Not established'],['Below all-time high',valid(c.ath_change_percentage)?percent(c.ath_change_percentage):'—']];
 $('financials').replaceChildren();for(const [k,v]of finance)$('financials').append(node('dt',k),node('dd',v));
 renderPriceChart();
}
function renderPriceChart(){
 const c=current();if(!c)return;
 const days=chartDays,key=`${c.id}:${days}`,range=ranges.find(r=>r.days===days);
 const bundled=days===90?{prices:data.histories?.[c.id]??[],...(data.historyMetadata?.[c.id]??{source:'CoinGecko',currency:'USD',description:'Saved daily price samples'})}:null;
 const history=(days==='max'?availableHistory:newestHistory)(historyCache.get(key),bundledHistory.get(key),bundled)??{prices:[],source:'CoinGecko',currency:'USD'};
 const referenceTime=history.asOf??(history.prices?.at(-1)?.[0]??Date.now());
 const rows=priceSamples(history.prices,Math.min(referenceTime,Date.now()),days);
 const bundleReady=historyBundlesLoaded.has(c.id);
 const needsRefresh=bundleReady&&!historyAttempted.has(key)&&(rows.length<2||Date.now()-referenceTime>300000);
 const loading=!bundleReady||historyPending.has(key)||needsRefresh;
 $('historyRefresh').disabled=historyPending.has(key);
 $('chartTitle').textContent=`Price history · ${range.label} · ${history.currency}`;
 for(const button of $('chartRanges').children)button.setAttribute('aria-pressed',String(button.dataset.days===String(days)));
 const age=Date.now()-(rows.at(-1)?.[0]??0);
 const status=loading?'Checking for newer prices…':historyErrors.get(key)??(age>3600000?'Saved history — latest point is over an hour old.':'');
 $('chartInfo').textContent=rows.length>=2?`${history.source} · ${history.description} · ${rows.length} samples · ${when(rows[0][0])} to ${when(rows.at(-1)[0])}${status?' · '+status:''}`:(status??'No historical prices available for this range.');
 if(history.url&&rows.length>=2){const link=node('a',' View source');link.href=history.url;link.target='_blank';link.rel='noopener';$('chartInfo').append(link);}
 drawPriceChart($('chart'),$('chartReadout'),rows,c.name,history.currency,loading);
 if(!bundleReady)void ensureHistoryBundle(c.id);
 clearTimeout(historyLoadTimer);
 if(needsRefresh)historyLoadTimer=setTimeout(()=>{if(selected===c.id&&chartDays===days)void refreshHistory(c.id,days);},250);
}
async function get(path){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);try{const r=await fetch(api+path,{signal:controller.signal,cache:'no-store'});if(!r.ok)throw Error(r.status===429?'Provider rate limit. Try again later.':`Provider request failed (${r.status}).`);return await r.json();}finally{clearTimeout(timeout);}}
async function refreshMarkets(){
 if(busy)return;busy=true;$('refresh').disabled=true;note('Refreshing provider quotes…');
 const updates=[],warnings=[];
 try{
  try{for(let page=1;page<=20;page++){const rows=await get(`/coins/markets?vs_currency=usd&category=privacy-coins&per_page=250&page=${page}&sparkline=false&price_change_percentage=7d,30d`);if(!Array.isArray(rows))throw Error('Invalid provider response');updates.push(...rows);if(rows.length<250)break;}}
  catch(e){warnings.push(e.message);}
  if(!warnings.some(w=>/rate limit/i.test(w)))try{const extras=await get('/coins/markets?vs_currency=usd&ids=beam,zephyr-protocol,dash&sparkline=false&price_change_percentage=7d,30d');if(Array.isArray(extras))updates.push(...extras);else warnings.push('Supplemental quotes unavailable.');}
  catch(e){warnings.push(e.message);}
  const merged=mergeMarketCoins(data.coins,updates),changed=merged.filter(c=>data.coins.find(old=>old.id===c.id)!==c).length;
  if(changed){data.coins=merged;data.fetchedAt=new Date().toISOString();mode=warnings.length?'Partially refreshed market data':'Refreshed market data';render();}
  note(changed?`${changed} quotes refreshed.${warnings.length?' Some requests failed; existing quotes and their timestamps were retained.':''}`:`Quotes could not refresh. Existing prices and their timestamps were retained. ${warnings[0]??''}`);
 }finally{busy=false;$('refresh').disabled=false;}
}
async function ensureHistoryBundle(id){
 if(historyBundlesLoaded.has(id))return;
 if(historyBundleRequests.has(id))return historyBundleRequests.get(id);
 const request=(async()=>{
  try{const response=await fetch(`data/history/${encodeURIComponent(id)}.json`);if(response.ok){const saved=await response.json();for(const range of ranges){const item=newestHistory(saved[range.days]);if(item)bundledHistory.set(`${id}:${range.days}`,item);}}}
  catch{/* Live history and previous snapshots remain available. */}
  finally{historyBundlesLoaded.add(id);historyBundleRequests.delete(id);if(selected===id)renderPriceChart();}
 })();historyBundleRequests.set(id,request);return request;
}
async function refreshHistory(id=selected,days=chartDays){
 const key=`${id}:${days}`;
 if(historyPending.has(key))return;
 historyPending.add(key);historyAttempted.add(key);historyErrors.delete(key);
 if(selected===id&&chartDays===days)renderPriceChart();
 try{const result=await loadHistory(id,{days});historyCache.set(key,days==='max'?availableHistory(bundledHistory.get(key),historyCache.get(key),result):result);saveHistoryCache(chartStorage,historyCache);}
 catch(e){historyErrors.set(key,e.message+' Existing chart data, if any, is retained.');}
 finally{historyPending.delete(key);if(selected===id&&chartDays===days)renderPriceChart();}
}
for(const range of ranges){const button=node('button',range.label);button.type='button';button.dataset.days=range.days;button.setAttribute('aria-label',`${range.name} price history`);button.setAttribute('aria-pressed',String(range.days===chartDays));button.onclick=()=>{chartDays=range.days;if(data)renderPriceChart();};$('chartRanges').append(button);}
for(const id of ['search','privacy','sort'])$(id).addEventListener(id==='search'?'input':'change',()=>render());
$('refresh').onclick=refreshMarkets;$('historyRefresh').onclick=()=>refreshHistory();
try{const r=await fetch('data/snapshot.json');if(!r.ok)throw Error('Snapshot could not load');data=await r.json();if(!Array.isArray(data.coins)||!data.coins.length)throw Error('No market data');if(!current())selected=data.coins[0].id;render();void refreshMarkets();}
catch(e){note(`Market data unavailable: ${e.message}`);$('refresh').disabled=true;$('historyRefresh').disabled=true;}
// A page restored from the back/forward cache does not run initialization again.
window.addEventListener('pageshow',event=>{if(event.persisted&&data)void refreshMarkets();});
if(document.modelContext?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'select_privacy_asset',description:'Select a covered cryptocurrency and show its market research. No transactions.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||typeof input.id!=='string'||Object.keys(input).some(k=>k!=='id')||!data)throw Error('Expected a covered asset id');select(input.id);return {id:selected,privacyScore:privacyRating(selected).score,source:'CoinGecko',quoteTime:current().last_updated};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
setInterval(()=>{if(data)render();},60000);
