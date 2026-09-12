"""Fetch project repository evidence, with explicit repository selection and provenance."""
import json,pathlib,subprocess,concurrent.futures,datetime,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
repos={'minotari':'tari-project/tari','zcoin':'firoorg/firo','dero':'deroproject/derohe','zephyr-protocol':'ZephyrProtocol/zephyr','beam':'BeamMW/beam','pivx':'PIVX-Project/PIVX','pirate-chain':'PirateNetwork/pirate','verge':'vergecurrency/verge','ycash':'ycashfoundation/ycash','particl':'particl/particl-core','nerva':'nerva-project/nerva','xelis':'xelis-project/xelis-blockchain','bitcoinz':'btcz/bitcoinz','karbo':'karbovanets/karbowanec','ryo':'ryo-currency/ryo-currency','salvium':'salvium/salvium','stellite':'scala-network/Scala','conceal':'ConcealNetwork/conceal-core','kryptokrona':'kryptokrona/kryptokrona','hush':'MyHush/hush3','ghost-by-mcafee':'ghost-coin/ghost-core','mimblewimblecoin':'mwcproject/mwc-node','neptune-cash':'Neptune-Crypto/neptune-core','nav-coin':'navcoin/navcoin-core'}
repos['dash']='dashpay/dash'
if len(sys.argv)>1:
 repos={k:v for k,v in repos.items() if k in sys.argv[1].split(',')}
def get(url):
 p=subprocess.run(['curl','-fLsS','--max-time','15',url],capture_output=True)
 if p.returncode:raise ValueError('GitHub unavailable')
 return json.loads(p.stdout)
def work(pair):
 id,path=pair
 try:
  g=get('https://api.github.com/repos/'+path)
  if g.get('private') is not False or not g.get('full_name'):return id,None
  return id,{'url':g['html_url'],'name':g['full_name'],'owner':g['owner']['login'],'ownerUrl':g['owner']['html_url'],'description':g.get('description'),'pushedAt':g.get('pushed_at'),'license':(g.get('license') or {}).get('spdx_id'),'archived':g.get('archived'),'fork':g.get('fork'),'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'apiSource':'https://api.github.com/repos/'+path,'selection':'Project-specific repository; confirm scope using its README'}
 except:return id,None
saved=ROOT/'dist/data/repositories.json'
out=json.loads(saved.read_text()) if saved.exists() else {}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for id,g in pool.map(work,repos.items()):
  if g:out[id]=g
  print(id,'ok' if g else 'unavailable',flush=True)
(ROOT/'dist/data/repositories.json').write_text(json.dumps(out,indent=2)+'\n')
