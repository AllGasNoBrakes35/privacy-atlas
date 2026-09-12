// Editorial scenario assumptions, not fitted returns or measured adoption growth.
export const reviewed = '2026-09-12';
const entry=(merit,adoption,dilution,meritReason,adoptionReason)=>({merit,adoption,dilution,meritReason,adoptionReason});
export const assumptions={
 monero:entry(.08,.04,.01,'Default private cash and ongoing protocol research support a differentiated use case.','Payment utility supports the thesis; exchange access limits distribution.'),
 zcash:entry(.08,.04,.04,'Shielded payments and zero-knowledge engineering support technical differentiation.','Wallet usability may broaden use; transparent transfers do not establish shielded adoption.'),
 zano:entry(.07,.05,.04,'Confidential assets and private staking expand functionality beyond payments.','Applications offer potential demand; sustained usage and liquidity remain unverified.'),
 'pirate-chain':entry(.04,-.01,.01,'Mandatory shielded transfers provide a focused private-cash design.','Wallet integrations help accessibility, but demand and exchange depth remain uncertain.'),
 zcoin:entry(.06,.01,.05,'Spark and private-asset tooling offer technical differentiation.','Asset and swap plans require delivery and repeat users to create demand.'),
 beam:entry(.03,.01,.04,'Confidential programmability offers utility, tempered by implementation risk.','DeFi adoption requires secure applications and durable liquidity.'),
 grin:entry(.04,-.02,.10,'Minimal Mimblewimble design offers a clear technical focus.','Payment friction, funding and limited market depth constrain the adoption thesis.'),
 'zephyr-protocol':entry(.02,.02,.10,'Private stable-value transfers address a use case, with complex reserve risk.','Demand must persist through collateral stress; ZEPH is the volatile reserve asset.'),
 dero:entry(.04,.01,.05,'Private smart contracts offer differentiation with substantial implementation uncertainty.','Application utility must translate into sustained users and token demand.'),
 pivx:entry(.03,0,.08,'Optional shielded payments and governance provide practical functionality.','Wallet availability alone does not establish growing private-payment usage.'),
 decred:entry(.05,0,.04,'Stakeholder governance adds utility; mixing provides limited ledger confidentiality.','Broader demand depends on governance and payment usefulness, beyond privacy branding.'),
 dash:entry(.04,.01,.04,'Payment and application infrastructure support a practical use case.','Merchant access can help adoption, but durable demand faces competing payment networks.'),
 minotari:entry(.05,.07,.25,'Programmable privacy is a promising design thesis with delivery risk.','Ootle applications could create demand; goals are not evidence of live adoption or XTM value capture.')
};
export function projectForecast(coin,years,model=assumptions[coin.id]){
 if(!model||![1,3,5].includes(years)||![coin.current_price,coin.circulating_supply].every(x=>Number.isFinite(x)&&x>0))return null;
 const supply=coin.circulating_supply;
 // Protocol approximations for linear emission; otherwise explicit editorial dilution assumptions.
 const futureSupply=coin.id==='monero'?supply+157680*years:coin.id==='grin'?supply+31536000*years:
  coin.id==='zcash'?Math.min(Math.max(supply,21000000),supply*(1+model.dilution)**years):supply*(1+model.dilution)**years;
 const growth=model.merit+model.adoption;
 const anchorCap=coin.current_price*supply;
 const cap=anchorCap*(1+growth)**years;
 const price=cap/futureSupply;
 // Stress assumptions, not confidence intervals. Complete loss remains possible.
 const low=anchorCap*(1+growth-.35)**years/futureSupply;
 const high=anchorCap*(1+growth+.35)**years/futureSupply;
 return {years,price,low,high,cap,futureSupply,growth,anchorCap};
}
