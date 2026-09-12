export const DAY=86400000;
export function dailySamples(raw,now=Date.now()) {
 const cutoff=Math.floor(now/DAY)*DAY;
 const rows=(Array.isArray(raw)?raw:[]).filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[1]>0&&p[0]<=cutoff&&p[0]%DAY===0).sort((a,b)=>a[0]-b[0]);
 return [...new Map(rows.map(p=>[p[0],p])).values()];
}
export function scenario(sector,share,supply){
 if(![sector,share,supply].every(Number.isFinite)||sector<=0||share<0||share>100||supply<=0)throw Error('Use a positive sector cap and supply, and a share between 0% and 100%.');
 const cap=sector*share/100;return {cap,price:cap/supply};
}
