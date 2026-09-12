"""Download vendor-matched logo assets unchanged, preserving PNG/JPEG/WebP formats."""
import json,pathlib,subprocess,concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parents[1]
coins=json.loads((ROOT/'dist/data/snapshot.json').read_text())['coins']
def work(c):
 url=c.get('image','')
 if not url.startswith('https://coin-images.coingecko.com/'):return c['id'],None
 p=subprocess.run(['curl','-fLsS','--max-time','20',url],capture_output=True)
 if p.returncode:return c['id'],None
 b=p.stdout
 ext='png' if b.startswith(b'\x89PNG\r\n\x1a\n') else 'jpg' if b.startswith(b'\xff\xd8\xff') else 'webp' if b[:4]==b'RIFF' and b[8:12]==b'WEBP' else None
 if not ext:return c['id'],None
 path=f'logos/{c["id"]}.{ext}';(ROOT/'dist'/path).write_bytes(b)
 return c['id'],{'path':path,'source':url}
out={}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for id,data in pool.map(work,coins):
  if data:out[id]=data
(ROOT/'dist/data/logos.json').write_text(json.dumps(out,indent=2)+'\n')
print('Logos:',len(out))
