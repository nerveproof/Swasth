import * as T from 'three';
import type {FacialNerveId,SmasLayers,SmasSelection} from './anatomy';
import {FACIAL_NERVE_COLOR,FAT_COLOR,LYMPH_COLOR,PAROTID_COLOR,PERIOSTEUM_COLOR,SMAS_COLOR,type SmasData} from './smas';

export interface SmasHandle {
 group:T.Group;
 pickables:T.Object3D[];
 setVisible:(v:boolean)=>void;
 setLayers:(layers:SmasLayers)=>void;
 setSelection:(sel:SmasSelection|null)=>void;
 resolve:(object:T.Object3D)=>SmasSelection|null;
 dispose:()=>void;
}

function sheetGeometry(rows:[number,number,number][][]){
 const ny=rows.length,nx=rows[0].length;
 const positions:number[]=[];
 const indices:number[]=[];
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const p=rows[j][i];positions.push(p[0],p[1],p[2]);}
 for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
  const a=j*nx+i,b=a+1,c=a+nx,d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 g.setIndex(indices);
 g.computeVertexNormals();
 const pos=g.getAttribute('position') as T.BufferAttribute;
 const nrm=g.getAttribute('normal') as T.BufferAttribute;
 const lift=.0012;
 for(let i=0;i<pos.count;i++){
  pos.setXYZ(i,pos.getX(i)+nrm.getX(i)*lift,pos.getY(i)+nrm.getY(i)*lift,pos.getZ(i)+nrm.getZ(i)*lift);
 }
 pos.needsUpdate=true;
 g.computeVertexNormals();
 return g;
}

function tube(path:[number,number,number][],radius:number){
 const curve=new T.CatmullRomCurve3(path.map(p=>new T.Vector3(p[0],p[1],p[2])));
 return new T.TubeGeometry(curve,Math.max(20,path.length*6),radius,6,false);
}

