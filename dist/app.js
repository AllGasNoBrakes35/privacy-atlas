import {dailySamples} from './math.js';
import {profiles,unknown} from './profiles.js';
import {privacyRating} from './privacy-scores.js';
import {logo,renderProject} from './project-info.js';
import {assumptions,projectForecast,reviewed as forecastDate} from './forecasts.js';
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
  const rating=privacyRating(c.id),tr=node('tr');if(c.id===selected)tr.className='selected';
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
 const c=current();if(!c)return;const p=profile(c),rating=privacyRating(c.id),rows=dailySamples(data.histories[c.id]);
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
 $('chartInfo').textContent=rows.length?`${rows.length} UTC daily samples · through ${when(rows.at(-1)[0])}`:`No verified historical series. ${data.errors?.[c.id]??'Use Refresh selected history.'}`;
 draw(rows,c.name);
 renderForecast(c,p);
}
function draw(rows,name){
 const svg=$('chart');svg.replaceChildren();svg.setAttribute('aria-label',`${name} daily USD prices, ${rows.length} samples`);
 if(rows.length<2){const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x','20');text.setAttribute('y','90');text.setAttribute('fill','#97a7b6');text.textContent='Historical prices unavailable';svg.append(text);return;}
 const values=rows.map(p=>p[1]),min=Math.min(...values),max=Math.max(...values),span=max-min||1;
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',rows.map((p,i)=>`${i?'L':'M'}${12+i/(rows.length-1)*616},${155-(p[1]-min)/span*130}`).join(' '));path.setAttribute('fill','none');path.setAttribute('stroke','#67e5c2');path.setAttribute('stroke-width','2.5');svg.append(path);
 for(const [y,v]of [[16,max],[177,min]]){const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x','12');t.setAttribute('y',String(y));t.setAttribute('fill','#97a7b6');t.setAttribute('font-size','12');t.textContent=usd(v);svg.append(t);}
}
function renderForecast(c,p){
 const out=$('forecastResults'),basis=$('forecastBasis'),model=assumptions[c.id];
 out.replaceChildren();basis.replaceChildren();
 $('forecastCoverage').textContent=`Numeric scenario coverage: ${data.coins.filter(x=>projectForecast(x,1)).length} of ${data.coins.length} assets. Forecast research is separate from privacy scores.`;
 const age=Date.now()-Date.parse(c.last_updated);
 $('forecastStatus').textContent=`Model review: ${forecastDate} · Price anchor: ${usd(c.current_price)} · Quote: ${when(c.last_updated)}${!valid(age)||age>3600000?' · STALE QUOTE — refresh prices before interpreting estimates.':''}`;
 for(const years of [1,3,5]){
  const r=projectForecast(c,years),box=node('div');
  box.append(node('h4',`${years}-year price prediction`));
  if(!r){box.append(node('b','Unavailable'),node('p',!model?'Insufficient reviewed project, adoption and tokenomics evidence.':'A positive price and circulating supply are required.'));out.append(box);continue;}
  box.append(node('span','BASE SCENARIO'),node('b',usd(r.price)),node('p',`Downside ${usd(r.low)} · Upside ${usd(r.high)}`),node('p',`Implied market cap: ${compact(r.cap)}`),node('span',`Assumed supply: ${num(r.futureSupply)} ${c.symbol.toUpperCase()}`));
  out.append(box);
 }
 if(!model){basis.append(node('p','This asset stays in the comparison. Forecasts will appear only after a project-specific review; missing evidence is not a zero price target.'));return;}
 const details=[
  ['Project merit',model.meritReason+` Editorial contribution to annual market-cap growth: ${percent(model.merit*100)} points.`],
  ['Adoptability',model.adoptionReason+` Editorial contribution: ${percent(model.adoption*100)} points. This is a qualitative judgment, not measured user growth.`],
  ['Tokenomics',p.economics],
  ['Supply assumption',c.id==='monero'?'Approximate addition of 157,680 XMR/year: 0.6 per block at an assumed two-minute cadence; penalties and actual timing can reduce or vary issuance.':c.id==='grin'?'Approximate addition of 31,536,000 GRIN/year from one coin per second, using 365-day years.':`Illustrative ${(model.dilution*100).toFixed(0)}% annual circulating-supply growth, compounded. This is an editorial dilution assumption, not a verified emission or unlock schedule.${c.id==='zcash'?' Model supply is limited to the documented 21 million cap unless the starting vendor supply already exceeds it.':''}${c.id==='minotari'?' XTM issuance, vesting and burns could differ materially; Ootle use does not imply this assumed growth rate.':''}`]
 ];
 for(const [title,body]of details){const section=node('div');section.append(node('h4',title),node('p',body));basis.append(section);}
 $('forecastCoverage').textContent=`Numeric scenario coverage: ${data.coins.filter(x=>projectForecast(x,1)).length} of ${data.coins.length} assets. Forecast research is separate from privacy scores.`;
 const sources=node('p', 'Project evidence: ','small');
 for(const url of p.sources){const link=node('a',new URL(url).hostname+' ↗ ');link.href=url;link.target='_blank';link.rel='noopener';sources.append(link);}
 basis.append(sources);
}
async function get(path){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);try{const r=await fetch(api+path,{signal:controller.signal});if(!r.ok)throw Error(r.status===429?'Provider rate limit. Try again later.':`Provider request failed (${r.status}).`);return await r.json();}finally{clearTimeout(timeout);}}
async function refreshMarkets(){
 if(busy)return;busy=true;$('refresh').disabled=true;note('Refreshing provider quotes…');
 try{const all=[];for(let page=1;page<=20;page++){const rows=await get(`/coins/markets?vs_currency=usd&category=privacy-coins&per_page=250&page=${page}&sparkline=false&price_change_percentage=7d,30d`);if(!Array.isArray(rows)||rows.some(c=>!c.id||!c.name||!c.symbol))throw Error('Invalid provider response.');all.push(...rows);if(rows.length<250)break;if(page===20)throw Error('Coverage pagination incomplete.');}
  const extras=await get('/coins/markets?vs_currency=usd&ids=beam,zephyr-protocol,dash&sparkline=false&price_change_percentage=7d,30d');
  if(!Array.isArray(extras))throw Error('Supplemental quote response invalid.');
  for(const c of extras)if(!all.some(x=>x.id===c.id))all.push(c);
  if(!all.length)throw Error('Provider returned no assets.');data.coins=all;data.fetchedAt=new Date().toISOString();mode='Refreshed market data';if(!current())selected=all[0].id;render();note('Quotes refreshed. Historical prices keep their own timestamps. Forecast scenarios now use the refreshed prices and supply.');
 }catch(e){note(`${e.message} Retaining the last snapshot and its timestamps.`);}finally{busy=false;$('refresh').disabled=false;}
}
async function refreshHistory(){
 const id=selected;$('historyRefresh').disabled=true;note('Fetching 90-day history for the selected asset…');
 try{const h=await get(`/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=90&interval=daily`);if(!Array.isArray(h.prices)||!h.prices.length)throw Error('No historical data returned.');data.histories[id]=h.prices;render();note('Historical prices refreshed.');}
 catch(e){note(`${e.message} Existing history, if any, is unchanged.`);}finally{$('historyRefresh').disabled=false;}
}
for(const id of ['search','privacy','sort'])$(id).addEventListener(id==='search'?'input':'change',()=>render());
$('refresh').onclick=refreshMarkets;$('historyRefresh').onclick=refreshHistory;
try{const r=await fetch('data/snapshot.json');if(!r.ok)throw Error('Snapshot could not load');data=await r.json();if(!Array.isArray(data.coins)||!data.coins.length)throw Error('No market data');if(!current())selected=data.coins[0].id;render();note('Sourced snapshot loaded. Use Refresh for newer quotes; privacy scores are editorial reviews.');}
catch(e){note(`Market data unavailable: ${e.message}`);$('refresh').disabled=true;$('historyRefresh').disabled=true;}
if(document.modelContext?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'select_privacy_asset',description:'Select a covered cryptocurrency and show its market research. No transactions.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||typeof input.id!=='string'||Object.keys(input).some(k=>k!=='id')||!data)throw Error('Expected a covered asset id');select(input.id);return {id:selected,privacyScore:privacyRating(selected).score,source:'CoinGecko',quoteTime:current().last_updated};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
setInterval(()=>{if(data)render();},60000);
