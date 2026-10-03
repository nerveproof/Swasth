export type SystemId = 'skeletal'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac';
export const SYSTEMS: {id:SystemId;name:string;color:string;description:string}[] = [
 {id:'skeletal',name:'Skeleton',color:'#e2d9ba',description:'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.'},
 {id:'muscular',name:'Muscles',color:'#a85b50',description:'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.'},
 {id:'cardiac',name:'Heart',color:'#b96760',description:'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.'},
 {id:'sensory',name:'Sensory organs',color:'#b0c8ce',description:'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.'},
 {id:'arterial',name:'Arteries',color:'#c05245',description:'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.'},
 {id:'venous',name:'Veins',color:'#527c9f',description:'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.'},
 {id:'nervous',name:'Nervous system',color:'#d8b565',description:'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.'},
 {id:'respiratory',name:'Respiratory',color:'#b98991',description:'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.'},
 {id:'digestive',name:'Digestive',color:'#b8916b',description:'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.'},
 {id:'urinary',name:'Urinary',color:'#b47961',description:'The kidneys filter blood and regulate fluid, electrolyte, and acid–base balance. Urine travels through the ureters to the bladder and exits through the urethra.'},
 {id:'lymphatic',name:'Lymphatic',color:'#879f7c',description:'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.'},
 {id:'endocrine',name:'Endocrine',color:'#c5a09a',description:'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.'},
 // Commented out to hide male genital/reproductive structures:
 // {id:'reproductive',name:'Reproductive',color:'#bda098',description:'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.'},
 {id:'integumentary',name:'Body surface',color:'#ba9b7d',description:'The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.'},
 {id:'connective',name:'Connective tissue',color:'#aec3bb',description:'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.'},
];
export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'three-quarter'|'front'|'back'|'side';

export type NervousSide='left'|'right'|'both';
export type NervousSelection={kind:'ganglion'|'branch'|'zone';id:string;side?:'left'|'right'};
export interface NervousLayers {cnv:boolean;v1:boolean;v2:boolean;v3Jaw:boolean;v3Temple:boolean}
export const DEFAULT_NERVOUS_LAYERS:NervousLayers={cnv:true,v1:true,v2:true,v3Jaw:true,v3Temple:true};
// Commented out original default 'left' to keep 'both' as default across all systems:
// export const DEFAULT_NERVOUS_SIDE:NervousSide='left';
export const DEFAULT_NERVOUS_SIDE:NervousSide='both';

export type SoftTissueId='smas'|'fat'|'temporal'|'zygomatic'|'buccal'|'marginal'|'cervical'|'parotid'|'lymph'|'periosteum';
export type FacialNerveId='temporal'|'zygomatic'|'buccal'|'marginal'|'cervical';
export type SmasSelection={kind:SoftTissueId;id:string;side?:'left'|'right'};
export interface SmasLayers {smas:boolean;fat:boolean;temporal:boolean;zygomatic:boolean;buccal:boolean;marginal:boolean;cervical:boolean;parotid:boolean;lymph:boolean;periosteum:boolean}
export const DEFAULT_SMAS_LAYERS:SmasLayers={smas:true,fat:true,temporal:true,zygomatic:true,buccal:true,marginal:true,cervical:true,parotid:true,lymph:true,periosteum:true};

