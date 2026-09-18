const key='privacy-atlas-history-v1';
export function newestHistory(...items){
 return items.filter(h=>h&&Array.isArray(h.prices)&&h.prices.length>=2&&h.prices.every(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[1]>0)).sort((a,b)=>a.prices.at(-1)[0]-b.prices.at(-1)[0]).at(-1);
}
export function readHistoryCache(storage){
 try{const entries=JSON.parse(storage.getItem(key)??'[]');if(!Array.isArray(entries))return new Map();return new Map(entries.slice(-20).filter(e=>Array.isArray(e)&&typeof e[0]==='string'&&/^.+:(1|7|30|90|180|365|max)$/.test(e[0])&&newestHistory(e[1])));}catch{return new Map();}
}
export function saveHistoryCache(storage,cache){
 try{storage.setItem(key,JSON.stringify([...cache].slice(-20)));}catch{/* Storage can be full or disabled; in-memory and bundled fallbacks remain. */}
}

// Retain older verified samples when a provider's rolling window advances.
export function availableHistory(...items){
 const latest=newestHistory(...items);if(!latest)return undefined;
 const compatible=items.filter(h=>h&&h.source===latest.source&&h.currency===latest.currency&&Array.isArray(h.prices));
 const prices=[...new Map(compatible.flatMap(h=>h.prices).concat(latest.prices).filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[1]>0).map(p=>[p[0],p])).values()].sort((a,b)=>a[0]-b[0]);
 return {...latest,prices,description:prices[0][0]<latest.prices[0][0]?'Available source history including saved older samples; earlier prices may be unavailable':latest.description};
}
