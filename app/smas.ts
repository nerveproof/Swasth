import type {FacialNerveId,SmasLayers,SmasSelection,SoftTissueId} from './anatomy';

export interface SmasSheet {id:'smas';label:string;rows:[number,number,number][][]}
export interface FatVolume {center:[number,number,number];radii:[number,number,number]}
export interface FatPad {id:'fat';label:string;volumes:FatVolume[]}
export interface FacialNerveBranch {id:FacialNerveId;label:string;radius:number;path:[number,number,number][]}
export interface ParotidGland {id:'parotid';label:string;volumes:FatVolume[]}
export interface LymphNode {label:string;center:[number,number,number];radius:number}
export interface LymphGroup {id:'lymph';label:string;nodes:LymphNode[]}
export interface PeriosteumSheet {label:string;rows:[number,number,number][][]}
export interface PeriosteumLayer {id:'periosteum';label:string;sheets:PeriosteumSheet[]}
export interface SmasData {id:string;title:string;smas:SmasSheet;fat:FatPad;nerves:FacialNerveBranch[];parotid:ParotidGland;lymph:LymphGroup;periosteum:PeriosteumLayer}

export const SMAS_COLOR='#c9b896';
export const FAT_COLOR='#e0a45a';
export const FACIAL_NERVE_COLOR='#f0d978';
export const PAROTID_COLOR='#d08a82';
export const LYMPH_COLOR='#7a9a78';
export const PERIOSTEUM_COLOR='#e6ddd0';

export const FACIAL_NERVE_ROWS:{id:FacialNerveId;label:string;sub:string}[]=[
 {id:'temporal',label:'Temporal',sub:'forehead'},
 {id:'zygomatic',label:'Zygomatic',sub:'eye & cheek'},
 {id:'buccal',label:'Buccal',sub:'cheek'},
 {id:'marginal',label:'Marginal mandibular',sub:'lower lip'},
 {id:'cervical',label:'Cervical',sub:'neck'},
];

export const DEEP_TISSUE_ROWS:{id:'parotid'|'lymph'|'periosteum';label:string;sub:string}[]=[
 {id:'parotid',label:'Parotid',sub:'gland'},
 {id:'lymph',label:'Lymph nodes',sub:'face & neck'},
 {id:'periosteum',label:'Periosteum',sub:'on bone'},
];

export const SMAS_COPY:{title:string;blurb:string;note:string;items:Record<SoftTissueId,{title:string;blurb:string;accent:string}>}={
 title:'Facial soft tissue',
 blurb:'Between skin and bone sit fascia, fat, the parotid gland, lymph nodes, and a thin periosteum on the bone. Motor branches of the facial nerve (CN VII) fan out from in front of the ear to move the face. This overlay is a teaching sketch, not a dissection or a BodyParts3D mesh.',
 note:'Educational overlay · not a clinical map',
 items:{
  smas:{title:'SMAS',blurb:'The superficial musculoaponeurotic system is a thin fibrous sheet over the zygomatic bone, maxilla, and cheek. It links facial muscles to the overlying skin so expression moves the surface as a unit.',accent:SMAS_COLOR},
  fat:{title:'Buccal fat pad',blurb:'Buccal and subcutaneous fat fill the hollow of the cheek deep to SMAS and superficial to the muscles. The buccal fat pad is the deeper volume; a thinner malar pad sits higher under the cheekbone.',accent:FAT_COLOR},
  temporal:{title:'Temporal branch',blurb:'The temporal (frontal) branch of the facial nerve (CN VII) climbs over the zygomatic arch toward the temple and forehead. It supplies frontalis and part of orbicularis oculi, which lift the brow and help close the eye.',accent:FACIAL_NERVE_COLOR},
  zygomatic:{title:'Zygomatic branch',blurb:'Zygomatic branches of CN VII cross the cheekbone toward the lateral eye. They supply muscles that close the eyelids and help raise the upper cheek.',accent:FACIAL_NERVE_COLOR},
  buccal:{title:'Buccal branch',blurb:'Buccal branches of CN VII cross the cheek toward the mouth. They supply buccinator and muscles around the lips that move the cheek and upper lip.',accent:FACIAL_NERVE_COLOR},
  marginal:{title:'Marginal mandibular branch',blurb:'The marginal mandibular branch of CN VII follows the lower border of the mandible toward the corner of the mouth and lower lip. It supplies the depressors of the lip.',accent:FACIAL_NERVE_COLOR},
  cervical:{title:'Cervical branch',blurb:'The cervical branch of CN VII descends into the neck to supply platysma, which tenses the skin of the neck and lower face.',accent:FACIAL_NERVE_COLOR},
  parotid:{title:'Parotid gland',blurb:'The parotid is the largest salivary gland. It sits in front of the ear, tucked against the masseter, and the facial nerve weaves through it as the nerve fans into its motor branches.',accent:PAROTID_COLOR},
  lymph:{title:'Lymph nodes',blurb:'A small teaching set of regional nodes: preauricular and parotid nodes in front of the ear, a buccal node in the cheek, and submandibular and upper cervical nodes along the jaw and neck. They drain the face and are a common place to feel swelling.',accent:LYMPH_COLOR},
  periosteum:{title:'Periosteum',blurb:'Periosteum is a thin fibrous film that clings to bone. Here it is sketched over the cheekbone, maxilla, and mandible so you can see the covering that sits between muscle and bone.',accent:PERIOSTEUM_COLOR},
 },
};

