// Editorial assessments, not protocol-issued metrics or security audits.
const rating=(score,reason,sources)=>({score,reason,sources,reviewed:'2026-09-11'});
export const privacyScores={
 monero:rating(9,'Mandatory sender, recipient and amount protections provide strong everyday transaction privacy. Ring-based decoys and network or user metadata still leave analysis risks.',['https://www.getmonero.org/get-started/faq/']),
 zcash:rating(8,'Shielded-to-shielded transfers conceal transaction details with zero-knowledge proofs. Transparent transfers and movement between pools make privacy dependent on the chosen path.',['https://z.cash/learn/what-is-the-difference-between-shielded-and-transparent-zcash/']),
 zano:rating(9,'Amounts, addresses and asset types are hidden by default. This is strong protocol coverage, but does not remove wallet, network or implementation risks.',['https://docs.zano.org/']),
 'pirate-chain':rating(9,'Mandatory shielded peer-to-peer transactions conceal sender, recipient and amount. Shielding does not guarantee network anonymity; cryptographic assumptions and upgrade adoption still matter.',['https://piratechain.com/']),
 zcoin:rating(8,'Spark offers sender, recipient and amount privacy without a trusted setup. Transparent paths and how coins enter or leave private use remain relevant.',['https://firo.org/pillars/private/']),
 grin:rating(6,'Mimblewimble conceals amounts and avoids conventional public addresses. Aggregation helps, but observing transaction propagation can reveal links; amount confidentiality is not complete graph privacy.',['https://docs.grin.mw/']),
 beam:rating(7,'Confidential transactions and assets offer substantial privacy. Transaction construction and use of privacy features affect linkability; application state needs separate assessment.',['https://www.beam.mw/']),
 minotari:rating(6,'Rates native base-layer XTM: default confidentiality is valuable, but Mimblewimble-style confidentiality should not be equated with complete transaction-graph concealment. This rating does not cover wrapped XTM or Ootle applications.',['https://tari.com/','https://rfc.tari.com/']),
 'zephyr-protocol':rating(8,'Monero-derived transaction protections support private reserve-asset payments. Stablecoin minting and redemption introduce a more complex transaction context; this is not a rating of collateral safety.',['https://zephyrprotocol.com/']),
 dero:rating(7,'Encrypted balances and private transfers provide meaningful confidentiality. The account-based and application-specific design needs separate scrutiny; broad project privacy claims are not treated as guarantees.',['https://docs.dero.io/']),
 pivx:rating(7,'SHIELD provides optional zero-knowledge transaction privacy. Transparent activity and the user’s choice of transfer mode limit protection across the whole network.',['https://pivx.org/']),
 decred:rating(3,'Mixing can reduce direct ownership links, but public amounts and a transparent base ledger leave considerable information available for analysis.',['https://docs.decred.org/privacy/general-privacy/']),
 dash:rating(3,'CoinJoin offers optional mixing. Public amounts, denominations and base-ledger activity remain observable; this is substantially narrower than shielded transaction privacy.',['https://docs.dash.org/en/stable/docs/user/introduction/features.html']),
 xelis:rating(5,'Homomorphic encryption protects transferred amounts and balances. This review does not establish equivalent sender/recipient unlinkability; encrypted values alone do not imply anonymity.',['https://docs.xelis.io/']),
 'neptune-cash':rating(8,'The documented zk-STARK and mutator-set design targets strong transaction privacy. This provisional assessment has limited independent validation and does not extend to similarly named tokens.',['https://neptune.cash/'])
};
privacyScores.firo=privacyScores.zcoin;
export const unrated={score:null,reason:'Insufficient verified protocol evidence for a defensible numerical rating. This is not a zero score and does not imply that the asset has no privacy.',sources:[],reviewed:null};
export const privacyRating=id=>privacyScores[id]??unrated;
