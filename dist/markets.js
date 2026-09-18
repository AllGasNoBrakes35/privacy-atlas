export function mergeMarketCoins(existing,updates){
 const byId=new Map(existing.map(c=>[c.id,c]));
 for(const c of updates){
  if(!c||typeof c.id!=='string'||!c.id||typeof c.name!=='string'||typeof c.symbol!=='string'||!Number.isFinite(c.current_price)||c.current_price<=0)continue;
  const prior=byId.get(c.id),time=Date.parse(c.last_updated),oldTime=Date.parse(prior?.last_updated);
  if(!Number.isFinite(time)||Number.isFinite(oldTime)&&time<oldTime)continue;
  byId.set(c.id,c);
 }
 return [...byId.values()];
}
