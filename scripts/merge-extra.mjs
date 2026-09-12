import {readFileSync,writeFileSync} from 'node:fs';
const file='dist/data/snapshot.json';
const data=JSON.parse(readFileSync(file));
const extras=JSON.parse(readFileSync('/tmp/privacy-extra-markets.json'));
for(const c of extras)if(!data.coins.some(x=>x.id===c.id))data.coins.push(c);
data.scope='CoinGecko privacy-coins category plus Dash, Beam and Zephyr';
writeFileSync(file,JSON.stringify(data));
