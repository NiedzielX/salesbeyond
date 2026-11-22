import assert from 'node:assert/strict';
import test from 'node:test';
import {seatGridTarget} from './seatGridNavigation.ts';

test('seat grid arrows and endpoints stay within the visible row',()=>{
 assert.equal(seatGridTarget(5,2,'ArrowLeft'),1);
 assert.equal(seatGridTarget(5,2,'ArrowRight'),3);
 assert.equal(seatGridTarget(5,0,'ArrowLeft'),0);
 assert.equal(seatGridTarget(5,4,'ArrowRight'),4);
 assert.equal(seatGridTarget(5,3,'Home'),0);
 assert.equal(seatGridTarget(5,1,'End'),4);
});

test('seat grid ignores unrelated keys and invalid coordinates',()=>{
 assert.equal(seatGridTarget(5,2,'Enter'),null);
 assert.equal(seatGridTarget(0,0,'ArrowRight'),null);
 assert.equal(seatGridTarget(5,-1,'ArrowRight'),null);
 assert.equal(seatGridTarget(5,5,'ArrowLeft'),null);
});
