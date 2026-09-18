const key='privacy-atlas-history-v1';
export function newestHistory(...items){
 return items.filter(h=>h&&Array.isArray(h.prices)&&h.prices.length>=2&&h.prices.every(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[1]>0)).sort((a,b)=>a.prices.at(-1)[0]-b.prices.at(-1)[0]).at(-1);
}
export function readHistoryCache(storage){
 try{const entries=JSON.parse(storage.getItem(key)??'[]');if(!Array.isArray(entries))return new Map();return new Map(entries.slice(-20).filter(e=>Array.isArray(e)&&typeof e[0]==='string'&&/^.+:(1|7|30|90|180)$/.test(e[0])&&newestHistory(e[1])));}catch{return new Map();}
}
export function saveHistoryCache(storage,cache){
 try{storage.setItem(key,JSON.stringify([...cache].slice(-20)));}catch{/* Storage can be full or disabled; in-memory and bundled fallbacks remain. */}
}
