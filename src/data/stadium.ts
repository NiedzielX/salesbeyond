export type SectorId = '101' | '102' | '103';
export type Seat = { id: string; sectorId: SectorId; standId: string; row: number; number: number; price: number; available: boolean; position: [number, number, number] };
export const sectors = [
  { id: '101' as const, name: 'Bliżej bramki', description: 'Szeroka perspektywa na całe boisko', price: 65, center: -36 },
  { id: '102' as const, name: 'Na linii środka', description: 'W samym sercu piłkarskich emocji', price: 85, center: 0 },
  { id: '103' as const, name: 'Druga perspektywa', description: 'Obserwuj akcję z nowej strony', price: 65, center: 36 },
];
export const layout = { rowRise: .82, rowDepth: 1.28, firstStepY: 1.1, stepHeight: .8, seatThickness: .24, get firstSeatY(){ return this.firstStepY + this.stepHeight/2 + this.seatThickness/2; }, firstRowZ: 43, seatSpacing: 1.75 };
export const rows = 12;
export const seatsPerRow = 18;
export function getSeat(sectorId: SectorId, row: number, number: number): Seat {
  const sector = sectors.find(s => s.id === sectorId);
  if (!sector || !Number.isInteger(row) || row < 1 || row > rows || !Number.isInteger(number) || number < 1 || number > seatsPerRow) throw new RangeError('Nieprawidłowe miejsce');
  return {id:`${sectorId}-${row}-${number}`, sectorId, standId:'Trybuna północna', row, number, price:sector.price + (row > 7 ? 10 : 0), available: (row * 7 + number * 3 + Number(sectorId)) % 13 > 2, position:[sector.center + (number-9.5)*layout.seatSpacing, layout.firstSeatY + (row-1)*layout.rowRise, layout.firstRowZ + (row-1)*layout.rowDepth]};
}
export function sectorSeats(id: SectorId) { return Array.from({length:rows*seatsPerRow},(_,i)=>getSeat(id,Math.floor(i/seatsPerRow)+1,i%seatsPerRow+1)); }
