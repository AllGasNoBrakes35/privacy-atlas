const $=id=>document.getElementById(id);
export const projectData=await fetch('data/projects.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>({projects:{}}));
const repoData=await fetch('data/repositories.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>({}));
for(const [id,g] of Object.entries(repoData)){projectData.projects[id]??={id};projectData.projects[id].github=g;delete projectData.projects[id].githubError;}
const [contributors,logos]=await Promise.all(['contributors','logos'].map(name=>fetch(`data/${name}.json`).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>({}))));
const editorial={
 monero:{team:'Monero CLI and GUI development workgroups; independent contributors and the Monero Research Lab.',teamSource:'https://www.getmonero.org/community/workgroups/',algorithm:'RandomX',algorithmSource:'https://www.getmonero.org/resources/moneropedia/randomx.html',openSource:'Yes — project identifies its software as open source',source:'https://www.getmonero.org/get-started/faq/'},
 zcash:{team:'Zcash Foundation, Electric Coin Company and independent ecosystem teams; responsibilities differ across node and wallet implementations.',teamSource:'https://z.cash/ecosystem/'},
 zcoin:{team:'Peter Shugalev (lead developer), Levon Petrosyan and Narek Geghamyan (core developers); Aram Jivanyan (privacy architect).',teamSource:'https://firo.org/about/team/',algorithm:'FiroPoW',algorithmSource:'https://firo.org/guide/how-to-mine-firo.html'},
 decred:{algorithm:'BLAKE3 · hybrid proof of work / proof of stake',algorithmSource:'https://docs.decred.org/mining/overview/'},
 zano:{team:'Andrey Sabelnikov (co-founder/core developer) and Valeriy Pisarkov (core developer/research lead); Pavel Nikienkov coordinates the project.',teamSource:'https://zano.org/team',algorithm:'ProgPoWZ · hybrid mining and Zarcanum staking',algorithmSource:'https://docs.zano.org/'},
 minotari:{algorithm:'SHA-3 mining and RandomX merge mining with Monero',algorithmSource:'https://github.com/tari-project/tari',team:'Tari protocol contributors; repository code ownership is maintained in CODEOWNERS.',teamSource:'https://github.com/tari-project/tari/blob/development/CODEOWNERS'},
 pivx:{team:'Fuzzbawls (lead/core developer), James Stewart, Duddino and LukeL (core developers); PIVX Labs also contributes.',teamSource:'https://pivx.org/team',algorithm:'Not applicable — proof of stake',algorithmSource:'https://pivx.org/team'},
 dero:{algorithm:'AstroBWT family · current variant not verified here',algorithmSource:'https://docs.dero.io/'},
 beam:{algorithm:'BeamHash III',algorithmSource:'https://www.beam.mw/'},
 dash:{algorithm:'X11',algorithmSource:'https://docs.dash.org/en/stable/docs/user/mining/index.html'},
 'zephyr-protocol':{algorithm:'RandomX',algorithmSource:'https://zephyrprotocol.com/'},
 xelis:{summary:'A programmable BlockDAG network using encrypted balances and transfer amounts. Its ecosystem includes wallets, native confidential assets and the XVM smart-contract platform.',source:'https://docs.xelis.io/',algorithm:'XELIS Hash v3',algorithmSource:'https://docs.xelis.io/features/mining/xelis-hash'},
 'neptune-cash':{summary:'A layer-one digital-cash network combining zero-knowledge STARK proofs, mutator sets and programmable transactions. Its design targets private transfers and compact blockchain verification.',source:'https://neptune.cash/'}
};
function link(url,label){try{const u=new URL(url);if(u.protocol!=='https:'&&u.protocol!=='http:')return document.createTextNode(label);}catch{return document.createTextNode(label);}const a=document.createElement('a');a.href=url;a.textContent=label;a.target='_blank';a.rel='noopener';return a;}
function field(label,value,url){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;if(url)dd.append(link(url,value));else dd.textContent=value;$('projectFacts').append(dt,dd);}
function timestamp(t){const d=new Date(t);return t&&Number.isFinite(d.getTime())?d.toLocaleString(undefined,{timeZone:'UTC'})+' UTC':'Unavailable';}
const openLicenses=new Set(['MIT','BSD-2-Clause','BSD-3-Clause','Apache-2.0','GPL-2.0','GPL-3.0','GPL-2.0-only','GPL-3.0-only','GPL-2.0-or-later','GPL-3.0-or-later','AGPL-3.0','AGPL-3.0-only','AGPL-3.0-or-later','LGPL-2.1','LGPL-3.0','MPL-2.0','ISC','Unlicense','CC0-1.0']);
export function logo(c,large=false){
 const image=document.createElement('img');image.alt='';image.width=large?48:28;image.height=large?48:28;image.className=large?'asset-logo large':'asset-logo';image.loading=large?'eager':'lazy';image.decoding='async';image.referrerPolicy='no-referrer';
 const m=projectData.projects[c.id];const remote=typeof c.image==='string'&&/^https:\/\/coin-images\.coingecko\.com\//.test(c.image)?c.image:null;
 const candidate=logos[c.id]?.path??m?.logo;
 const local=candidate&&/^logos\/[a-z0-9-]+\.(png|jpg|webp)$/.test(candidate)?candidate:null;
 image.src=local||remote||'';image.onerror=()=>{if(local&&image.getAttribute('src')===local&&remote){image.src=remote;return;}const fallback=document.createElement('span');fallback.className='asset-logo logo-fallback';fallback.textContent=c.symbol.slice(0,2).toUpperCase();fallback.title='Logo unavailable';image.replaceWith(fallback);};return image;
}
let currentCoin,currentProfile,refreshing=false;
export function renderProject(c,profile){
 currentCoin=c;currentProfile=profile;const m=projectData.projects[c.id]??{},e=editorial[c.id]??{},g=m.github;
 $('projectTitle').replaceChildren(logo(c,true),document.createTextNode(`${c.name} · Project overview`));
 let summary=e.summary;
 if(!summary&&profile.reviewed)summary=`${profile.goal} ${profile.protocol}`;
 if(!summary&&g?.description)summary=`${c.name} maintains the linked repository, described by its authors as: “${g.description.split(/\s+/).slice(0,25).join(' ')}”.`;
 if(!summary&&m.platform)summary=`${c.name} (${c.symbol.toUpperCase()}) is listed as a token on ${m.platform}. Its specific application and privacy mechanisms have not yet been independently summarized.`;
 if(!summary)summary=`${c.name} (${c.symbol.toUpperCase()}) appears in the provider’s privacy-coin coverage${m.categories?.length?`, with classifications including ${m.categories.filter(x=>!/(Portfolio|Ecosystem|Made in|Index)/.test(x)).slice(0,3).join(', ')}`:''}. A reliable description of its specific use case is not yet available in this review.`;
 $('projectSummary').textContent=summary;
 $('projectSummarySource').replaceChildren(link(e.source||(profile.reviewed?profile.sources[0]:g?.url)||m.marketSource||`https://www.coingecko.com/en/coins/${encodeURIComponent(c.id)}`,'Summary source ↗'));
 $('projectFacts').replaceChildren();
 field('Main developers / teams',e.team||'Current lead developers not verified',e.teamSource);
 if(g)field('Repository owner',g.owner+' (not necessarily the lead developer)',g.ownerUrl);
 const people=contributors[c.id];
 if(people?.people?.length){field('GitHub contributors',people.people.map(p=>`${p.name} (${p.commits.toLocaleString()} commits)`).join(', '),people.source);field('Contributor scope','Top returned historical contributors to the tracked repository; may include upstream authors. Not a list of current leads.');}
 const license=g?.license;
 field('Open source?',e.openSource||(g?(openLicenses.has(license)?`Yes — selected repository: ${license}`:`Public code; open-source license ${license&&license!=='NOASSERTION'?license:'not confirmed'}`):'Unknown — no verified repository/license'),e.openSource?e.source:g?.url);
 let algorithm=e.algorithm;
 const cats=m.categories??[];
 if(!algorithm&&/^proof of stake$/i.test(m.hashingAlgorithm??''))algorithm='Not applicable — proof of stake (vendor-reported)';
 if(!algorithm&&cats.includes('Proof of Stake (PoS)')&&!cats.includes('Proof of Work (PoW)'))algorithm='Not applicable — provider classifies it as proof of stake';
 if(!algorithm&&m.platform)algorithm=`Not applicable to the listed token representation on ${m.platform}; any separate native-chain consensus is unverified`;
 if(!algorithm&&m.hashingAlgorithm)algorithm=m.hashingAlgorithm+' (vendor-reported; current mining use not independently verified)';
 field('Proof-of-work algorithm',algorithm||'Not verified',e.algorithmSource||m.marketSource);
 field('Last GitHub push',g?timestamp(g.pushedAt):'Unavailable',g?.url);
 if(g){field('Tracked repository',g.name,g.url);field('Repository selection',g.selection||'First provider-listed repository');field('Repository status',g.archived?'Archived':g.fork?'Public fork':'Public repository');field('GitHub checked',timestamp(g.checkedAt),g.apiSource);}
 field('Project metadata checked',timestamp(m.checkedAt),m.marketSource);
 $('projectLinks').replaceChildren();
 for(const url of [...new Set([...(m.websites??[]),...(m.repositories??[])])].slice(0,8)){$('projectLinks').append(link(url,new URL(url).hostname==='github.com'?url.replace('https://github.com/',''):new URL(url).hostname),document.createTextNode(' · '));}
 if(g)$('projectLinks').append(link(g.url+'/graphs/contributors','View GitHub contributors ↗'));
 $('githubRefresh').disabled=refreshing||!g;
 $('projectStatus').textContent=m.githubError?'Latest GitHub fetch failed; any displayed timestamp is from the last successful check.':m.error?'Project source fetch failed; showing available saved information.':'';
}
$('githubRefresh').onclick=async()=>{
 const id=currentCoin.id,g=projectData.projects[id]?.github;if(!g||refreshing)return;
 refreshing=true;$('githubRefresh').disabled=true;$('projectStatus').textContent='Checking the tracked GitHub repository…';
 try{const r=await fetch('https://api.github.com/repos/'+g.name,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error();const d=await r.json();if(!d.full_name||typeof d.pushed_at!=='string')throw Error();projectData.projects[id].github={...g,name:d.full_name,url:d.html_url,owner:d.owner.login,ownerUrl:d.owner.html_url,pushedAt:d.pushed_at,license:d.license?.spdx_id??null,archived:d.archived,fork:d.fork,checkedAt:new Date().toISOString()};delete projectData.projects[id].githubError;
 }catch{projectData.projects[id].githubError='Request failed';}
 finally{refreshing=false;renderProject(currentCoin,currentProfile);}
};
