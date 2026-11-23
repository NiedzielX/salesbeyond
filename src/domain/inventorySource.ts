import type {InventoryOverlayState} from './inventoryOverlay';

/** Provenance follows an accepted section snapshot, independently of a later refresh state. */
export function serviceBackedSection(snapshot:Pick<InventoryOverlayState,'bySection'>,sectionId:string|null){
 return sectionId!==null&&Object.prototype.hasOwnProperty.call(snapshot.bySection,sectionId);
}
