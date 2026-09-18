import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestSample,drawPriceChart} from '../dist/chart.js';
class Element{
 constructor(){this.attrs={};this.children=[];this.textContent='';}
 setAttribute(k,v){this.attrs[k]=String(v);}
 append(...els){this.children.push(...els);}
 replaceChildren(){this.children=[];}
 getScreenCTM(){return {inverse(){return {}}};}
 createSVGPoint(){return {x:0,y:0,matrixTransform(){return this;}};}
}
test('nearest sample follows timestamps including uneven intervals',()=>{
 const rows=[[100,1],[110,2],[1000,3]];
 assert.equal(nearestSample(rows,50),0);assert.equal(nearestSample(rows,111),1);assert.equal(nearestSample(rows,900),2);assert.equal(nearestSample(rows,2000),2);
});
test('hover, touch and keyboard expose the selected price and timestamp',()=>{
 globalThis.document={createElementNS:()=>new Element(),activeElement:null};
 const svg=new Element(),readout=new Element(),rows=[[Date.UTC(2026,8,17,12),1],[Date.UTC(2026,8,17,13),2],[Date.UTC(2026,8,18,12),3]];
 drawPriceChart(svg,readout,rows,'Example','USD');
 svg.onpointermove({clientX:14,clientY:60});assert.match(readout.textContent,/\$1\.00/);assert.match(readout.textContent,/UTC/);
 svg.onpointerdown({clientX:626,clientY:60});assert.match(readout.textContent,/\$3\.00/);
 let prevented=false;svg.onkeydown({key:'ArrowLeft',preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.match(readout.textContent,/\$2\.00/);
 svg.onkeydown({key:'Home',preventDefault(){}});assert.match(readout.textContent,/\$1\.00/);
 drawPriceChart(svg,readout,rows,'Example','USDT');svg.onfocus();assert.match(readout.textContent,/3 USDT/);assert.ok(!readout.textContent.includes('$'));
 drawPriceChart(svg,readout,[],'Example','USD',true);assert.equal(svg.onpointermove,null);assert.match(readout.textContent,/Loading/);
});
