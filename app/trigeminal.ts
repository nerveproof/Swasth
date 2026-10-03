import type {NervousLayers,NervousSelection} from './anatomy';

export type DivisionId='v1'|'v2'|'v3';
export type OverlayPartId='v1'|'v2'|'v3-jaw'|'v3-temple';
export interface TrigeminalGanglion {id:string;label:string;position:[number,number,number];radius:number}
export interface TrigeminalBranch {id:string;division:DivisionId;part:OverlayPartId;label:string;radius:number;path:[number,number,number][]}
export interface TrigeminalZone {id:OverlayPartId;division:DivisionId;label:string;color:string;contour:[number,number,number][]}
export interface TrigeminalData {id:string;title:string;ganglion:TrigeminalGanglion;branches:TrigeminalBranch[];zones:TrigeminalZone[]}

export const DIVISION_COLORS:Record<DivisionId,string>={v1:'#2aa8b8',v2:'#3daf6a',v3:'#8a5bb8'};
export const NERVE_COLOR='#e6c445';
export const GANGLION_COLOR='#3ec6e8';

export const TRIGEMINAL_COPY:{title:string;blurb:string;note:string;items:Record<string,{title:string;blurb:string;accent:string}>}={
 title:'Trigeminal Nerve (CN V)',
 blurb:'The trigeminal nerve is the main sensory nerve of the face. Its ganglion sits just in front of the ear and splits into three divisions that supply forehead (V1), cheek (V2), and jaw (V3). Colored patches are dermatome zones — skin regions served by each division. This overlay is a teaching annotation, not a diagnostic map.',
 note:'Educational overlay · not a clinical map',
 items:{
  gasserian:{title:'Trigeminal ganglion',blurb:'The trigeminal (Gasserian) ganglion is the hub of CN V. Sensory cell bodies sit here. Three divisions leave this node: ophthalmic (V1), maxillary (V2), and mandibular (V3).',accent:GANGLION_COLOR},
  'v1-frontal':{title:'Frontal nerve (V1)',blurb:'A terminal branch of the ophthalmic division. It runs over the orbit toward the forehead and supplies skin of the forehead and upper eyelid.',accent:DIVISION_COLORS.v1},
  'v1-supratrochlear':{title:'Supratrochlear nerve (V1)',blurb:'A medial V1 branch toward the inner brow and lower forehead, near the bridge of the nose.',accent:DIVISION_COLORS.v1},
  'v1-nasociliary':{title:'Nasociliary nerve (V1)',blurb:'A V1 branch that turns toward the nose. It contributes sensation to the bridge of the nose and nearby orbit.',accent:DIVISION_COLORS.v1},
  'v2-infraorbital':{title:'Infraorbital nerve (V2)',blurb:'The main cutaneous branch of the maxillary division. It crosses the cheek to the side of the nose and upper lip.',accent:DIVISION_COLORS.v2},
  'v2-zygomatic':{title:'Zygomaticofacial nerve (V2)',blurb:'A V2 twig over the cheekbone, supplying a patch of skin on the prominence of the cheek.',accent:DIVISION_COLORS.v2},
  'v3-mental':{title:'Inferior alveolar / mental nerve (V3)',blurb:'The mandibular division drops along the jaw. Its mental branch surfaces near the chin and lower lip.',accent:DIVISION_COLORS.v3},
  'v3-auriculotemporal':{title:'Auriculotemporal nerve (V3)',blurb:'A V3 branch that climbs in front of the ear toward the temple, supplying that strip of skin.',accent:DIVISION_COLORS.v3},
  'v3-buccal':{title:'Buccal nerve (V3)',blurb:'A sensory V3 branch across the cheek toward the corner of the mouth.',accent:DIVISION_COLORS.v3},
  v1:{title:'Ophthalmic Zone (V1)',blurb:'Skin of the forehead, upper eyelid, and bridge of the nose is typically supplied by the ophthalmic division of CN V.',accent:DIVISION_COLORS.v1},
  v2:{title:'Maxillary Zone (V2)',blurb:'Skin of the cheek, side of the nose, and upper lip is typically supplied by the maxillary division of CN V.',accent:DIVISION_COLORS.v2},
  v3:{title:'Mandibular Zone (V3)',blurb:'V3 covers two skin areas. Jaw & chin is the lower face. Temple & ear is the strip in front of the ear. Study one part at a time if the whole zone feels crowded.',accent:DIVISION_COLORS.v3},
  'v3-jaw':{title:'V3 jaw & chin',blurb:'This part of V3 supplies the jaw, chin, and lower lip. Turn Temple & ear off if you only want this territory.',accent:DIVISION_COLORS.v3},
  'v3-temple':{title:'V3 temple & ear',blurb:'This part of V3 supplies the strip in front of the ear toward the temple. Turn Jaw & chin off if you only want this territory.',accent:DIVISION_COLORS.v3},
 },
};

export function overlayCard(sel:NervousSelection|null){
 const face=sel?.side==='right'?'Right face':'Left face';
 if(!sel)return {title:TRIGEMINAL_COPY.title,blurb:TRIGEMINAL_COPY.blurb,accent:GANGLION_COLOR,eyebrow:'Nervous overlay',face:'Face'};
 const item=TRIGEMINAL_COPY.items[sel.id];
 if(item)return {title:item.title,blurb:item.blurb,accent:item.accent,eyebrow:sel.kind==='zone'?'Dermatome':sel.kind==='ganglion'?'Ganglion':'CN V branch',face};
 if(sel.kind==='zone')return {title:TRIGEMINAL_COPY.items[sel.id]?.title??sel.id,blurb:TRIGEMINAL_COPY.blurb,accent:DIVISION_COLORS[sel.id as DivisionId]??GANGLION_COLOR,eyebrow:'Dermatome',face};
 return {title:TRIGEMINAL_COPY.title,blurb:TRIGEMINAL_COPY.blurb,accent:GANGLION_COLOR,eyebrow:'Nervous overlay',face};
}

export function divisionOf(data:TrigeminalData,sel:NervousSelection|null):DivisionId|null{
 if(!sel)return null;
 if(sel.kind==='zone')return data.zones.find(z=>z.id===sel.id)?.division??(sel.id==='v1'||sel.id==='v2'||sel.id==='v3'?sel.id:null);
 if(sel.kind==='branch')return data.branches.find(b=>b.id===sel.id)?.division??null;
 return null;
}

export function partOf(data:TrigeminalData,sel:NervousSelection|null):OverlayPartId|null{
 if(!sel)return null;
 if(sel.kind==='zone')return sel.id as OverlayPartId;
 if(sel.kind==='branch')return data.branches.find(b=>b.id===sel.id)?.part??null;
 return null;
}

export function partEnabled(layers:NervousLayers,part:OverlayPartId){
 if(part==='v1')return layers.v1;
 if(part==='v2')return layers.v2;
 if(part==='v3-jaw')return layers.v3Jaw;
 return layers.v3Temple;
}

const flipX=(p:[number,number,number]):[number,number,number]=>[-p[0],p[1],p[2]];
/** BodyParts3D +X is the subject's left. Negate X for the right-face copy. */
export function mirrorTrigeminal(data:TrigeminalData):TrigeminalData{
 return {
  ...data,
  ganglion:{...data.ganglion,position:flipX(data.ganglion.position)},
  branches:data.branches.map(b=>({...b,path:b.path.map(flipX)})),
  zones:data.zones.map(z=>({...z,contour:z.contour.map(flipX)})),
 };
}

export function sideLabel(side:'left'|'right'|undefined){
 if(side==='right')return 'Right face';
 return 'Left face';
}
