import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initDisclosure} from '../dist/disclosure.js';
function fixture(start = async () => {}) {
  const el = () => ({hidden:false,checked:false,disabled:false,inert:false,events:{},focus(){this.focused=true;},addEventListener(n,fn){this.events[n]=fn;}});
  const ids = Object.fromEntries(['disclosureGate','siteContent','disclosureForm','disclosureCheck','disclosureContinue','disclosureError','disclosureTitle'].map(id=>[id,el()]));
  const brand=el(), reopen=el(), win=el();
  ids.siteContent.querySelector=()=>brand;
  const doc={getElementById:id=>ids[id],querySelectorAll:()=>[reopen],defaultView:win};
  initDisclosure(doc,start);
  return {...ids,brand,reopen,win,submit:()=>ids.disclosureForm.events.submit({preventDefault(){}}),accept(){ids.disclosureCheck.checked=true;ids.disclosureCheck.events.change();}};
}
test('unchecked submission cannot start the app or expose content',async()=>{
  let calls=0;const f=fixture(async()=>calls++);
  assert.equal(f.siteContent.hidden,true);assert.equal(f.siteContent.inert,true);assert.equal(f.disclosureContinue.disabled,true);
  await f.submit();assert.equal(calls,0);assert.equal(f.siteContent.hidden,true);
});
test('acceptance starts once; reopening and browser restoration require fresh acknowledgment',async()=>{
  let calls=0;const f=fixture(async()=>calls++);
  f.accept();await f.submit();assert.equal(calls,1);assert.equal(f.siteContent.hidden,false);assert.equal(f.siteContent.inert,false);assert.equal(f.brand.focused,true);
  f.reopen.events.click();assert.equal(f.disclosureCheck.checked,false);assert.equal(f.siteContent.hidden,true);
  f.accept();await f.submit();assert.equal(calls,1);
  f.win.events.pageshow();assert.equal(f.disclosureCheck.checked,false);assert.equal(f.siteContent.hidden,true);
});
test('failed startup stays gated and allows retry',async()=>{
  let calls=0;const f=fixture(async()=>{if(++calls===1)throw Error('offline');});
  f.accept();await f.submit();assert.equal(f.siteContent.hidden,true);assert.equal(f.disclosureError.hidden,false);assert.equal(f.disclosureContinue.disabled,false);
  await f.submit();assert.equal(f.siteContent.hidden,false);assert.equal(calls,2);
});
test('unchecking during startup prevents entry and concurrent submits do not start twice',async()=>{
  let resolve,calls=0;const f=fixture(()=>{calls++;return new Promise(r=>resolve=r);});
  f.accept();const pending=f.submit();await f.submit();assert.equal(calls,1);
  f.disclosureCheck.checked=false;f.disclosureCheck.events.change();resolve();await pending;
  assert.equal(f.siteContent.hidden,true);assert.equal(f.disclosureContinue.disabled,true);
});
test('initial HTML hides content and loads only the gate entry module',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.match(html,/<div id="siteContent" hidden inert>/);
  assert.match(html,/<input id="disclosureCheck"[^>]*required/);
  assert.doesNotMatch(html,/<input id="disclosureCheck"[^>]*\schecked(?:[\s>])/);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]),['entry.js']);
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    if(/^(?:https?:|data:|\.\/)/.test(m[1]))continue;
    assert.doesNotThrow(()=>readFileSync(new URL('../dist/'+m[1],import.meta.url)));
  }
});