export type FaceMuscleId='masseter'|'temporalis'|'buccinator'|'orbicularis'|'zygomaticus'|'pterygoids';
export interface FaceMuscleLayers {masseter:boolean;temporalis:boolean;buccinator:boolean;orbicularis:boolean;zygomaticus:boolean;pterygoids:boolean}
export const DEFAULT_FACE_MUSCLE_LAYERS:FaceMuscleLayers={masseter:true,temporalis:true,buccinator:true,orbicularis:true,zygomaticus:true,pterygoids:true};
export const FACE_MUSCLE_ROWS:{id:FaceMuscleId;label:string;sub:string;color:string;description:string}[]=[
 {id:'masseter',label:'Masseter',sub:'jaw elevation',color:'#b56b60',description:'Powerful muscle of mastication connecting the zygomatic arch to the angle and ramus of the mandible. Elevates the jaw to close the mouth.'},
 {id:'temporalis',label:'Temporalis',sub:'temple to mandible',color:'#a85b50',description:'Broad fan-shaped muscle in the temporal fossa extending to the coronoid process of the mandible. Elevates and retracts the jaw.'},
 {id:'buccinator',label:'Buccinator',sub:'cheek wall',color:'#c27165',description:'Forms the muscular wall of the cheek. Compresses the cheek against teeth during chewing and aids blowing.'},
 {id:'orbicularis',label:'Orbicularis',sub:'eye & mouth sphincters',color:'#bf6a64',description:'Circular sphincter muscles around the eye orbit (oculi) and lips (oris) that close the eyelids and purse the mouth.'},
 {id:'zygomaticus',label:'Zygomaticus',sub:'cheek to mouth corner',color:'#cb7c72',description:'Major and minor muscles extending from the zygomatic bone to the corner of the mouth, elevating the angle of the mouth during smiling.'},
 {id:'pterygoids',label:'Pterygoids',sub:'deep jaw & grinding',color:'#a35248',description:'Deep masticatory muscles on the sphenoid pterygoid plates. Medial elevates the jaw; lateral opens and protrudes the jaw with side-to-side grinding.'},
];

export interface DentalLayers {
 upperJaw: boolean;
 lowerJaw: boolean;
 teeth: boolean;
 q1: boolean;
 q2: boolean;
 q3: boolean;
 q4: boolean;
 incisor: boolean;
 canine: boolean;
 premolar: boolean;
 molar: boolean;
}
export const DEFAULT_DENTAL_LAYERS: DentalLayers = {
 upperJaw: true,
 lowerJaw: true,
 teeth: true,
 q1: true,
 q2: true,
 q3: true,
 q4: true,
 incisor: true,
 canine: true,
 premolar: true,
 molar: true,
};

export interface SceneState {
 inspectorOpen?:boolean;
 headFocus?:boolean;
 explode:number;
 visible:SystemId[];
 selected:string[];
 isolate:boolean;
 view:View;
 rotate:boolean;
 reset:number;
 nervousOverlay:boolean;
 nervousSelection:NervousSelection|null;
 nervousLayers:NervousLayers;
 nervousSide:NervousSide;
 smasOverlay?:boolean;
 smasSelection?:SmasSelection|null;
 smasLayers?:SmasLayers;
 smasSide?:NervousSide;
 faceMuscleLayers?:FaceMuscleLayers;
 dentalOverlay?:boolean;
 dentalLayers?:DentalLayers;
 dentalSide?:NervousSide;
 // Universal Side Selector fields for All Systems, Skeleton, and Organs
 bodySide?:NervousSide;
 allSide?:NervousSide;
 skeletonSide?:NervousSide;
 organsSide?:NervousSide;
 isSelectiveSliceActive?:boolean;
 activePill?:'all'|'skeleton'|'trigeminal'|'face'|'dental'|'organs';
 // Clinical reconstruction overlay (NCCT head / facial trauma). Additive; frozen pills unchanged.
 clinicalOverlay?:boolean;
 clinicalGlow?:boolean;
 clinicalSide?:NervousSide;
 clinicalHighlightPartIds?:string[];
 activeClinicalCaseId?:string;
}

export const SKELETON_SYSTEM_IDS:SystemId[] = ['skeletal','muscular','connective','integumentary'];
export const ORGAN_SYSTEM_IDS:SystemId[] = ['cardiac','respiratory','digestive','urinary','endocrine','sensory','arterial','venous','lymphatic','nervous'];
export const ORGAN_BASE_IDS:SystemId[] = ['skeletal','integumentary'];
export function keepOrganSection(id:SystemId):boolean{
 return ORGAN_BASE_IDS.includes(id) || ORGAN_SYSTEM_IDS.includes(id);
}

