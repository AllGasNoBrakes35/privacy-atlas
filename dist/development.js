// Public repository activity evidence. No credentials are used by the browser.
const DAY=86400000;
const date=value=>{const n=Date.parse(value);return Number.isFinite(n)?n:null;};
export function summarizeCommits(commits,checkedAt){
 const now=date(checkedAt),since=now-90*DAY,seen=new Set(),authors=new Set(),weeks=Array(13).fill(0);
 let commits90=0,commits30=0,botCommits=0,mergeCommits=0,unidentified=0,lastCommitAt=null;
 for(const c of commits){
  if(!c.sha||seen.has(c.sha))continue;seen.add(c.sha);
  const t=date(c.commit?.committer?.date);if(t===null||t<since||t>now)continue;
  if(c.parents?.length>1){mergeCommits++;continue;}
  const person=c.author,raw=c.commit?.author;
  if(person?.type==='Bot'||/\[bot\]|^(dependabot|renovate)(-bot)?$/i.test(person?.login??raw?.name??'')){botCommits++;continue;}
  commits90++;if(t>=now-30*DAY)commits30++;
  const key=person?.login?`github:${person.login.toLowerCase()}`:raw?.email?`email:${raw.email.toLowerCase()}`:raw?.name?`name:${raw.name.toLowerCase()}`:null;
  if(key)authors.add(key);else unidentified++;
  weeks[Math.min(12,Math.floor((now-t)/(7*DAY)))]++;
  if(!lastCommitAt||t>date(lastCommitAt))lastCommitAt=new Date(t).toISOString();
 }
 return {commits90,commits30,authors90:authors.size,activeWeeks:weeks.filter(n=>n>0).length,weeks:weeks.reverse(),lastCommitAt,botCommits,mergeCommits,unidentified};
}
export function rateDevelopment(evidence,now=Date.now()){
 if(!evidence||!evidence.complete||!evidence.metrics)return {score:null,label:'N/A',reason:'A complete 90-day commit history is needed to rate activity.'};
 if(now-date(evidence.checkedAt)>30*DAY)return {score:null,label:'Needs refresh',reason:'The saved observation is over 30 days old. Refresh to calculate a current rating.'};
 const m=evidence.metrics;
 if(m.unidentified)return {score:null,label:'N/A',reason:'Some commit authors could not be identified.'};
 const last=m.lastCommitAt?Math.max(0,(date(evidence.checkedAt)-date(m.lastCommitAt))/DAY):Infinity;
 const components=[
  {label:'Active contributors',points:3.5*Math.min(m.authors90/10,1),max:3.5},
  {label:'Commit volume',points:3*Math.min(m.commits90/150,1),max:3},
  {label:'Consistency',points:2*Math.min(m.activeWeeks/13,1),max:2},
  {label:'Recency',points:last<=7?1.5:last<=30?1:last<=60?.5:0,max:1.5}
 ];
 const score=Math.round(components.reduce((n,c)=>n+c.points,0)*10)/10;
 return {score,label:score>=8?'Very active':score>=6?'Active':score>=4?'Moderate':score>0?'Low activity':'No recent activity',components,reason:evidence.archived?'The tracked repository is archived; this rating describes its observed historical activity.':'Observed public activity in the tracked repository.'};
}
export async function collectActivity(repository,{fetcher=fetch,now=new Date().toISOString(),maxPages=30}={}){
 if(!/^[\w.-]+\/[\w.-]+$/.test(repository))throw Error('Invalid repository');
 const base=`https://api.github.com/repos/${repository}`,since=new Date(date(now)-90*DAY).toISOString();
 const evidence={repository,checkedAt:now,since,complete:false,metrics:null,warnings:[],sources:{repository:`https://github.com/${repository}`,commits:`${base}/commits?since=${encodeURIComponent(since)}&until=${encodeURIComponent(now)}&per_page=100`}};
 async function get(url){const r=await fetcher(url,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(r.status===403||r.status===429?'GitHub rate limit or access restriction':`GitHub request failed (${r.status})`);return {data:await r.json(),next:!!r.headers.get('link')?.includes('rel="next"')};}
 const commits=[];
 try{
  const {data:g}=await get(base);if(!g.full_name||!g.default_branch)throw Error('Repository metadata unavailable');
  Object.assign(evidence,{repository:g.full_name,branch:g.default_branch,archived:g.archived,fork:g.fork,pushedAt:g.pushed_at,openItems:g.open_issues_count});
  // Pin all pages to one branch head to avoid double counting when the branch moves.
  const {data:head}=await get(`${base}/commits?sha=${encodeURIComponent(g.default_branch)}&per_page=1`);
  if(!Array.isArray(head)||!head[0]?.sha)throw Error('No readable branch history');
  evidence.head=head[0].sha;
  evidence.sources.commits=`${base}/commits?sha=${evidence.head}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(now)}&per_page=100`;
  for(let page=1;page<=maxPages;page++){
   const {data:rows,next}=await get(`${evidence.sources.commits}&page=${page}`);if(!Array.isArray(rows)||rows.some(c=>!c.sha||!Array.isArray(c.parents)||date(c.commit?.committer?.date)===null))throw Error('Invalid commit response');
   commits.push(...rows);if(!next){evidence.complete=true;break;}
  }
  if(!evidence.complete)evidence.warnings.push('Commit history exceeded the page limit; displayed counts are lower bounds.');
 }catch(error){evidence.warnings.push(error.message);}
 if(commits.length||evidence.complete)evidence.metrics=summarizeCommits(commits,now);
 if(!evidence.complete&&evidence.metrics)evidence.warnings.push('Incomplete history; counts are lower bounds and no rating is assigned.');
 // Release and collaboration context does not affect the score, so unavailable data is never zero.
 if(evidence.head){
  try{
   evidence.sources.releases=base+'/releases?per_page=100';
   const {data:releases}=await get(evidence.sources.releases);if(!Array.isArray(releases))throw Error('Invalid release response');
   const stable=releases.filter(r=>!r.draft&&!r.prerelease&&date(r.published_at)!==null&&date(r.published_at)<=date(now)).sort((a,b)=>date(b.published_at)-date(a.published_at));
   evidence.latestRelease=stable[0]?{name:stable[0].tag_name,date:stable[0].published_at,url:stable[0].html_url}:null;evidence.releasesChecked=true;
  }catch{evidence.warnings.push('Release information unavailable.');}
  try{
   evidence.sources.pulls=base+'/pulls?state=closed&sort=updated&direction=desc&per_page=100';
   let merged=0,complete=false;
   for(let page=1;page<=10;page++){
    const {data:rows,next}=await get(`${evidence.sources.pulls}&page=${page}`);if(!Array.isArray(rows))throw Error('Invalid pull request response');
    merged+=rows.filter(r=>date(r.merged_at)!==null&&date(r.merged_at)>=date(since)&&date(r.merged_at)<=date(now)).length;
    if(!next||rows.some(r=>date(r.updated_at)<date(since))){complete=true;break;}
   }
   evidence.mergedPRs90=merged;evidence.pullsComplete=complete;
  }catch{evidence.warnings.push('Merged pull request count unavailable.');}
 }
 return evidence;
}
