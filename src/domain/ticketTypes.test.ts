import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eventCatalog, ticketPriceMinor} from '../data/event.ts';
import {stadiumSeats} from '../data/stadium.ts';
import {normalizeTicketTypeAssignments,selectionPolicyIssue,ticketSelectionItems} from './ticketTypes.ts';

const seat = stadiumSeats().find(candidate => candidate.available)!;

test('eventy mają odseparowane polityki i całkowitoliczbowe cenniki typów demo', () => {
  const [eventA,eventB] = eventCatalog;
  assert.deepEqual(eventA.selectionPolicy,{minSeats:1,maxSeats:10});
  assert.deepEqual(eventB.selectionPolicy,{minSeats:2,maxSeats:6});
  assert.deepEqual(eventA.ticketTypes.map(({id})=>id),['standard','reduced','child']);
  assert.equal(ticketPriceMinor(eventA,seat,'standard')-ticketPriceMinor(eventA,seat,'child'),2000);
  assert.equal(ticketPriceMinor(eventB,seat,'standard')-ticketPriceMinor(eventB,seat,'child'),3000);
  assert.ok(Number.isSafeInteger(ticketPriceMinor(eventB,seat,'reduced')));
});

test('przypisania obejmują tylko fotele w koszyku i dozwolone typy wydarzenia', () => {
  const event=eventCatalog[0],seats=stadiumSeats().filter(candidate=>candidate.available).slice(0,2);
  const normalized=normalizeTicketTypeAssignments(event,seats,{[seats[0].id]:'child',[seats[1].id]:'foreign',other:'reduced'});
  assert.deepEqual(normalized,{[seats[0].id]:'child',[seats[1].id]:'standard'});
  assert.deepEqual(ticketSelectionItems(event,seats,normalized),[
    {seatId:seats[0].id,ticketTypeId:'child'},
    {seatId:seats[1].id,ticketTypeId:'standard'},
  ]);
});

test('minimum nie blokuje pustego wyboru, ale blokuje niepełny koszyk',()=>{
  const event=eventCatalog[1];
  assert.equal(selectionPolicyIssue(event,0),null);
  assert.equal(selectionPolicyIssue(event,1),'below_minimum');
  assert.equal(selectionPolicyIssue(event,2),null);
  assert.equal(selectionPolicyIssue(event,7),'seat_limit');
});