export const DEFAULT_VISIBLE:SystemId[] = ['cardiac','sensory','skeletal','muscular','arterial','venous','nervous','respiratory','digestive','urinary','lymphatic','endocrine','connective','integumentary'];
// Was skeletal + connective only. Skeleton & Soft Tissue now starts with every toggle in that section on.
export const SKELETON_VISIBLE:SystemId[] = ['skeletal','muscular','connective','integumentary'];
export const ORGANS_VISIBLE:SystemId[] = ['skeletal','integumentary','cardiac','respiratory','digestive','urinary','endocrine','sensory','arterial','venous','lymphatic','nervous'];
export const TRIGEMINAL_VISIBLE:SystemId[] = ['skeletal','integumentary'];
export const FACE_VISIBLE:SystemId[] = ['skeletal','integumentary'];
export const DENTAL_VISIBLE:SystemId[] = ['skeletal','integumentary'];

/** Parts permanently hidden from every system/layer view (male genital / reproductive). */
export function isSuppressedAnatomy(p:{system:string;name:string;id:string}):boolean{
 if(p.system==='reproductive')return true;
 const n=p.name.toLowerCase();
 // Penile vessels live under arterial/venous but still read as genital anatomy.
 if(n.includes('penis')||n.includes('of penis'))return true;
 if(n==='pubic hair')return true;
 return false;
}


export const DENTAL_QUADRANT_COLORS: Record<'q1' | 'q2' | 'q3' | 'q4', string> = {
 q1: '#2aa8b8', // Upper right (Teal)
 q2: '#3daf6a', // Upper left (Emerald)
 q3: '#8a5bb8', // Lower left (Purple)
 q4: '#e07a5f', // Lower right (Coral)
};

export const DENTAL_TYPE_COLORS: Record<'incisor' | 'canine' | 'premolar' | 'molar', string> = {
 incisor: '#38bdf8', // Sky Blue
 canine: '#fbbf24', // Amber
 premolar: '#c084fc', // Violet
 molar: '#fb7185', // Rose
};

export function isTooth(part: Part): boolean {
 return /tooth|teeth/i.test(part.name);
}

export function isUpperJaw(part: Part): boolean {
 // return /maxilla|gingiva of upper jaw/i.test(part.name);
 return /maxilla|gingiva of upper jaw|palatine bone/i.test(part.name);
}

export function isLowerJaw(part: Part): boolean {
 return /mandible|gingiva of lower jaw/i.test(part.name);
}

export function isJaw(part: Part): boolean {
 return isUpperJaw(part) || isLowerJaw(part);
}

export function isDentalStructure(part: Part): boolean {
 return isTooth(part) || isJaw(part);
}

export function getToothQuadrant(part: Part): 'q1' | 'q2' | 'q3' | 'q4' | null {
 if (!isTooth(part)) return null;
 const lower = part.name.toLowerCase();
 const isUpper = lower.includes('upper');
 const isLower = lower.includes('lower');
 const isLeft = lower.includes('left');
 const isRight = lower.includes('right');

 if (isUpper && isRight) return 'q1';
 if (isUpper && isLeft) return 'q2';
 if (isLower && isLeft) return 'q3';
 if (isLower && isRight) return 'q4';
 return null;
}

export function getToothType(part: Part): 'incisor' | 'canine' | 'premolar' | 'molar' | null {
 if (!isTooth(part)) return null;
 const lower = part.name.toLowerCase();
 if (lower.includes('incisor')) return 'incisor';
 if (lower.includes('canine')) return 'canine';
 if (lower.includes('premolar')) return 'premolar';
 if (lower.includes('molar')) return 'molar';
 return null;
}

