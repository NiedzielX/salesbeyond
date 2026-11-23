import assert from 'node:assert/strict';
import test from 'node:test';
import {serviceBackedSection} from './inventorySource.ts';

test('section source follows the retained service snapshot, not refresh transfer state',()=>{
 const empty={bySection:{}};
 const retained={bySection:{'II-2':[]}};
 assert.equal(serviceBackedSection(empty,'II-2'),false);
 assert.equal(serviceBackedSection(retained,'II-2'),true);
 assert.equal(serviceBackedSection(retained,'II-3'),false);
 assert.equal(serviceBackedSection(retained,null),false);
});
