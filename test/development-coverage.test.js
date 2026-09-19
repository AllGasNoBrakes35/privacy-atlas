import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
class Element{
 constructor(){this.children=[];this.textContent='';this.hidden=false;}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=[...items];this.textContent='';}
 setAttribute(key,value){this[key]=value;}
}
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
globalThis.document={getElementById(id){assert.ok(elements.has(id),`Missing HTML target ${id}`);return elements.get(id);},createElement:()=>new Element(),createTextNode:text=>({textContent:text}),dispatchEvent(){}};
globalThis.fetch=async url=>{if(url.startsWith('https:'))return {ok:false,status:429};return {ok:true,json:async()=>JSON.parse(readFileSync(new URL('../dist/'+url,import.meta.url),'utf8'))};};
const {renderDevelopment}=await import('../dist/development-ui.js');
const {renderProject,projectData}=await import('../dist/project-info.js');
const {profiles,unknown}=await import('../dist/profiles.js');
const coins=JSON.parse(readFileSync(new URL('../dist/data/snapshot.json',import.meta.url))).coins;
const evidence=JSON.parse(readFileSync(new URL('../dist/data/development.json',import.meta.url)));
test('every covered cryptocurrency renders its own visible development section',()=>{
 for(const coin of coins){
  const section=elements.get('developmentSection');section.hidden=true;
  renderDevelopment(coin,projectData.projects[coin.id]?.github);
  renderProject(coin,profiles[coin.id]??unknown);
  assert.equal(section.hidden,false,coin.id);
  assert.equal(elements.get('developmentTitle').textContent,`${coin.name} · Development activity`);
  assert.equal(elements.get('developmentMetrics').children.length,4,coin.id);
  assert.ok(elements.get('developmentScore').textContent,coin.id);
  if(!evidence[coin.id]){assert.equal(elements.get('developmentScore').textContent,'N/A',coin.id);assert.ok(elements.get('developmentMetrics').children.every(e=>e.children[1].textContent==='Unavailable'),coin.id);}
 }
 console.log(`Checked ${coins.length} cryptocurrencies, including ${coins.filter(c=>!evidence[c.id]).length} without saved repository evidence.`);
});
test('a newly listed asset without metadata still gets the development section',()=>{
 const c={id:'new-unreviewed-asset',name:'New asset',symbol:'new'};renderDevelopment(c,undefined);renderProject(c,unknown);
 assert.equal(elements.get('developmentSection').hidden,false);
 assert.equal(elements.get('developmentTitle').textContent,'New asset · Development activity');
 assert.equal(elements.get('developmentScore').textContent,'N/A');
 assert.match(elements.get('developmentReason').textContent,/does not mean inactive/);
});
