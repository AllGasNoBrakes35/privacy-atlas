import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {profiles,unknown} from '../dist/profiles.js';
import {privacyRating} from '../dist/privacy-scores.js';

const root=new URL('../',import.meta.url);
const file=p=>new URL(p,root);
const existing=await readFile(file('contracts/artifacts/deployment.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
if(existing?.componentAddress)throw Error('This edition is deployed. Preserve its artifacts; prepare a new edition in a separate directory.');
const hash=b=>createHash('sha256').update(b).digest('hex');
const market=JSON.parse(await readFile(file('dist/data/snapshot.json'),'utf8'));
const wasm=await readFile(file('contracts/target/wasm32-unknown-unknown/release/privacy_atlas_snapshot.wasm'));
if(wasm.length>1572864)throw Error('Template exceeds the documented 1.5 MiB limit');
const snapshot={
 schema:'privacy-atlas-research-v1',marketSnapshotFetchedAt:market.fetchedAt,
 limitations:'Editorial research, not investment advice or guaranteed results. The on-chain commitment establishes data integrity only. Refreshed browser quotes are not part of this saved edition.',
 sourceFileHashes:Object.fromEntries(await Promise.all(['dist/profiles.js','dist/privacy-scores.js','dist/data/snapshot.json'].map(async p=>[p,hash(await readFile(file(p)))]))),
 assets:market.coins.map(c=>({id:c.id,name:c.name,symbol:c.symbol,quoteTime:c.last_updated,price:c.current_price,circulatingSupply:c.circulating_supply,profile:profiles[c.id]??unknown,privacy:privacyRating(c.id)}))
};
const bytes=Buffer.from(JSON.stringify(snapshot,null,2)+'\n');
await mkdir(file('contracts/artifacts/'),{recursive:true});
await writeFile(file('contracts/artifacts/research-snapshot.json'),bytes);
await copyFile(file('contracts/target/wasm32-unknown-unknown/release/privacy_atlas_snapshot.wasm'),file('contracts/artifacts/privacy_atlas_snapshot.wasm'));
const sha256=hash(bytes);
const record={status:'prepared-not-deployed',network:'esmeralda',walletVersionChecked:'0.40.0',templateLibraryVersion:'0.31.1',templateAddress:null,componentAddress:null,transactionId:null,wasmSha256:hash(wasm),wasmBytes:wasm.length,researchSha256:sha256,constructor:{function:'new',arguments:[sha256,'https://raw.githubusercontent.com/johnnysessa/privacy-atlas/main/contracts/artifacts/research-snapshot.json']}};
await writeFile(file('contracts/artifacts/deployment.json'),JSON.stringify(record,null,2)+'\n');
await writeFile(file('contracts/artifacts/SHA256SUMS'),`${hash(wasm)}  privacy_atlas_snapshot.wasm\n${sha256}  research-snapshot.json\n`);
console.log(`Prepared ${wasm.length}-byte template and ${snapshot.assets.length}-asset research snapshot. NOT deployed.`);
