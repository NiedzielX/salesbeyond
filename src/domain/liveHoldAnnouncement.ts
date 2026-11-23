import type {HoldStatus} from '../integrations/seatHoldClient';

export function terminalHoldAnnouncement(status:HoldStatus){
 if(status==='released')return 'Blokada została zwolniona. Miejsca można wybrać ponownie.';
 if(status==='expired')return 'Termin blokady minął. Sprawdź dostępność miejsc ponownie.';
 return '';
}