export function partMatchesDental(part: Part, layers: DentalLayers, side: NervousSide = 'both'): boolean {
 if (isTooth(part)) {
  if (!layers.teeth) return false;
  const lower = part.name.toLowerCase();
  const isUpper = lower.includes('upper');
  const isLower = lower.includes('lower');
  const isLeft = lower.includes('left');
  const isRight = lower.includes('right');

  if (side === 'left' && isRight) return false;
  if (side === 'right' && isLeft) return false;

  let quadMatch = false;
  if (isUpper && isRight && layers.q1) quadMatch = true;
  else if (isUpper && isLeft && layers.q2) quadMatch = true;
  else if (isLower && isLeft && layers.q3) quadMatch = true;
  else if (isLower && isRight && layers.q4) quadMatch = true;
  else if (!isUpper && !isLower && !isLeft && !isRight) quadMatch = true;
  if (!quadMatch) return false;

  let typeMatch = false;
  if (lower.includes('incisor') && layers.incisor) typeMatch = true;
  else if (lower.includes('canine') && layers.canine) typeMatch = true;
  else if (lower.includes('premolar') && layers.premolar) typeMatch = true;
  else if (lower.includes('molar') && !lower.includes('premolar') && layers.molar) typeMatch = true;
  else if (!lower.includes('incisor') && !lower.includes('canine') && !lower.includes('premolar') && !lower.includes('molar')) typeMatch = true;
  return typeMatch;
 }

 if (isUpperJaw(part)) {
  if (!layers.upperJaw) return false;
  if (side === 'left' && /\bright\b/i.test(part.name)) return false;
  if (side === 'right' && /\bleft\b/i.test(part.name)) return false;
  return true;
 }

 if (isLowerJaw(part)) {
  if (!layers.lowerJaw) return false;
  if (side === 'left' && /\bright\b/i.test(part.name)) return false;
  if (side === 'right' && /\bleft\b/i.test(part.name)) return false;
  return true;
 }

 return true;
}

export const EXPLANATIONS:Record<string,string> = {
 'heart':'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
 'liver':'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
 'brain':'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
 'stomach':'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
 'spleen':'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
 'pancreas':'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
 'urinary bladder':'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
 'trachea':'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
 'diaphragm':'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
};
export function explanation(name:string,system:SystemId){return EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find(s=>s.id===system)?.description ?? '';}

export function partMatchesSide(part: Part, side: NervousSide = 'both'): boolean {
 if (side === 'both') return true;
 const name = part.name;
 const isLeft = /\b(left|sinister)\b/i.test(name);
 const isRight = /\b(right|dexter)\b/i.test(name);
 if (isLeft && !isRight) return side === 'left';
 if (isRight && !isLeft) return side === 'right';
 if (isLeft && isRight) {
  if (/\b(left)\b/i.test(name.slice(0, 15))) return side === 'left';
  if (/\b(right)\b/i.test(name.slice(0, 15))) return side === 'right';
 }
 // Midline or non-lateralized structures remain visible on both sides
 return true;
}

/**
 * The 5 systems selectively sliced in Organs & Viscera and All Systems.
 * All other body systems remain whole (both sides visible).
 */
export const SIDE_SLICED_SYSTEM_IDS: ReadonlySet<SystemId> = new Set([
  'sensory',
  'nervous',
  'respiratory',
  'endocrine',
  'lymphatic',
]);

export function isSideSlicedSystem(systemId: string): boolean {
  return SIDE_SLICED_SYSTEM_IDS.has(systemId as SystemId);
}

export function partMatchesSideWithSelectiveRule(
  part: Part,
  side: NervousSide = 'both',
  isSelectiveSliceActive: boolean = false
): boolean {
  if (side === 'both') return true;
  // If selective slice rule is active and part is NOT in the 5 systems, keep whole
  if (isSelectiveSliceActive && !isSideSlicedSystem(part.system)) {
    return true;
  }
  return partMatchesSide(part, side);
}

/**
 * Sagittal midline matching for Skeleton & Soft Tissue.
 * Parts spanning the midline or containing geometry on the selected anatomical side remain visible.
 */
export function partMatchesSkeletonSagittal(part: Part, side: NervousSide = 'both'): boolean {
  if (side === 'both') return true;
  // In Swasth atlas space: Left structures have X > 0, Right structures have X < 0.
  // For Right side: keep structures that have geometry in X <= 0
  if (side === 'right') return part.bounds[0][0] <= 0;
  // For Left side: keep structures that have geometry in X >= 0
  if (side === 'left') return part.bounds[1][0] >= 0;
  return true;
}


