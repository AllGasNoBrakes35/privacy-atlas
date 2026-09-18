export function nearestSample(rows,time){
 let low=0,high=rows.length-1;
 while(low<high){const mid=Math.floor((low+high)/2);if(rows[mid][0]<time)low=mid+1;else high=mid;}
 return low>0&&time-rows[low-1][0]<=rows[low][0]-time?low-1:low;
}
export function drawPriceChart(svg,readout,rows,name,currency,loading=false){
 const ns='http://www.w3.org/2000/svg';
 const element=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
 const price=v=>currency==='USD'?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:v<1?8:v<100?4:2}).format(v):`${new Intl.NumberFormat('en-US',{maximumSignificantDigits:7}).format(v)} ${currency}`;
 const stamp=t=>new Date(t).toLocaleString(undefined,{timeZone:'UTC',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})+' UTC';
 svg.replaceChildren();svg.onpointermove=svg.onpointerdown=svg.onpointerleave=svg.onkeydown=svg.onfocus=svg.onblur=null;
 svg.setAttribute('aria-label',`${name} ${currency} price history. Use left and right arrow keys to inspect recorded prices.`);
 readout.textContent=loading?'Loading chart…':'Hover or touch the chart to see a recorded price.';
 if(rows.length<2){svg.append(element('text',{x:20,y:105,fill:'#97a7b6','font-size':16},loading?'Loading price history…':'No chart data for this range'));return;}
 const left=14,right=626,top=28,bottom=166,min=Math.min(...rows.map(p=>p[1])),max=Math.max(...rows.map(p=>p[1])),span=max-min||Math.max(max*.01,1e-9),start=rows[0][0],end=rows.at(-1)[0];
 const x=t=>left+(t-start)/(end-start)*(right-left),y=v=>bottom-(v-min)/span*(bottom-top);
 for(const [v,ty]of [[max,18],[min,187]])svg.append(element('text',{x:left,y:ty,fill:'#97a7b6','font-size':14},price(v)));
 svg.append(element('path',{d:rows.map(([t,v],i)=>`${i?'L':'M'}${x(t)},${y(v)}`).join(' '),fill:'none',stroke:'#67e5c2','stroke-width':2.5,'vector-effect':'non-scaling-stroke'}));
 const date=t=>new Date(t).toLocaleString(undefined,{timeZone:'UTC',month:'short',day:'numeric',...(end-start>=180*86400000?{year:'numeric'}:{}),...(end-start<2*86400000?{hour:'2-digit',minute:'2-digit'}:{})});
 svg.append(element('text',{x:left,y:217,fill:'#97a7b6','font-size':14},date(start)),element('text',{x:right,y:217,fill:'#97a7b6','font-size':14,'text-anchor':'end'},date(end)));
 const line=element('line',{x1:0,x2:0,y1:top,y2:bottom,stroke:'#97a7b6','stroke-dasharray':'4 4',visibility:'hidden'}),dot=element('circle',{cx:0,cy:0,r:4,fill:'#67e5c2',stroke:'#0a121b','stroke-width':2,visibility:'hidden'});svg.append(line,dot);
 let index=rows.length-1;
 const show=i=>{index=Math.max(0,Math.min(rows.length-1,i));const [t,v]=rows[index];line.setAttribute('x1',x(t));line.setAttribute('x2',x(t));dot.setAttribute('cx',x(t));dot.setAttribute('cy',y(v));line.setAttribute('visibility','visible');dot.setAttribute('visibility','visible');readout.textContent=`${stamp(t)} · ${price(v)}`;};
 const pointer=e=>{const matrix=svg.getScreenCTM();if(!matrix)return;const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const px=point.matrixTransform(matrix.inverse()).x;show(nearestSample(rows,start+Math.max(0,Math.min(1,(px-left)/(right-left)))*(end-start)));};
 svg.onpointermove=pointer;svg.onpointerdown=pointer;svg.onfocus=()=>show(index);
 svg.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();show(e.key==='Home'?0:e.key==='End'?rows.length-1:index+(e.key==='ArrowLeft'?-1:1));}};
 svg.onpointerleave=()=>{if(document.activeElement!==svg){line.setAttribute('visibility','hidden');dot.setAttribute('visibility','hidden');}};
}
