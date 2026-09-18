import {collectActivity,rateDevelopment} from './development.js';
const $=id=>document.getElementById(id);
const saved=await fetch('data/development.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>({}));
const pending=new Map(),attempted=new Set(),failures=new Map();
let current;
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const date=t=>t?new Date(t).toLocaleDateString(undefined,{timeZone:'UTC',year:'numeric',month:'short',day:'numeric'}):'Unavailable';
function link(url,label){const a=el('a',label);if(/^https:\/\/(github\.com|api\.github\.com)\//.test(url??'')){a.href=url;a.target='_blank';a.rel='noopener';}return a;}
export function developmentRating(id){return rateDevelopment(saved[id]);}
export function renderDevelopment(c,g){
 current={c,g};const e=saved[c.id],rating=rateDevelopment(e),m=e?.metrics;
 $('developmentScore').textContent=rating.score===null?rating.label:`${rating.score.toFixed(1)} / 10`;
 $('developmentLabel').textContent=rating.score===null?'Insufficient current evidence':rating.label;
 $('developmentScope').replaceChildren();
 if(g){$('developmentScope').append(link(g.url,g.name),el('span',` · ${e?.branch??'default branch'} · 90-day observation`));}
 else $('developmentScope').textContent='No tracked GitHub repository is available for this asset.';
 $('developmentAsOf').textContent=e?.checkedAt?`Observed ${date(e.since)} – ${date(e.checkedAt)} (UTC). ${Date.now()-Date.parse(e.checkedAt)>7*86400000?'Saved evidence is over 7 days old.':''}`:'No saved development observation yet.';
 $('developmentReason').textContent=g?rating.reason:'Not rated — missing repository evidence does not mean inactive development.';
 $('developmentMetrics').replaceChildren();
 const count=n=>n===undefined?'Unavailable':`${e?.complete?'':'≥ '}${n.toLocaleString()}`;
 for(const [label,value,detail]of [
  ['Active contributors',count(m?.authors90),'Distinct non-bot commit authors · 90 days'],
  ['Commits',count(m?.commits90),'Non-merge, non-bot commits · 90 days'],
  ['Commits in 30 days',count(m?.commits30),'Recent pace within the observation'],
  ['Active weeks',m?`${count(m.activeWeeks)} / 13`:'Unavailable','Weeks with an eligible commit']
 ]){const box=el('div');box.append(el('span',label),el('strong',value),el('small',detail));$('developmentMetrics').append(box);}
 $('developmentFacts').replaceChildren();
 function field(label,value,url){const dd=el('dd');dd.append(url?link(url,value):document.createTextNode(value));$('developmentFacts').append(el('dt',label),dd);}
 field('Last eligible commit',m?.lastCommitAt?date(m.lastCommitAt):e?.complete?'None in the 90-day window':'Unavailable',e?.sources?.commits);
 field('Last repository push',date(e?.pushedAt),g?.url);
 field('Merged pull requests · 90 days',e?.mergedPRs90===undefined?'Unavailable':`${e.pullsComplete?'':'≥ '}${e.mergedPRs90}`,e?.sources?.pulls);
 field('Latest stable release',e?.latestRelease?`${e.latestRelease.name} · ${date(e.latestRelease.date)}`:e?.releasesChecked?'None found in the latest 100 releases':'Unavailable',e?.latestRelease?.url??e?.sources?.releases);
 field('Open issues + pull requests',e?.openItems===undefined?'Unavailable':String(e.openItems),g?.url+'/issues');
 field('Repository status',e?.archived?'Archived':e?.fork?'Public fork':e?.head?'Public repository':'Unavailable');
 field('Excluded from commit metrics',m?`${m.botCommits} detected bot commits · ${m.mergeCommits} merge commits`:'Unavailable');
 $('developmentBreakdown').replaceChildren();
 for(const component of rating.components??[]){const row=el('div'),meter=el('meter');meter.min=0;meter.max=component.max;meter.value=component.points;meter.setAttribute('aria-label',component.label);row.append(el('span',component.label),meter,el('span',`${component.points.toFixed(1)} / ${component.max}`));$('developmentBreakdown').append(row);}
 $('developmentStatus').textContent=pending.has(c.id)?'Checking GitHub activity…':failures.get(c.id)??e?.warnings?.join(' ')??'';
 $('developmentRefresh').disabled=!g||pending.has(c.id);
 if(g&&!attempted.has(c.id)&&(!e||Date.now()-Date.parse(e.checkedAt)>86400000))void refreshDevelopment(c,g);
}
export async function refreshDevelopment(c=current?.c,g=current?.g){
 if(!c||!g||pending.has(c.id))return;
 attempted.add(c.id);pending.set(c.id,true);failures.delete(c.id);
 if(current?.c.id===c.id)renderDevelopment(c,g);
 try{
  const evidence=await collectActivity(g.name);
  if(evidence.complete||!saved[c.id]?.complete)saved[c.id]=evidence;
  else failures.set(c.id,'GitHub refresh was incomplete. Showing the last complete observation with its original dates.');
 }catch{failures.set(c.id,'GitHub could not refresh. Any saved observation is retained.');}
 finally{pending.delete(c.id);if(current?.c.id===c.id)renderDevelopment(current.c,current.g);document.dispatchEvent(new CustomEvent('development-updated'));}
}
$('developmentRefresh').onclick=()=>refreshDevelopment();
