import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
class Element{
 constructor(){this.children=[];this.textContent='';this.disabled=false;}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=[...items];}
 setAttribute(key,value){this[key]=value;}
}
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
globalThis.document={getElementById(id){assert.ok(elements.has(id),`Missing HTML element: ${id}`);return elements.get(id);},createElement:()=>new Element(),createTextNode:text=>({textContent:text}),dispatchEvent(){}};
const checkedAt=new Date().toISOString(),e={complete:true,checkedAt,since:checkedAt,repository:'test/first',branch:'main',warnings:[],metrics:{authors90:5,commits90:75,commits30:20,activeWeeks:10,lastCommitAt:checkedAt,unidentified:0,botCommits:2,mergeCommits:10}};
globalThis.fetch=async()=>({ok:true,json:async()=>({first:e,second:{...e,repository:'test/second'}})});
const {renderDevelopment,refreshDevelopment,developmentRating}=await import('../dist/development-ui.js');
const first={id:'first'},second={id:'second'},g=id=>({name:'test/'+id,url:'https://github.com/test/'+id});
test('renders actual HTML targets; unknown projects stay unrated',()=>{
 renderDevelopment(first,g('first'));assert.match(elements.get('developmentScore').textContent,/\/ 10/);assert.equal(elements.get('developmentMetrics').children.length,4);
 renderDevelopment({id:'unknown'},null);assert.equal(elements.get('developmentScore').textContent,'N/A');assert.equal(elements.get('developmentRefresh').disabled,true);assert.match(elements.get('developmentReason').textContent,/does not mean inactive/);
});
test('failed refresh preserves complete evidence and cannot replace another selected project',async()=>{
 let release;globalThis.fetch=()=>new Promise(resolve=>{release=resolve;});
 renderDevelopment(first,g('first'));const before=developmentRating('first').score;
 const request=refreshDevelopment(first,g('first'));assert.equal(elements.get('developmentRefresh').disabled,true);
 renderDevelopment(second,g('second'));release({ok:false,status:429});await request;
 assert.equal(elements.get('developmentScope').children[0].textContent,'test/second');assert.equal(elements.get('developmentRefresh').disabled,false);
 renderDevelopment(first,g('first'));assert.equal(developmentRating('first').score,before);assert.match(elements.get('developmentStatus').textContent,/last complete observation/);
});
