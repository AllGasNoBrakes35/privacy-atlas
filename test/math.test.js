import test from 'node:test';import assert from 'node:assert/strict';import {scenario} from '../dist/math.js';
test('valuation preserves units and rejects invalid assumptions',()=>{assert.deepEqual(scenario(1e11,2,2e7),{cap:2e9,price:100});for(const args of [[1,101,1],[1,-1,1],[1,1,0],[Infinity,1,1]])assert.throws(()=>scenario(...args));assert.equal(scenario(1e11,0,2e7).price,0);});