export function mountSmasOverlay(scene:T.Scene|T.Group|T.Object3D,data:SmasData,side:'left'|'right'='left'):SmasHandle{
 const group=new T.Group();group.name=`smas-overlay-${side}`;group.visible=false;scene.add(group);
 const pickables:T.Object3D[]=[];
 const materials:T.Material[]=[];
 const geometries:T.BufferGeometry[]=[];
 const record=new Map<T.Object3D,SmasSelection>();
 const smasMeshes:T.Mesh[]=[];
 const fatMeshes:T.Mesh[]=[];
 const parotidMeshes:T.Mesh[]=[];
 const lymphMeshes:T.Mesh[]=[];
 const periosteumMeshes:T.Mesh[]=[];
 const nerveMeshes=new Map<FacialNerveId,T.Mesh>();
 const smasMats:T.MeshStandardMaterial[]=[];
 const fatMats:T.MeshStandardMaterial[]=[];
 const parotidMats:T.MeshStandardMaterial[]=[];
 const lymphMats:T.MeshStandardMaterial[]=[];
 const periosteumMats:T.MeshStandardMaterial[]=[];
 const nerveMats=new Map<FacialNerveId,T.MeshStandardMaterial>();
 let layers:SmasLayers={smas:true,fat:true,temporal:true,zygomatic:true,buccal:true,marginal:true,cervical:true,parotid:true,lymph:true,periosteum:true};

 const smasGeom=sheetGeometry(data.smas.rows);
 geometries.push(smasGeom);
 const smasMat=new T.MeshStandardMaterial({
  color:SMAS_COLOR,emissive:SMAS_COLOR,emissiveIntensity:.08,
  transparent:true,opacity:.32,depthWrite:false,side:T.DoubleSide,roughness:.82,metalness:.04,
 });
 materials.push(smasMat);
 const smas=new T.Mesh(smasGeom,smasMat);
 smas.renderOrder=14;
 smas.name='smas-sheet';
 group.add(smas);
 pickables.push(smas);
 record.set(smas,{kind:'smas',id:'smas',side});
 smasMeshes.push(smas);
 smasMats.push(smasMat);

 for(const volume of data.fat.volumes){
  const geom=new T.SphereGeometry(1,24,18);
  geometries.push(geom);
  const mat=new T.MeshStandardMaterial({
   color:FAT_COLOR,emissive:FAT_COLOR,emissiveIntensity:.1,
   transparent:true,opacity:.4,depthWrite:false,side:T.DoubleSide,roughness:.9,metalness:0,
  });
  materials.push(mat);
  const mesh=new T.Mesh(geom,mat);
  mesh.position.fromArray(volume.center);
  mesh.scale.fromArray(volume.radii);
  mesh.renderOrder=12;
  mesh.name='fat-volume';
  group.add(mesh);
  pickables.push(mesh);
  record.set(mesh,{kind:'fat',id:'fat',side});
  fatMeshes.push(mesh);
  fatMats.push(mat);
 }

 for(const volume of data.parotid?.volumes??[]){
  const geom=new T.SphereGeometry(1,24,18);
  geometries.push(geom);
  const mat=new T.MeshStandardMaterial({
   color:PAROTID_COLOR,emissive:PAROTID_COLOR,emissiveIntensity:.08,
   transparent:true,opacity:.46,depthWrite:false,side:T.DoubleSide,roughness:.86,metalness:0,
  });
  materials.push(mat);
  const mesh=new T.Mesh(geom,mat);
  mesh.position.fromArray(volume.center);
  mesh.scale.fromArray(volume.radii);
  mesh.renderOrder=11;
  mesh.name='parotid-volume';
  group.add(mesh);
  pickables.push(mesh);
  record.set(mesh,{kind:'parotid',id:'parotid',side});
  parotidMeshes.push(mesh);
  parotidMats.push(mat);
 }

 for(const node of data.lymph?.nodes??[]){
  const geom=new T.SphereGeometry(node.radius,16,12);
  geometries.push(geom);
  const mat=new T.MeshStandardMaterial({
   color:LYMPH_COLOR,emissive:LYMPH_COLOR,emissiveIntensity:.16,
   transparent:true,opacity:.72,depthWrite:false,roughness:.55,metalness:.02,
  });
  materials.push(mat);
  const mesh=new T.Mesh(geom,mat);
  mesh.position.fromArray(node.center);
  mesh.renderOrder=13;
  mesh.name=`lymph-${node.label}`;
  group.add(mesh);
  pickables.push(mesh);
  record.set(mesh,{kind:'lymph',id:'lymph',side});
  lymphMeshes.push(mesh);
  lymphMats.push(mat);
 }

 for(const sheet of data.periosteum?.sheets??[]){
  const geom=sheetGeometry(sheet.rows);
  geometries.push(geom);
  const mat=new T.MeshStandardMaterial({
   color:PERIOSTEUM_COLOR,emissive:PERIOSTEUM_COLOR,emissiveIntensity:.04,
   transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide,roughness:.9,metalness:.02,
  });
  materials.push(mat);
  const mesh=new T.Mesh(geom,mat);
  mesh.renderOrder=8;
  mesh.name=`periosteum-${sheet.label}`;
  group.add(mesh);
  pickables.push(mesh);
  record.set(mesh,{kind:'periosteum',id:'periosteum',side});
  periosteumMeshes.push(mesh);
  periosteumMats.push(mat);
 }

 for(const branch of data.nerves??[]){
  const geom=tube(branch.path,branch.radius);
  geometries.push(geom);
  const mat=new T.MeshStandardMaterial({
   color:FACIAL_NERVE_COLOR,emissive:FACIAL_NERVE_COLOR,emissiveIntensity:.22,
   roughness:.4,metalness:.04,
  });
  materials.push(mat);
  const mesh=new T.Mesh(geom,mat);
  mesh.renderOrder=16;
  mesh.name=`cnvii-${branch.id}`;
  group.add(mesh);
  pickables.push(mesh);
  record.set(mesh,{kind:branch.id,id:branch.id,side});
  nerveMeshes.set(branch.id,mesh);
  nerveMats.set(branch.id,mat);
 }

 const applyLayers=()=>{
  smasMeshes.forEach(m=>m.visible=layers.smas);
  fatMeshes.forEach(m=>m.visible=layers.fat);
  parotidMeshes.forEach(m=>m.visible=layers.parotid);
  lymphMeshes.forEach(m=>m.visible=layers.lymph);
  periosteumMeshes.forEach(m=>m.visible=layers.periosteum);
  nerveMeshes.forEach((mesh,id)=>{mesh.visible=layers[id];});
 };

 const apply=(sel:SmasSelection|null)=>{
  const mine=!sel||!sel.side||sel.side===side;
  const local=mine?sel:null;
  const smasOn=local?.kind==='smas';
  const fatOn=local?.kind==='fat';
  const parotidOn=local?.kind==='parotid';
  const lymphOn=local?.kind==='lymph';
  const periOn=local?.kind==='periosteum';
  smasMats.forEach(mat=>{mat.opacity=smasOn?.5:.3;mat.emissiveIntensity=smasOn?.28:.08;});
  fatMats.forEach(mat=>{mat.opacity=fatOn?.56:.38;mat.emissiveIntensity=fatOn?.32:.1;});
  parotidMats.forEach(mat=>{mat.opacity=parotidOn?.62:.44;mat.emissiveIntensity=parotidOn?.28:.08;});
  lymphMats.forEach(mat=>{mat.opacity=lymphOn?.9:.7;mat.emissiveIntensity=lymphOn?.45:.16;});
  periosteumMats.forEach(mat=>{mat.opacity=periOn?.4:.2;mat.emissiveIntensity=periOn?.18:.04;});
  nerveMats.forEach((mat,id)=>{
   const on=local?.kind===id;
   mat.emissiveIntensity=on?1.1:.22;
   mat.color.set(on?0xffe27a:FACIAL_NERVE_COLOR);
  });
 };

 return {
  group,pickables,
  setVisible(v){group.visible=v;if(!v)apply(null);},
  setLayers(next){layers=next;applyLayers();},
  setSelection(sel){apply(sel);},
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
