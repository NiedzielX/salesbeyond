import assert from 'node:assert/strict';
import test from 'node:test';
import {terminalHoldAnnouncement} from './liveHoldAnnouncement.ts';

test('announces terminal hold outcomes without announcing the active countdown',()=>{
 assert.equal(terminalHoldAnnouncement('active'),'');
 assert.equal(terminalHoldAnnouncement('released'),'Blokada została zwolniona. Miejsca można wybrać ponownie.');
 assert.equal(terminalHoldAnnouncement('expired'),'Termin blokady minął. Sprawdź dostępność miejsc ponownie.');
});
