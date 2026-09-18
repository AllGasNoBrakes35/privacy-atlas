import {readFile,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {collectActivity} from '../dist/development.js';
const run=promisify(execFile),root=new URL('../',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL('dist/data/'+name+'.json',root),'utf8'));
const projects=(await read('projects')).projects,repos=await read('repositories');
const entries=Object.entries({...projects,...repos}).map(([id])=>[id,repos[id]?.name??projects[id]?.github?.name]).filter(([,repo])=>repo);
const output=await read('development').catch(()=>({}));
async function fetcher(url){
 const {stdout}=await run('curl',['-sS','-L','--max-time','25','-D','-','-H','Accept: application/vnd.github+json',url],{maxBuffer:15*1024*1024});
 const boundary=stdout.lastIndexOf('\r\n\r\n'),header=stdout.slice(0,boundary),body=stdout.slice(boundary+4);
 const status=Number([...header.matchAll(/HTTP\/[\d.]+ (\d+)/g)].at(-1)?.[1]);
 return {ok:status>=200&&status<300,status,headers:{get(name){return [...header.matchAll(new RegExp('^'+name+': (.+)$','gim'))].at(-1)?.[1]?.trim();}},json:async()=>JSON.parse(body)};
}
const queue=[...entries];
await Promise.all(Array.from({length:3},async()=>{while(queue.length){const [id,repo]=queue.shift();const e=await collectActivity(repo,{fetcher});if(e.complete||!output[id]?.complete)output[id]=e;console.log(id,e.complete?'complete':'unavailable',e.metrics?.commits90??'—');}}));

await writeFile(new URL('dist/data/development.json',root),JSON.stringify(output,null,2)+'\n');