export function onlySoftLayer(id:keyof SmasLayers):SmasLayers{
 return {smas:false,fat:false,temporal:false,zygomatic:false,buccal:false,marginal:false,cervical:false,parotid:false,lymph:false,periosteum:false,[id]:true};
}

export function smasHoverLabel(sel:SmasSelection){
 if(sel.kind==='smas')return 'SMAS';
 if(sel.kind==='fat')return 'Buccal fat pad';
 if(sel.kind==='parotid')return 'Parotid gland';
 if(sel.kind==='lymph')return 'Lymph node';
 if(sel.kind==='periosteum')return 'Periosteum';
 return SMAS_COPY.items[sel.kind]?.title??'Facial nerve';
}

export function smasCard(sel:SmasSelection|null){
 const face=sel?.side==='right'?'Right face':sel?.side==='left'?'Left face':'Face';
 if(!sel)return {title:SMAS_COPY.title,blurb:SMAS_COPY.blurb,accent:SMAS_COLOR,eyebrow:'Soft tissue overlay',face:'Face'};
 const item=SMAS_COPY.items[sel.kind];
 if(item){
  const eyebrow=sel.kind==='fat'?'Fat pad':sel.kind==='smas'?'Fascia':sel.kind==='parotid'?'Gland':sel.kind==='lymph'?'Lymphoid':sel.kind==='periosteum'?'Bone covering':'Facial nerve (CN VII)';
  return {title:item.title,blurb:item.blurb,accent:item.accent,eyebrow,face};
 }
 return {title:SMAS_COPY.title,blurb:SMAS_COPY.blurb,accent:SMAS_COLOR,eyebrow:'Soft tissue overlay',face};
}

const flipX=(p:[number,number,number]):[number,number,number]=>[-p[0],p[1],p[2]];
/** BodyParts3D +X is the subject's left. Negate X for the right-face copy. */
export function mirrorSmas(data:SmasData):SmasData{
 return {
  ...data,
  smas:{...data.smas,rows:data.smas.rows.map(row=>row.map(flipX))},
  fat:{...data.fat,volumes:data.fat.volumes.map(v=>({...v,center:flipX(v.center)}))},
  nerves:(data.nerves??[]).map(n=>({...n,path:n.path.map(flipX)})),
  parotid:{...data.parotid,volumes:(data.parotid?.volumes??[]).map(v=>({...v,center:flipX(v.center)}))},
  lymph:{...data.lymph,nodes:(data.lymph?.nodes??[]).map(n=>({...n,center:flipX(n.center)}))},
  periosteum:{...data.periosteum,sheets:(data.periosteum?.sheets??[]).map(s=>({...s,rows:s.rows.map(row=>row.map(flipX))}))},
 };
}
