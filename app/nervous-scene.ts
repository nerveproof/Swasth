import * as T from 'three';
import type {NervousLayers,NervousSelection} from './anatomy';
import {GANGLION_COLOR,NERVE_COLOR,partEnabled,partOf,type OverlayPartId,type TrigeminalData} from './trigeminal';

export interface OverlayHandle {
 group:T.Group;
 pickables:T.Object3D[];
 setVisible:(v:boolean)=>void;
 setLayers:(layers:NervousLayers)=>void;
 setSelection:(sel:NervousSelection|null)=>void;
 labelAnchors:()=>{id:string;kind:'ganglion'|'branch'|'zone';label:string;world:T.Vector3}[];
 resolve:(object:T.Object3D)=>NervousSelection|null;
 dispose:()=>void;
}

function contourGeometry(contour:[number,number,number][]){
 const pts=contour.map(p=>new T.Vector3(p[0],p[1],p[2]));
 const center=pts.reduce((s,p)=>s.add(p),new T.Vector3()).multiplyScalar(1/pts.length);
 const positions:number[]=[];
 const indices:number[]=[];
 positions.push(center.x,center.y,center.z);
 pts.forEach(p=>positions.push(p.x,p.y,p.z));
 for(let i=0;i<pts.length;i++){
  const a=i+1,b=i+2<=pts.length?i+2:1;
  indices.push(0,a,b);
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 g.setIndex(indices);
 g.computeVertexNormals();
 return g;
}

function tube(path:[number,number,number][],radius:number){
 const curve=new T.CatmullRomCurve3(path.map(p=>new T.Vector3(p[0],p[1],p[2])));
 return new T.TubeGeometry(curve,Math.max(20,path.length*6),radius,6,false);
}

export function mountTrigeminalOverlay(scene:T.Scene|T.Group|T.Object3D,data:TrigeminalData,side:'left'|'right'='left'):OverlayHandle{
 const group=new T.Group();group.name=`trigeminal-overlay-${side}`;group.visible=false;scene.add(group);
 const pickables:T.Object3D[]=[];
 const materials:T.Material[]=[];
 const geometries:T.BufferGeometry[]=[];
 const record=new Map<T.Object3D,NervousSelection>();
 const branchMeshes=new Map<string,T.Mesh>();
 const zoneMeshes=new Map<OverlayPartId,T.Mesh>();
 const branchMats=new Map<string,T.MeshStandardMaterial>();
 const zoneMats=new Map<OverlayPartId,T.MeshStandardMaterial>();
 let layers:NervousLayers={cnv:true,v1:true,v2:true,v3Jaw:true,v3Temple:true};

 const ganglionGeom=new T.SphereGeometry(data.ganglion.radius,20,16);
 const haloGeom=new T.SphereGeometry(data.ganglion.radius*1.85,16,12);
 geometries.push(ganglionGeom,haloGeom);
 const ganglionMat=new T.MeshStandardMaterial({color:GANGLION_COLOR,emissive:GANGLION_COLOR,emissiveIntensity:.45,roughness:.35,metalness:.08});
 const haloMat=new T.MeshBasicMaterial({color:GANGLION_COLOR,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide});
 materials.push(ganglionMat,haloMat);
 const ganglion=new T.Mesh(ganglionGeom,ganglionMat);
 ganglion.position.fromArray(data.ganglion.position);
 ganglion.renderOrder=12;
 const halo=new T.Mesh(haloGeom,haloMat);
 halo.position.copy(ganglion.position);
 halo.renderOrder=11;
 group.add(halo,ganglion);
 pickables.push(ganglion);
 record.set(ganglion,{kind:'ganglion',id:data.ganglion.id,side});

 for(const branch of data.branches){
  const geom=tube(branch.path,branch.radius);
  geometries.push(geom);
  const mat=new T.MeshStandardMaterial({color:NERVE_COLOR,emissive:NERVE_COLOR,emissiveIntensity:.18,roughness:.42,metalness:.04});
  materials.push(mat);
  const mesh=new T.Mesh(geom,mat);
  mesh.renderOrder=12;
  group.add(mesh);
  pickables.push(mesh);
  record.set(mesh,{kind:'branch',id:branch.id,side});
  branchMeshes.set(branch.id,mesh);
  branchMats.set(branch.id,mat);
 }

 for(const zone of data.zones){
  const geom=contourGeometry(zone.contour);
  geometries.push(geom);
  const mat=new T.MeshStandardMaterial({
   color:zone.color,emissive:zone.color,emissiveIntensity:.12,
   transparent:true,opacity:.3,depthWrite:false,side:T.DoubleSide,roughness:.7,metalness:0,
  });
  materials.push(mat);
  const mesh=new T.Mesh(geom,mat);
  mesh.renderOrder=10;
  group.add(mesh);
  pickables.push(mesh);
  record.set(mesh,{kind:'zone',id:zone.id,side});
  zoneMeshes.set(zone.id,mesh);
  zoneMats.set(zone.id,mat);
 }

 const applyLayers=()=>{
  ganglion.visible=halo.visible=layers.cnv;
  data.branches.forEach(branch=>{
   const mesh=branchMeshes.get(branch.id);if(!mesh)return;
   mesh.visible=layers.cnv&&partEnabled(layers,branch.part);
  });
  data.zones.forEach(zone=>{
   const mesh=zoneMeshes.get(zone.id);if(!mesh)return;
   mesh.visible=partEnabled(layers,zone.id);
  });
 };

 const apply=(sel:NervousSelection|null)=>{
  const mine=!sel||!sel.side||sel.side===side;
  const local=mine?sel:null;
  const hotPart=partOf(data,local);
  ganglionMat.emissiveIntensity=local?.kind==='ganglion'?1.15:.45;
  haloMat.opacity=local?.kind==='ganglion'?.5:.22;
  halo.scale.setScalar(local?.kind==='ganglion'?1.18:1);
  branchMats.forEach((mat,id)=>{
   const branch=data.branches.find(b=>b.id===id);
   const on=local?.kind==='branch'&&local.id===id;
   const kin=!!hotPart&&branch?.part===hotPart;
   mat.emissiveIntensity=on?1.05:kin?.4:.18;
   mat.color.set(on||kin?0xffe27a:NERVE_COLOR);
  });
  zoneMats.forEach((mat,id)=>{
   const on=hotPart===id||(local?.kind==='zone'&&local.id===id);
   mat.opacity=on?.48:.28;
   mat.emissiveIntensity=on?.28:.12;
  });
 };

 return {
  group,pickables,
  setVisible(v){group.visible=v;if(!v)apply(null);},
  setLayers(next){layers=next;applyLayers();},
  setSelection(sel){apply(sel);},
  labelAnchors(){
   const anchors:{id:string;kind:'ganglion'|'branch'|'zone';label:string;world:T.Vector3}[]=[
    {id:data.ganglion.id,kind:'ganglion',label:'Trigeminal Nerve (CN V)',world:ganglion.position.clone()},
   ];
   for(const zone of data.zones){
    const mesh=zoneMeshes.get(zone.id);
    const world=new T.Vector3();
    if(mesh){mesh.geometry.computeBoundingBox();mesh.geometry.boundingBox?.getCenter(world);}
    anchors.push({id:zone.id,kind:'zone',label:zone.label,world});
   }
   return anchors;
  },
  resolve(object){
   let o:T.Object3D|null=object;
   while(o){const hit=record.get(o);if(hit)return hit;o=o.parent;}
   return null;
  },
  dispose(){
   scene.remove(group);
   geometries.forEach(g=>g.dispose());
   materials.forEach(m=>m.dispose());
  },
 };
}
