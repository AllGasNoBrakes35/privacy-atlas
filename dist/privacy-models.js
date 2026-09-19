import {profiles} from './profiles.js';
import {privacyRating} from './privacy-scores.js';
const model=(mode,reason,sources,basis)=>({mode,reason,sources,basis,reviewed:'2026-09-19'});
// Model labels describe where protection applies, not its strength or an audit result.
export const modelEvidence={
 bitcoinz:model('Optional','The core README provides separate commands for transparent and private addresses. This supports an optional model; it does not verify which path a particular wallet uses or the anonymity of pool transitions.',['https://github.com/btcz/bitcoinz/blob/master/README.md'],'Wallet command examples'),
 spectrecoin:model('Optional','Alias wallet instructions distinguish public and private balances, addresses and send modes. Private transfers require the private path. This is a documented wallet model, not a fresh audit of its implementation.',['https://alias.cash/wallets/','https://github.com/aliascash/alias-wallet'],'Wallet walkthrough and core repository'),
 mimblewimblecoin:model('Default','The MWC node documentation describes hidden amounts through base-layer Mimblewimble. Default refers to native amount confidentiality, not complete concealment of transaction links or network metadata.',['https://github.com/mwcproject/mwc-node'],'Core repository documentation'),
 salvium:model('Default','The core repository explicitly describes native transfers as private by default. Refund and disclosure features add separate considerations; this label does not certify future contracts, audits or application privacy.',['https://github.com/salvium/salvium','https://docs.salvium.io/'],'Core repository documentation'),
 stellite:model('Default','Scala’s repository describes transfers as private by default. This is a provisional classification of the documented model. Inherited historical upgrade tables are not treated as proof of current network parameters or feature parity with Monero.',['https://github.com/scala-network/Scala'],'Core repository documentation · provisional'),
 xelis:model('Default','Developer documentation states that balances and transferred asset values are encrypted. Default here describes value confidentiality; it does not establish sender/recipient unlinkability or private application state.',['https://docs.xelis.io/features/privacy/homomorphic-encryption'],'Developer cryptography documentation'),
 nockchain:model('Planned','The published roadmap places a privacy-pool application in Q2 2027 and explicitly distinguishes it from L1 transaction privacy. This describes planned application protection, not currently verified confidential native transfers.',['https://www.nockchain.org/roadmap'],'Dated roadmap · not live protection'),
 'neptune-cash':model('Default','The project describes zk-STARKs and mutator sets integrated at layer one. This provisional label refers to that native protocol design, not an independent audit, and does not apply to the separately listed Neptune Privacy token.',['https://neptune.cash/','https://github.com/Neptune-Crypto/neptune-core'],'Protocol description and core repository · provisional')
};
export function privacyModel(id){
 if(modelEvidence[id])return modelEvidence[id];
 const rating=privacyRating(id),p=profiles[id];
 if(rating.mode)return {mode:rating.mode,reason:rating.reason,sources:rating.sources,reviewed:rating.reviewed,basis:'Previously reviewed project documentation'};
 if(p)return {mode:p.mode,reason:p.protocol,sources:p.sources,reviewed:p.reviewed,basis:'Project documentation'};
 return {mode:'Unreviewed',reason:'The exact asset’s current privacy model is unresolved. A related codebase, token name or category is not sufficient evidence.',sources:[],reviewed:null,basis:'Evidence pending'};
}
