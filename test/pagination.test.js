import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {pageCapacity} from '../dist/pagination.js';
import {rolesFor} from '../dist/ecosystem.js';
import {profiles,unknown} from '../dist/profiles.js';
test('all viewport sizes retain fixed groups of 25',()=>{
 for(const height of [0,NaN,320,500,600,720,768,800,900,1000,1440])assert.equal(pageCapacity(height),25);
});
test('actual market renderer exposes every asset through reachable page controls',()=>{
 const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 class El{constructor(text){this.children=[];this.dataset={};this.classList={add(){}};this.value='';this.textContent=text??'';}append(...c){this.children.push(...c)}replaceChildren(){this.children=[]}setAttribute(){}}
 const targets=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new El()]));targets.sort.value='name';
 const coins=JSON.parse(fs.readFileSync(new URL('../dist/data/snapshot.json',import.meta.url))).coins;
 const ctx=vm.createContext({data:{coins},selected:null,mode:'Saved',page:0,pageSize:pageCapacity(720),$:id=>targets[id],node:(tag,text)=>new El(text),logo:()=>new El(),tag:()=>new El(),sum:()=>1,compact:String,when:String,usd:String,percent:String,valid:Number.isFinite,rolesFor,profile:c=>profiles[c.id]??unknown,privacyRating:()=>({score:null}),developmentRating:()=>({score:null,label:'N/A'}),applyMetric(){},renderDetail(){},Date});
 vm.runInContext(source.slice(source.indexOf('function render(){'),source.indexOf('function select(')),ctx);
 const names=[];
 for(let page=0;page<Math.ceil(coins.length/ctx.pageSize);page++){
  ctx.page=page;ctx.render();
  assert.equal(targets.previousPage.disabled,page===0);
  for(const row of targets.rows.children){assert.equal(row.children.length,9);names.push(row.children[0].children[0].children[1].children[0].textContent);}
 }
 assert.equal(names.length,coins.length);assert.equal(new Set(names).size,coins.length);
 assert.equal(targets.nextPage.disabled,true);
 assert.deepEqual(targets.rangePages.children.map(b=>b.textContent),['1–25','26–50','51–75']);
 targets.rangePages.children[1].onclick();assert.equal(ctx.page,1);assert.equal(targets.rows.children.length,25);
 targets.search.value='zcash';ctx.render();assert.equal(ctx.page,0);assert.equal(targets.rows.children.length,1);
 targets.search.value='';ctx.render();assert.equal(targets.rows.children.length,25);assert.equal(targets.nextPage.disabled,false);
});
