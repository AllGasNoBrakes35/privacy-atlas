import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeCommits,rateDevelopment,collectActivity} from '../dist/development.js';
const now='2026-09-18T12:00:00Z',day=86400000;
const commit=(sha,days=1,login='alice',extra={})=>({sha,author:{login,type:'User'},parents:[{}],commit:{author:{name:login},committer:{date:new Date(Date.parse(now)-days*day).toISOString()}},...extra});
test('deduplicates, excludes bots/merges and enforces observation dates',()=>{
 const c=commit('a');const m=summarizeCommits([c,c,commit('b',40),commit('c',90),commit('old',91),commit('future',-1),commit('merge',1,'bob',{parents:[{},{}]}),commit('bot',1,'dependabot[bot]'),commit('d',1,'carol')],now);
 assert.equal(m.commits90,4);assert.equal(m.commits30,2);assert.equal(m.authors90,2);assert.equal(m.mergeCommits,1);assert.equal(m.botCommits,1);assert.equal(m.activeWeeks,3);assert.equal(m.weeks.reduce((a,b)=>a+b),4);
});
test('unknown evidence is not zero; observed inactivity is zero; stale is not rated',()=>{
 assert.equal(rateDevelopment(null).score,null);
 const e={complete:true,checkedAt:now,metrics:summarizeCommits([],now)};
 assert.equal(rateDevelopment(e,Date.parse(now)).score,0);
 assert.equal(rateDevelopment({...e,complete:false},Date.parse(now)).score,null);
 assert.equal(rateDevelopment(e,Date.parse(now)+31*day).score,null);
 assert.equal(rateDevelopment({...e,metrics:{...e.metrics,unidentified:1}},Date.parse(now)).score,null);
});
test('score saturates at ten and includes recency decay at observation time',()=>{
 const e={complete:true,checkedAt:now,metrics:{authors90:20,commits90:200,activeWeeks:13,lastCommitAt:now,unidentified:0}};
 assert.equal(rateDevelopment(e,Date.parse(now)).score,10);
 e.metrics.lastCommitAt=new Date(Date.parse(now)-40*day).toISOString();
 assert.equal(rateDevelopment(e,Date.parse(now)).score,9);
});
function fixture({failPage=false,cap=false}={}){
 const urls=[];
 const fetcher=async url=>{urls.push(url);let data,next=false;
 if(url.includes('/pulls?'))data=[{merged_at:now,updated_at:now},{merged_at:null,updated_at:now}];
 else if(url.includes('/releases?'))data=[{tag_name:'pre',prerelease:true,published_at:now},{tag_name:'stable',published_at:now,html_url:'https://github.com/test/repo/releases/tag/stable'}];
 else if(url.includes('per_page=1')&&!url.includes('per_page=100'))data=[{sha:'pinned'}];
 else if(url.includes('/commits?')){if(failPage&&url.includes('page=2'))return {ok:false,status:429};data=[commit(url.includes('page=2')?'second':'first')];next=!url.includes('page=2');}
 else data={full_name:'test/repo',default_branch:'main',archived:false,fork:false};
 return {ok:true,headers:{get:()=>next?'rel="next"':null},json:async()=>data};};
 return {urls,fetcher};
}
test('paginates pinned commit history and separates releases and PR context',async()=>{
 const f=fixture();const e=await collectActivity('test/repo',{fetcher:f.fetcher,now});
 assert.equal(e.complete,true);assert.equal(e.metrics.commits90,2);assert.equal(e.latestRelease.name,'stable');assert.equal(e.mergedPRs90,1);assert.equal(e.pullsComplete,true);
 assert.ok(f.urls.filter(u=>u.includes('&page=')&&u.includes('/commits?')).every(u=>u.includes('sha=pinned')));
});
test('rate limits and page caps preserve lower-bound counts without assigning a score',async()=>{
 for(const options of [{failPage:true},{}]){const f=fixture(options);const e=await collectActivity('test/repo',{fetcher:f.fetcher,now,maxPages:options.failPage?30:1});assert.equal(e.complete,false);assert.equal(e.metrics.commits90,1);assert.equal(rateDevelopment(e,Date.parse(now)).score,null);}
});
