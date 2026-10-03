import {useEffect,useRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createExplosionLayout} from './explosion-layout';
import {decodeModelResponse} from './model-download';
import {PointerTap} from './pointer-tap';
import {SYSTEMS,type Atlas,type SceneState,type NervousSelection,type SmasSelection,isDentalStructure,isTooth,getToothQuadrant,partMatchesDental,partMatchesSide,partMatchesSideWithSelectiveRule,partMatchesSkeletonSagittal,DEFAULT_DENTAL_LAYERS,isSuppressedAnatomy} from './anatomy';
import {TRIGEMINAL_DATA} from './trigeminal-data';
import {mirrorTrigeminal,partEnabled,type OverlayPartId} from './trigeminal';
import {mountTrigeminalOverlay,type OverlayHandle} from './nervous-scene';
import {mountSmasOverlay,type SmasHandle} from './smas-scene';
import {mirrorSmas,smasHoverLabel,type SmasData} from './smas';
import {mountFaceMusclesOverlay,type FaceMusclesHandle} from './face-muscles-scene';
import {FACE_MUSCLES_DATA,mirrorFaceMuscles} from './face-muscles';
import {mountWisdomTeeth,type WisdomTeethHandle} from './wisdom-teeth';
import {mountClinicalReconstruction,type ClinicalReconstructionHandle} from './clinical-reconstruction-scene';
import {ACTIVE_CLINICAL_RECONSTRUCTION, CLINICAL_CASE_HIGHLIGHT_RGBA, CLINICAL_HIGHLIGHT_RGBA, getClinicalCaseById} from './clinical-reconstruction';

interface Props {atlas:Atlas;state:SceneState;onSelect:(id:string)=>void;onNervousSelect?:(sel:NervousSelection|null)=>void;onSmasSelect?:(sel:SmasSelection|null)=>void;onProgress:(n:number)=>void;onError:(s:string)=>void}
export default function AnatomyScene({atlas,state,onSelect,onNervousSelect,onSmasSelect,onProgress,onError}:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(state),select=useRef(onSelect),nervousSelect=useRef(onNervousSelect),smasSelect=useRef(onSmasSelect);
 latest.current=state;select.current=onSelect;nervousSelect.current=onNervousSelect;smasSelect.current=onSmasSelect;
 useEffect(()=>{
  const el=host.current!;let disposed=false,frame=0,dirty=true,ready=false,lastView='',lastReset=-1,lastIsolate='',layoutKey='',amount=0;
  let lastState:SceneState|null=null;
  const abort=new AbortController();
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{onError('This browser could not start the 3D viewer. Please try a browser with WebGL enabled.');return;}
  renderer.localClippingEnabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<768?1.5:2));renderer.setClearColor('#f2f3f3');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Interactive human anatomy. Drag to orbit, pinch or scroll to zoom, and tap a structure to inspect it.');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.005,100),controls=new OrbitControls(camera,renderer.domElement);
  camera.position.set(1.4,1.05,3.6);controls.target.set(0,.85,0);controls.enableDamping=true;controls.dampingFactor=.085;controls.minDistance=.07;controls.maxDistance=40;controls.maxPolarAngle=Math.PI*.96;controls.addEventListener('change',()=>{dirty=true;});
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(0xffffff,0xa7acb2,1.05));
  const key=new T.DirectionalLight(0xfffaf4,2.3);key.position.set(-2,4,3);scene.add(key);
  const rim=new T.DirectionalLight(0xe9f0ff,1.8);rim.position.set(2,2,-3);scene.add(rim);
  const ground=new T.Mesh(new T.CircleGeometry(30,96),new T.MeshStandardMaterial({color:0xd5d9dc,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.019;scene.add(ground);
  const platform=new T.Mesh(new T.CylinderGeometry(.68,.7,.028,100),new T.MeshStandardMaterial({color:0xeeeeec,metalness:.12,roughness:.67}));platform.position.y=-.016;scene.add(platform);
  const ring=new T.Mesh(new T.RingGeometry(.63,.632,128),new T.MeshBasicMaterial({color:0x8c969f,transparent:true,opacity:.4,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;scene.add(ring);
  const innerRing=new T.Mesh(new T.RingGeometry(.55,.551,128),new T.MeshBasicMaterial({color:0xa4aeb8,transparent:true,opacity:.16,side:T.DoubleSide}));innerRing.rotation.x=-Math.PI/2;innerRing.position.y=.001;scene.add(innerRing);
  const width=T.MathUtils.ceilPowerOfTwo(atlas.parts.length),data=new Float32Array(width*4),partTexture=new T.DataTexture(data,width,1,T.RGBAFormat,T.FloatType);partTexture.needsUpdate=true;
  const selectedData=new Uint8Array(width*4),selectionTexture=new T.DataTexture(selectedData,width,1);selectionTexture.needsUpdate=true;
  const materials:T.Material[]=[],geometries:T.BufferGeometry[]=[],pickers:(T.Mesh|undefined)[]=[],centers=atlas.parts.map(p=>new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(.5));
  const offsets:T.Vector3[]=[],bounds=atlas.parts.map(p=>new T.Box3(new T.Vector3().fromArray(p.bounds[0]),new T.Vector3().fromArray(p.bounds[1])));
  let packingWidth=1,packingHeight=1;
  const markerPositions=new Float32Array(atlas.parts.length*3),markerGeometry=new T.BufferGeometry();markerGeometry.setAttribute('position',new T.BufferAttribute(markerPositions,3));
  const markerMaterial=new T.PointsMaterial({color:0x64748b,size:5,sizeAttenuation:false,transparent:true,opacity:.72,depthTest:false});
  markerMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');};
  const markers=new T.Points(markerGeometry,markerMaterial);markers.frustumCulled=false;markers.renderOrder=10;markers.visible=false;scene.add(markers);
  const hover=document.createElement('div');hover.className='part-hover';hover.setAttribute('role','tooltip');hover.hidden=true;el.appendChild(hover);
  const labels=document.createElement('div');labels.className='nerve-labels';labels.hidden=true;el.appendChild(labels);
  const clinicalLabels=document.createElement('div');clinicalLabels.className='clinical-labels';clinicalLabels.hidden=true;el.appendChild(clinicalLabels);
  const projectedLabel=new T.Vector3();

  // Hardware and shader sagittal midline clipping for Skeleton & Soft Tissue mode:
  // Patient facing camera: Left anatomical structures have X > 0, Right anatomical structures have X < 0.
  // To keep Right half only: keep X <= 0, clip X > 0 (normal -1, 0, 0, constant 0).
  // To keep Left half only: keep X >= 0, clip X < 0 (normal 1, 0, 0, constant 0).
  const clipPlaneRight = new T.Plane(new T.Vector3(-1, 0, 0), 0);
  const clipPlaneLeft = new T.Plane(new T.Vector3(1, 0, 0), 0);
  const clipPlaneDisabled = new T.Plane(new T.Vector3(1, 0, 0), 10000);
  const activeSagittalPlane = new T.Plane(new T.Vector3(1, 0, 0), 10000);
  const sagittalClipUniform = { value: 0.0 };

  // Root group for trigeminal and smas overlays
  const overlayGroup=new T.Group();
  scene.add(overlayGroup);

  const leftOverlayData=TRIGEMINAL_DATA;
  const rightOverlayData=mirrorTrigeminal(TRIGEMINAL_DATA);
  const leftHandle:OverlayHandle=mountTrigeminalOverlay(overlayGroup,leftOverlayData,'left');
  const rightHandle:OverlayHandle=mountTrigeminalOverlay(overlayGroup,rightOverlayData,'right');

  const faceMusclesLeft:FaceMusclesHandle=mountFaceMusclesOverlay(overlayGroup,FACE_MUSCLES_DATA,'left');
  const faceMusclesRight:FaceMusclesHandle=mountFaceMusclesOverlay(overlayGroup,mirrorFaceMuscles(FACE_MUSCLES_DATA),'right');

  const wisdomTeethHandle:WisdomTeethHandle=mountWisdomTeeth(overlayGroup);
  const clinicalHandle:ClinicalReconstructionHandle=mountClinicalReconstruction(overlayGroup);
  const burnPartIndices:number[]=[];
  atlas.parts.forEach((p,i)=>{if(p.id==='FJ3392'||p.id==='FJ3375')burnPartIndices.push(i);});

  let smasLeft:SmasHandle|null=null,smasRight:SmasHandle|null=null;
  fetch('/models/smas.json',{signal:abort.signal})
   .then(r=>{if(!r.ok)return;return r.json();})
   .then(data=>{
    if(disposed||!data)return;
    const smasData=data as SmasData;
    smasLeft=mountSmasOverlay(overlayGroup,smasData,'left');
    smasRight=mountSmasOverlay(overlayGroup,mirrorSmas(smasData),'right');
    dirty=true;
   })
   .catch(()=>{});

  const getActiveOverlays=()=>{
   const side=latest.current.nervousSide||'left';
   if(!latest.current.nervousOverlay)return [];
   if(side==='both')return [leftHandle,rightHandle];
   if(side==='right')return [rightHandle];
   return [leftHandle];
  };

  const getActiveSmasOverlays=()=>{
   const side=latest.current.smasSide||'left';
   if(!latest.current.smasOverlay)return [];
   if(side==='both')return [smasLeft,smasRight].filter((o):o is SmasHandle=>!!o);
   if(side==='right')return smasRight?[smasRight]:[];
   return smasLeft?[smasLeft]:[];
  };

  type Target={index:number;x:number;y:number;left:number;right:number;top:number;bottom:number};let targets:Target[]=[];
  const projected=new T.Vector3();
  const findTarget=(x:number,y:number,radius:number)=>{
   let best=-1,score=Infinity;
   for(const t of targets){const dx=Math.max(t.left-x,0,x-t.right),dy=Math.max(t.top-y,0,y-t.bottom),distance=Math.hypot(dx,dy);if(distance>radius)continue;const candidate=distance+Math.hypot(t.x-x,t.y-y)*.025;if(candidate<score){score=candidate;best=t.index;}}
   return best;
  };

  const isSubtleSystem=(system:string)=>(latest.current.nervousOverlay||latest.current.smasOverlay)&&(system==='skeletal'||system==='integumentary');

  const materialFor=(system:string)=>{
   const isSkin=system==='integumentary';
   const m=new T.MeshStandardMaterial({
    color:SYSTEMS.find(s=>s.id===system)?.color??'#aebbb8',
    metalness:.08,
    roughness:.53,
    side:T.DoubleSide,
    transparent:true,
    opacity:isSkin?.1:1,
    depthWrite:!isSkin
   });
   m.clippingPlanes=[activeSagittalPlane];
   m.clipShadows=true;
   m.onBeforeCompile=shader=>{
    shader.uniforms.partState={value:partTexture};shader.uniforms.selectionState={value:selectionTexture};shader.uniforms.stateWidth={value:width};
    shader.uniforms.sagittalClip=sagittalClipUniform;
    shader.vertexShader='attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying vec4 partHighlight; varying vec3 vAnatomicalPos;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partHighlight = texture2D(selectionState, stateUv); vAnatomicalPos = position;');
    shader.fragmentShader='varying float partVisible; varying vec4 partHighlight; varying vec3 vAnatomicalPos; uniform float sagittalClip;\n'+shader.fragmentShader;
    // shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;');
    // shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif (partHighlight.a > 0.0) diffuseColor.rgb = mix(diffuseColor.rgb, partHighlight.rgb, partHighlight.a);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (partVisible < 0.05) discard;\nif (sagittalClip > 0.5 && vAnatomicalPos.x > 0.0) discard;\nif (sagittalClip < -0.5 && vAnatomicalPos.x < 0.0) discard;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif (partHighlight.a > 0.0) diffuseColor.rgb = mix(diffuseColor.rgb, partHighlight.rgb, partHighlight.a);\nif (partVisible < 0.95) diffuseColor.a = min(diffuseColor.a, partVisible);');
   };materials.push(m);return m;
  };
  const mats=new Map(SYSTEMS.map(s=>[s.id,materialFor(s.id)]));
  let loaded=0;
  const loadChunk=async(ci:number)=>{
   const chunk=atlas.chunks[ci],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';const response=await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal});const buffer=await decodeModelResponse(response,chunk.bytes,compressed);if(disposed)return;
   const groups=new Map<string,T.BufferGeometry[]>();
   atlas.parts.forEach((p,i)=>{
    if(p.chunk!==ci)return;
    // Skip male reproductive meshes: SYSTEMS no longer includes reproductive, so
    // mats.get('reproductive') is undefined and Three.js would draw them always.
    // if(isSuppressedAnatomy(p))return;
    // FIX 1a: in atlas.parts.forEach grouping by p.system, add active early continue: if (p.system === 'reproductive') return;
    // (SYSTEMS excludes reproductive, so mats.get('reproductive') is undefined; Three.js would draw them with default material lacking partVisible shader)
    if (p.system === 'reproductive') return;
    // Optional: skip parts whose name contains "penis" (penis vessels under arterial/venous)
    if (p.name.toLowerCase().includes('penis')) return;
    // Body surface / Skin geometry is now allowed to load; visibility is controlled by state.visible and shaders
    // if (p.system === 'integumentary' || p.name === 'Skin') return;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,p.positions,p.vertexCount*3),3));
    g.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,p.normals,p.vertexCount*3),3,true));g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,p.indices,p.indexCount),1));
    g.boundingBox=bounds[i].clone();g.computeBoundingSphere();const pick=new T.Mesh(g);pick.matrixAutoUpdate=false;pickers[i]=pick;geometries.push(g);
    g.setAttribute('partIndex',new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i),1));
    const list=groups.get(p.system)??[];list.push(g);groups.set(p.system,list);
   });
   groups.forEach((gs,system)=>{
    const mat=mats.get(system as never);
    // FIX 1b: in groups.forEach mesh creation, if no mat for system, return instead of adding a default-material mesh
    // (Three.js would otherwise instantiate the mesh with a default material lacking custom shader uniforms, causing it to ignore visibility toggles)
    if(!mat)return;
    const geometry=mergeGeometries(gs,false);if(!geometry)throw new Error('Could not assemble anatomy geometry.');geometries.push(geometry);const mesh=new T.Mesh(geometry,mat);mesh.frustumCulled=false;scene.add(mesh);
   });
   lastState=null;loaded++;onProgress(Math.round(loaded/atlas.chunks.length*100));dirty=true;
  };
  (async()=>{try{let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<atlas.chunks.length){const i=cursor++;await loadChunk(i);}}));if(!disposed){ready=true;dirty=true;}}catch(e){if(!disposed)onError(e instanceof Error?e.message:'Could not load the anatomy.');}})();
  
  const fit=(view:string,extent=0)=>{
   const aspect=camera.aspect,mobile=el.clientWidth<768,normalDistance=mobile?Math.max(4.5,1.8*el.clientHeight/Math.max(160,el.clientHeight-350)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))):4;
   const reservedHeight=mobile?350:270;const availableAspect=Math.max(.35,(el.clientWidth-(mobile?40:340))/Math.max(160,el.clientHeight-reservedHeight));const atlasDistance=Math.max(packingHeight,packingWidth/availableAspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*(el.clientHeight/Math.max(160,el.clientHeight-reservedHeight))*1.08;
   let distance=T.MathUtils.lerp(normalDistance,Math.max(.2,atlasDistance),extent);if(extent>.8)view='front';
   
   // If headFocus, trigeminal, smas, or dental overlay is active and not exploding, focus on the head region
   if((latest.current.headFocus||latest.current.clinicalOverlay||latest.current.nervousOverlay||latest.current.smasOverlay||latest.current.dentalOverlay)&&extent<.1){
    const isDental = !!latest.current.dentalOverlay;
    // const face=latest.current.smasOverlay?(latest.current.smasSide||'left'):latest.current.dentalOverlay?(latest.current.dentalSide||'left'):(latest.current.nervousSide||'left');
    const face=latest.current.clinicalOverlay&&latest.current.clinicalSide
     ? latest.current.clinicalSide
     : latest.current.smasOverlay?(latest.current.smasSide||'left'):latest.current.dentalOverlay?(latest.current.dentalSide||'left'):(latest.current.nervousSide||'left');
    // const headDirection=face==='right'?new T.Vector3(-.45,.1,1).normalize():new T.Vector3(.45,.1,1).normalize();
    // const headTarget=new T.Vector3(0,1.58,0.03);
    // const headDistance=mobile?0.48:0.38;
    const headDirection=isDental
     ? (face==='right'?new T.Vector3(-.35,.05,.93).normalize():face==='left'?new T.Vector3(.35,.05,.93).normalize():new T.Vector3(.25,.03,.96).normalize())
     : (face==='right'?new T.Vector3(-.45,.1,1).normalize():new T.Vector3(.45,.1,1).normalize());
    const headTarget=isDental ? new T.Vector3(0,1.534,0.035) : new T.Vector3(0,1.58,0.03);
    const headDistance=isDental ? (mobile?0.32:0.24) : (mobile?0.48:0.38);
    controls.target.copy(headTarget);
    const dir=view==='front'?new T.Vector3(0,.02,1):view==='side'?(face==='right'?new T.Vector3(-1,.02,0):new T.Vector3(1,.02,0)):view==='back'?new T.Vector3(0,.02,-1):headDirection;
    camera.position.copy(headTarget).addScaledVector(dir,headDistance);
    controls.update();dirty=true;return;
   }

   const direction=view==='front'?new T.Vector3(0,.02,1):view==='back'?new T.Vector3(0,.02,-1):view==='side'?new T.Vector3(1,.02,0):new T.Vector3(.35,.06,1).normalize();
   controls.target.set(extent>.1&&el.clientWidth>767?-packingWidth*.12:0,extent>.1||mobile?.85:.68,0);camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();dirty=true;
  };

  const updateNerveLabels=()=>{
   if(!latest.current.nervousOverlay||amount>.2||!latest.current.nervousSelection){labels.hidden=true;return;}
   const sel=latest.current.nervousSelection;
   const active=getActiveOverlays();
   const allAnchors=active.flatMap(o=>o.labelAnchors());
   const show=allAnchors.filter(a=>{
    if(a.kind==='ganglion')return latest.current.nervousLayers.cnv;
    if(a.kind!=='zone')return false;
    if(!partEnabled(latest.current.nervousLayers,a.id as OverlayPartId))return false;
    return sel.kind==='ganglion'||sel.id===a.id;
   });
   labels.hidden=false;
   if(labels.childElementCount!==show.length){
    labels.replaceChildren();
    show.forEach(a=>{const n=document.createElement('div');n.className='nerve-label';n.dataset.id=a.id;n.textContent=a.label;labels.appendChild(n);});
   }
   Array.from(labels.children).forEach((node,i)=>{
    const a=show[i],elNode=node as HTMLElement;if(!a)return;
    projectedLabel.copy(a.world).project(camera);
    if(projectedLabel.z<-1||projectedLabel.z>1){elNode.hidden=true;return;}
    elNode.hidden=false;
    elNode.style.left=`${(projectedLabel.x+1)*el.clientWidth/2}px`;
    elNode.style.top=`${(1-projectedLabel.y)*el.clientHeight/2}px`;
   });
  };

  const updateClinicalLabels=()=>{
   if(!latest.current.clinicalOverlay||amount>.2||latest.current.isolate){clinicalLabels.hidden=true;return;}
    const show=clinicalHandle.labelAnchors();
    const isGlowOn=latest.current.clinicalGlow??true;
    clinicalLabels.hidden=false;
    if(clinicalLabels.childElementCount!==show.length){
     clinicalLabels.replaceChildren();
     show.forEach(a=>{
      const n=document.createElement('div');
      n.className='clinical-label';
      n.dataset.id=a.id;
      n.dataset.kind=a.kind;
      n.dataset.glow=isGlowOn?'true':'false';
      n.textContent=a.label;
      clinicalLabels.appendChild(n);
     });
    }else{
     Array.from(clinicalLabels.children).forEach((node,i)=>{
      const a=show[i],elNode=node as HTMLElement;
      if(!a)return;
      if(elNode.dataset.id!==a.id||elNode.textContent!==a.label||elNode.dataset.kind!==a.kind){
       elNode.dataset.id=a.id;
       elNode.dataset.kind=a.kind;
       elNode.textContent=a.label;
      }
      elNode.dataset.glow=isGlowOn?'true':'false';
     });
    }
   Array.from(clinicalLabels.children).forEach((node,i)=>{
    const a=show[i],elNode=node as HTMLElement;if(!a)return;
    projectedLabel.copy(a.world).project(camera);
    if(projectedLabel.z<-1||projectedLabel.z>1){elNode.hidden=true;return;}
    elNode.hidden=false;
    // elNode.style.left=`${(projectedLabel.x+1)*el.clientWidth/2}px`;
    // elNode.style.top=`${(1-projectedLabel.y)*el.clientHeight/2}px`;
    const rawX=(projectedLabel.x+1)*el.clientWidth/2;
    const rawY=(1-projectedLabel.y)*el.clientHeight/2;
    const half=Math.max(72,elNode.offsetWidth/2+10);
    const x=Math.min(Math.max(half,rawX),Math.max(half,el.clientWidth-half));
    const y=Math.min(Math.max(elNode.offsetHeight+18,rawY),Math.max(elNode.offsetHeight+18,el.clientHeight-28));
    elNode.style.left=`${x}px`;
    elNode.style.top=`${y}px`;
   });
  };

  const resize=()=>{layoutKey='';lastState=null;renderer.setPixelRatio(Math.min(devicePixelRatio,el.clientWidth<768||el.clientHeight<600?1.5:2));camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);fit(latest.current.view,amount);};const observer=new ResizeObserver(resize);observer.observe(el);
  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),tap=new PointerTap(),worldBox=new T.Box3(),hitPoint=new T.Vector3();
  const down=(e:PointerEvent)=>{hover.hidden=true;tap.down(e.pointerId,e.clientX,e.clientY,e.pointerType==='touch'?12:5);};
  const move=(e:PointerEvent)=>{tap.move(e.pointerId,e.clientX,e.clientY);if(e.buttons||e.pointerType==='touch'){hover.hidden=true;return;}
   const rect=el.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
   if(latest.current.smasOverlay&&amount<.2){
    const live=getActiveSmasOverlays();
    if(live.length){
     pointer.set(x/rect.width*2-1,-(y/rect.height)*2+1);
     raycaster.setFromCamera(pointer,camera);
     const hit=raycaster.intersectObjects(live.flatMap(o=>o.pickables.filter(p=>p.visible)),true)[0];
     if(hit){
      let rec:SmasSelection|null=null;
      for(const o of live){rec=o.resolve(hit.object);if(rec)break;}
      hover.hidden=!rec;renderer.domElement.style.cursor=rec?'pointer':'grab';
      if(rec){
       hover.textContent=smasHoverLabel(rec);
       hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;
       hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;
      }
      return;
     }
    }
   }
   if(latest.current.nervousOverlay&&amount<.2){
    const live=getActiveOverlays();
    if(live.length){
     pointer.set(x/rect.width*2-1,-(y/rect.height)*2+1);
     raycaster.setFromCamera(pointer,camera);
     const hit=raycaster.intersectObjects(live.flatMap(o=>o.pickables.filter(p=>p.visible)),true)[0];
     if(hit){
      let rec:NervousSelection|null=null;
      for(const o of live){rec=o.resolve(hit.object);if(rec)break;}
      hover.hidden=!rec;renderer.domElement.style.cursor=rec?'pointer':'grab';
      if(rec){
       hover.textContent=rec.kind==='zone'?'Dermatome zone':rec.kind==='ganglion'?'Trigeminal ganglion':'Trigeminal branch';
       hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;
       hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;
      }
      return;
     }
    }
   }
   if(amount<.5){hover.hidden=true;return;}const index=findTarget(x,y,12);hover.hidden=index<0;renderer.domElement.style.cursor=index<0?'grab':'pointer';if(index>=0){hover.textContent=atlas.parts[index].name;hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;}};
  const cancel=(e:PointerEvent)=>tap.cancel(e.pointerId);
  const up=(e:PointerEvent)=>{
   const validTap=tap.up(e.pointerId,e.clientX,e.clientY);if(!validTap||!ready)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
   const smasLive=getActiveSmasOverlays();
   if(latest.current.smasOverlay&&amount<.2&&smasLive.length){
    const hits=raycaster.intersectObjects(smasLive.flatMap(o=>o.pickables.filter(p=>p.visible)),true);
    if(hits[0]){
     let rec:SmasSelection|null=null;
     for(const o of smasLive){rec=o.resolve(hits[0].object);if(rec)break;}
     if(rec){hover.hidden=true;smasSelect.current?.(rec);return;}
    }
   }
   const nervousLive=getActiveOverlays();
   if(latest.current.nervousOverlay&&amount<.2&&nervousLive.length){
    const hits=raycaster.intersectObjects(nervousLive.flatMap(o=>o.pickables.filter(p=>p.visible)),true);
    if(hits[0]){
     let rec:NervousSelection|null=null;
     for(const o of nervousLive){rec=o.resolve(hits[0].object);if(rec)break;}
     if(rec){hover.hidden=true;nervousSelect.current?.(rec);return;}
    }
   }
    // let nearest=Infinity,found=-1;const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>.5);
    // pickers.forEach((mesh,i)=>{if(!mesh||data[i*4+3]<.5||(hasSolid&&atlas.parts[i].system==='integumentary'))return;worldBox.copy(bounds[i]).translate(mesh.position);if(!raycaster.ray.intersectBox(worldBox,hitPoint))return;const hits=raycaster.intersectObject(mesh,false);if(hits[0]&&hits[0].distance<nearest){nearest=hits[0].distance;found=i;}});
    let nearest=Infinity,found=-1;const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>0.05);
    const isSkelSagittal = (latest.current.activePill === 'skeleton');
    const skelSide = latest.current.skeletonSide ?? latest.current.bodySide ?? 'both';
    pickers.forEach((mesh,i)=>{
     if(!mesh||data[i*4+3]<0.05||(hasSolid&&atlas.parts[i].system==='integumentary'))return;
     worldBox.copy(bounds[i]).translate(mesh.position);
     if(!raycaster.ray.intersectBox(worldBox,hitPoint))return;
     const hits=raycaster.intersectObject(mesh,false);
     if(hits[0]){
      if(isSkelSagittal && skelSide==='right' && hits[0].point.x > 0) return;
      if(isSkelSagittal && skelSide==='left' && hits[0].point.x < 0) return;
      if(hits[0].distance<nearest){nearest=hits[0].distance;found=i;}
     }
    });
   if(found<0&&amount>.45)found=findTarget(e.clientX-rect.left,e.clientY-rect.top,e.pointerType==='touch'?24:16);if(found>=0){hover.hidden=true;select.current(atlas.parts[found].id);}
  };
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);
  const clock=new T.Clock();let lastExtent=-1;
  const animate=()=>{
   if(disposed)return;frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),s=latest.current;
   const changed=lastState?.visible!==s.visible||lastState?.selected!==s.selected||lastState?.isolate!==s.isolate||lastState?.headFocus!==s.headFocus||lastState?.bodySide!==s.bodySide||lastState?.skeletonSide!==s.skeletonSide||lastState?.nervousOverlay!==s.nervousOverlay||lastState?.nervousLayers!==s.nervousLayers||lastState?.nervousSide!==s.nervousSide||lastState?.nervousSelection!==s.nervousSelection||lastState?.smasOverlay!==s.smasOverlay||lastState?.smasLayers!==s.smasLayers||lastState?.smasSide!==s.smasSide||lastState?.smasSelection!==s.smasSelection||lastState?.faceMuscleLayers!==s.faceMuscleLayers||lastState?.dentalOverlay!==s.dentalOverlay||lastState?.dentalLayers!==s.dentalLayers||lastState?.dentalSide!==s.dentalSide||lastState?.clinicalOverlay!==s.clinicalOverlay||lastState?.clinicalGlow!==s.clinicalGlow||lastState?.clinicalHighlightPartIds!==s.clinicalHighlightPartIds||lastState?.clinicalSide!==s.clinicalSide||lastState?.isSelectiveSliceActive!==s.isSelectiveSliceActive||lastState?.activePill!==s.activePill;
   const moving=Math.abs(amount-s.explode)>.0001;
   if(moving){amount=T.MathUtils.damp(amount,s.explode,8,dt);dirty=true;}

   // Sync sagittal clipping for Skeleton & Soft Tissue mode
   const isSkeletonPill = (s.activePill === 'skeleton');
   const skelSide = s.skeletonSide ?? s.bodySide ?? 'both';
   let targetSagittalClip = 0.0;
   if (isSkeletonPill) {
    if (skelSide === 'right') targetSagittalClip = 1.0;
    else if (skelSide === 'left') targetSagittalClip = -1.0;
   }
   if (sagittalClipUniform.value !== targetSagittalClip) {
    sagittalClipUniform.value = targetSagittalClip;
    if (targetSagittalClip === 1.0) {
     activeSagittalPlane.copy(clipPlaneRight);
    } else if (targetSagittalClip === -1.0) {
     activeSagittalPlane.copy(clipPlaneLeft);
    } else {
     activeSagittalPlane.copy(clipPlaneDisabled);
    }
    dirty = true;
   }
   
   // Sync trigeminal overlay visibility & layers
   const side=s.nervousSide||'left';
   const anyNervousOn=s.nervousLayers?Object.values(s.nervousLayers).some(Boolean):false;
   const overlayOn=s.nervousOverlay&&anyNervousOn&&amount<.2;
   leftHandle.setVisible(overlayOn&&(side==='left'||side==='both'));
   rightHandle.setVisible(overlayOn&&(side==='right'||side==='both'));
   leftHandle.setLayers(s.nervousLayers);
   rightHandle.setLayers(s.nervousLayers);
   leftHandle.setSelection(s.nervousSelection);
   rightHandle.setSelection(s.nervousSelection);

   // Sync smas overlay visibility & layers
   const smasSide=s.smasSide||'left';
   const anySmasOn=s.smasLayers?Object.values(s.smasLayers).some(Boolean):false;
   const smasOverlayOn=s.smasOverlay&&anySmasOn&&amount<.2;
   if(smasLeft){
    smasLeft.setVisible(!!(smasOverlayOn&&(smasSide==='left'||smasSide==='both')));
    if(s.smasLayers)smasLeft.setLayers(s.smasLayers);
    smasLeft.setSelection(s.smasSelection??null);
   }
   if(smasRight){
    smasRight.setVisible(!!(smasOverlayOn&&(smasSide==='right'||smasSide==='both')));
    if(s.smasLayers)smasRight.setLayers(s.smasLayers);
    smasRight.setSelection(s.smasSelection??null);
   }

   // Sync face muscles overlay visibility & layers
   const anyFaceMuscleOn=s.faceMuscleLayers?Object.values(s.faceMuscleLayers).some(Boolean):false;
   const faceMusclesOverlayOn=!!s.smasOverlay&&anyFaceMuscleOn&&amount<.2;
   faceMusclesLeft.setVisible(!!(faceMusclesOverlayOn&&(smasSide==='left'||smasSide==='both')));
   faceMusclesRight.setVisible(!!(faceMusclesOverlayOn&&(smasSide==='right'||smasSide==='both')));
   if(s.faceMuscleLayers){
    faceMusclesLeft.setLayers(s.faceMuscleLayers);
    faceMusclesRight.setLayers(s.faceMuscleLayers);
   }

   // Sync wisdom teeth overlay (3rd molars)
   const dentalSide=s.dentalSide||'left';
   const anyDentalOn=s.dentalLayers?Object.values(s.dentalLayers).some(Boolean):false;
   const dentalOverlayOn=!!s.dentalOverlay&&anyDentalOn&&amount<.2;
   wisdomTeethHandle.setVisible(dentalOverlayOn);
   if(s.dentalLayers){
    wisdomTeethHandle.setLayers(s.dentalLayers,dentalSide);
   }

   const clinicalOverlayOn=!!s.clinicalOverlay&&amount<.2&&!s.isolate;
   const isClinicalGlowOn=s.clinicalGlow??true;
   clinicalHandle.setActiveCase(s.activeClinicalCaseId);
   clinicalHandle.setVisible(clinicalOverlayOn);
   
   const clinicalCase = s.activeClinicalCaseId ? getClinicalCaseById(s.activeClinicalCaseId) : undefined;
   clinicalHandle.setFlags({
    fractureLines:clinicalOverlayOn&&(clinicalCase?.showFractureLines??false),
    hemosinus:clinicalOverlayOn&&(clinicalCase?.showHemosinus??false),
    granuloma:clinicalOverlayOn&&(clinicalCase?.showGranuloma??false),
    glow:isClinicalGlowOn,
   });
   if(clinicalOverlayOn&&isClinicalGlowOn){
    clinicalHandle.tick(clock.elapsedTime);
    dirty=true;
   }

   const hasAnyMeshVisible = (s.visible.length > 0 || overlayOn || smasOverlayOn || faceMusclesOverlayOn || dentalOverlayOn || clinicalOverlayOn);

   // Adjust material opacity for subtle skeletal + skin rendering in trigeminal / face / dental mode
   const skelMat=mats.get('skeletal');
   if(skelMat instanceof T.MeshStandardMaterial){
    // const targetOpacity=(s.nervousOverlay||s.smasOverlay)?0.42:1.0;
    // if(skelMat.opacity!==targetOpacity){skelMat.opacity=targetOpacity;skelMat.transparent=!!(s.nervousOverlay||s.smasOverlay);skelMat.needsUpdate=true;dirty=true;}
    const isOverlaySkel = !!(s.nervousOverlay || s.smasOverlay || s.dentalOverlay);
    const targetOpacity = (s.nervousOverlay || s.smasOverlay) ? 0.42 : 1.0;
    const targetTransparent = isOverlaySkel;
    const targetDepthWrite = !isOverlaySkel;
    if(skelMat.opacity!==targetOpacity || skelMat.transparent!==targetTransparent || skelMat.depthWrite!==targetDepthWrite){
     skelMat.opacity=targetOpacity;
     skelMat.transparent=targetTransparent;
     skelMat.depthWrite=targetDepthWrite;
     skelMat.needsUpdate=true;
     dirty=true;
    }
   }
   const skinMat=mats.get('integumentary');
   if(skinMat instanceof T.MeshStandardMaterial){
    // const targetOpacity=(s.nervousOverlay||s.smasOverlay)?0.18:0.1;
    const targetOpacity=(s.nervousOverlay||s.smasOverlay)?0.18:s.dentalOverlay?0.08:0.1;
    if(skinMat.opacity!==targetOpacity){skinMat.opacity=targetOpacity;skinMat.needsUpdate=true;dirty=true;}
   }

   if(changed||moving||lastExtent<0){
    const visible=new Set(s.visible),selection=new Set(s.selected);
    const isSelective = s.isSelectiveSliceActive ?? (s.activePill === 'all' || s.activePill === 'organs');
    const isSkeletonPill = (s.activePill === 'skeleton');
    const skelSide = s.skeletonSide ?? s.bodySide ?? 'both';
    const visibleParts=atlas.parts.filter(p=>{
     if(isSuppressedAnatomy(p))return false;
     if(s.isolate)return selection.has(p.id);
     if(selection.has(p.id))return true;
     if(s.dentalOverlay&&isDentalStructure(p)){
      return partMatchesDental(p,s.dentalLayers??DEFAULT_DENTAL_LAYERS,s.dentalSide??'both');
     }
     if(isSkeletonPill){
      return visible.has(p.system) && partMatchesSkeletonSagittal(p, skelSide);
     }
     return visible.has(p.system) && partMatchesSideWithSelectiveRule(p, s.bodySide ?? 'both', isSelective);
    });
    const nextLayoutKey=visibleParts.map(p=>p.id).join(',')+':'+camera.aspect.toFixed(3);
    if(nextLayoutKey!==layoutKey){const layout=createExplosionLayout(visibleParts,camera.aspect);packingWidth=layout.width;packingHeight=layout.height;atlas.parts.forEach((p,i)=>{const cell=layout.cells.get(p.id);offsets[i]=cell?new T.Vector3(cell.x,cell.y+.85,0):centers[i].clone();});layoutKey=nextLayoutKey;if(amount>.05&&!s.isolate)fit(s.view,Math.max(0,(amount-.3)/.7));}

    atlas.parts.forEach((p,i)=>{
     const c=centers[i],destination=offsets[i];let dx=0,dy=0,dz=0;
     if(amount<=.45){const t=amount/.45;const group=SYSTEMS.findIndex(sys=>sys.id===p.system);const angle=group/SYSTEMS.length*Math.PI*2;dx=Math.sin(angle)*t*.48;dy=(c.y-.85)*t*.28;dz=Math.cos(angle)*t*.48;}
     else {const t=(amount-.45)/.55,group=SYSTEMS.findIndex(sys=>sys.id===p.system),angle=group/SYSTEMS.length*Math.PI*2;dx=T.MathUtils.lerp(Math.sin(angle)*.48,destination.x-c.x,t);dy=T.MathUtils.lerp((c.y-.85)*.28,destination.y-c.y,t);dz=T.MathUtils.lerp(Math.cos(angle)*.48,-c.z,t);}
      const selected=selection.has(p.id);
      // let isPartVisible=false;
      // if(isSuppressedAnatomy(p)){isPartVisible=false;}
      // else if(s.isolate){isPartVisible=selected;}
      // else if(selected){isPartVisible=true;}
      // else if(s.dentalOverlay&&isDentalStructure(p)){
      //  isPartVisible=partMatchesDental(p,s.dentalLayers??DEFAULT_DENTAL_LAYERS,s.dentalSide??'both');
      //  } else {
      //   isPartVisible=visible.has(p.system) && partMatchesSide(p, s.bodySide ?? 'both');
      //  }
      // data.set([dx,dy,dz,isPartVisible?1:0],i*4);
      let partOpacity = 0.0;
      if(isSuppressedAnatomy(p)){
       partOpacity = 0.0;
      }else if(s.isolate){
       partOpacity = selected ? 1.0 : 0.0;
      }else if(selected){
       partOpacity = 1.0;
      }else if(s.dentalOverlay&&isDentalStructure(p)){
       const matches = partMatchesDental(p,s.dentalLayers??DEFAULT_DENTAL_LAYERS,s.dentalSide??'both');
       if(!matches){
        partOpacity = 0.0;
       }else if(isTooth(p)){
        partOpacity = 1.0;
       }else{
        partOpacity = 0.40;
       }
      }else{
       const matches = isSkeletonPill
        ? visible.has(p.system)
        : (visible.has(p.system) && partMatchesSideWithSelectiveRule(p, s.bodySide ?? 'both', isSelective));
       if(!matches){
        partOpacity = 0.0;
       }else if(s.dentalOverlay && p.system === 'skeletal'){
        partOpacity = 0.22;
       }else{
        partOpacity = 1.0;
       }
      }
      data.set([dx,dy,dz,partOpacity],i*4);
      const caseTint=s.activeClinicalCaseId?CLINICAL_CASE_HIGHLIGHT_RGBA[s.activeClinicalCaseId]:undefined;
      const clinicalRgba=s.clinicalOverlay?(caseTint?caseTint[p.id]:CLINICAL_HIGHLIGHT_RGBA[p.id]):undefined;
      if(clinicalRgba){
       selectedData.set(clinicalRgba,i*4);
      }else if(selected){
       // selectedData.set([107,217,199,191],i*4);
       selectedData.set([107,217,199,191],i*4);
      }else if(s.dentalOverlay&&isTooth(p)){
       const quad=getToothQuadrant(p);
       if(quad==='q1')selectedData.set([42,168,184,215],i*4);
       else if(quad==='q2')selectedData.set([61,175,106,215],i*4);
       else if(quad==='q3')selectedData.set([138,91,184,215],i*4);
       else if(quad==='q4')selectedData.set([224,122,95,215],i*4);
       else selectedData.set([0,0,0,0],i*4);
      }else{
       selectedData.set([0,0,0,0],i*4);
      }
      // markerPositions.set(data[i*4+3]>.5?[c.x+dx,c.y+dy,c.z+dz]:[10000,10000,10000],i*3);
      markerPositions.set(data[i*4+3]>0.05?[c.x+dx,c.y+dy,c.z+dz]:[10000,10000,10000],i*3);const mesh=pickers[i];if(mesh){mesh.position.set(dx,dy,dz);mesh.updateMatrix();mesh.updateMatrixWorld(true);}
    });partTexture.needsUpdate=true;selectionTexture.needsUpdate=true;markerGeometry.attributes.position.needsUpdate=true;lastState=s;lastExtent=amount;dirty=true;
   }
   const fractureBurn=clinicalOverlayOn&&(clinicalCase?.showFractureLines??false);
   if(fractureBurn&&isClinicalGlowOn){
    const elapsed=clock.elapsedTime;
    const heat=0.62+0.38*(0.5+0.5*Math.sin(elapsed*2.35))+0.08*Math.sin(elapsed*11.2);
    for(const i of burnPartIndices){
     const base=CLINICAL_HIGHLIGHT_RGBA[atlas.parts[i].id];
     if(!base)continue;
     const r=Math.min(255,Math.round(base[0]+(255-base[0])*heat*0.35));
     const g=Math.min(255,Math.round(base[1]+90*heat));
     const b=Math.min(255,Math.round(base[2]+18*heat));
     const a=Math.min(255,Math.round(base[3]*(0.78+0.22*heat)));
     selectedData.set([r,g,b,a],i*4);
    }
    selectionTexture.needsUpdate=true;
   }else if(fractureBurn&&!isClinicalGlowOn&&lastState?.clinicalGlow){
    for(const i of burnPartIndices){
     const base=CLINICAL_HIGHLIGHT_RGBA[atlas.parts[i].id];
     if(base)selectedData.set(base,i*4);
    }
    selectionTexture.needsUpdate=true;
   }else if(!clinicalOverlayOn&&lastState?.clinicalOverlay){
    for(const i of burnPartIndices){
     selectedData.set([0,0,0,0],i*4);
    }
    selectionTexture.needsUpdate=true;
   }
   if(s.view!==lastView||s.reset!==lastReset){fit(s.view,amount);lastView=s.view;lastReset=s.reset;}
   if(moving&&!s.isolate)fit(amount>.5?'front':s.view,Math.max(0,(amount-.3)/.7));
   const isolateKey=s.isolate?s.selected.join(',')+':'+s.reset+':'+s.inspectorOpen+':'+camera.aspect:'';
   if(isolateKey!==lastIsolate||(s.isolate&&moving)){
    if(s.isolate){const box=new T.Box3();atlas.parts.forEach((p,i)=>{if(s.selected.includes(p.id))box.union(bounds[i].clone().translate(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])));});
     if(!box.isEmpty()){const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());const w=el.clientWidth,h=el.clientHeight,mobile=w<768,landscape=w>h&&h<=600;let left=20,right=w-20,top=mobile?175:110,bottom=h-170;if(s.inspectorOpen){if(landscape){right=w-335;top=100;bottom=h-125;}else if(mobile){const sheet=document.querySelector('.detail-sheet')?.getBoundingClientRect(),header=document.querySelector('.identity')?.getBoundingClientRect();top=(header?.bottom??94)+16;bottom=(sheet?.top??h*.58-139)-16;}else{right=w-370;left=w>1100?285:25;}}const availableWidth=Math.max(150,right-left),availableHeight=Math.max(40,bottom-top);camera.setViewOffset(w,h,w/2-(left+right)/2,h/2-(top+bottom)/2,w,h);const distance=Math.max(.07,Math.max(size.y*h/availableHeight,size.x*w/availableWidth/camera.aspect,size.z)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.35);controls.maxDistance=Math.max(40,distance*2);controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(.2,.1,1).normalize().multiplyScalar(distance));controls.update();dirty=true;}
    }else if(lastIsolate){camera.clearViewOffset();fit(s.view,amount);}
    lastIsolate=isolateKey;
   }
   controls.enableRotate=amount<.8;controls.mouseButtons.LEFT=amount<.8?T.MOUSE.ROTATE:T.MOUSE.PAN;controls.touches.ONE=amount<.8?T.TOUCH.ROTATE:T.TOUCH.PAN;ground.visible=platform.visible=ring.visible=innerRing.visible=hasAnyMeshVisible&&amount<.5&&!s.isolate;markers.visible=amount>.75;controls.autoRotate=s.rotate&&!s.isolate&&amount<.4;controls.autoRotateSpeed=.65;controls.update();if(controls.autoRotate)dirty=true;
   updateNerveLabels();
   updateClinicalLabels();
   // if(dirty){renderer.render(scene,camera);targets=[];if(amount>.45){const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>.5);atlas.parts.forEach((p,i)=>{if(data[i*4+3]<.5||(hasSolid&&p.system==='integumentary'))return;let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(let corner=0;corner<8;corner++){projected.set(p.bounds[(corner&1)?1:0][0]+data[i*4],p.bounds[(corner&2)?1:0][1]+data[i*4+1],p.bounds[(corner&4)?1:0][2]+data[i*4+2]).project(camera);const x=(projected.x+1)*el.clientWidth/2,y=(1-projected.y)*el.clientHeight/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}projected.copy(centers[i]).add(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])).project(camera);if(projected.z< -1||projected.z>1)return;targets.push({index:i,x:(projected.x+1)*el.clientWidth/2,y:(1-projected.y)*el.clientHeight/2,left,right,top,bottom});});}dirty=false;}
   if(dirty){renderer.render(scene,camera);targets=[];if(amount>.45){const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>0.05);atlas.parts.forEach((p,i)=>{if(data[i*4+3]<0.05||(hasSolid&&p.system==='integumentary'))return;let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(let corner=0;corner<8;corner++){projected.set(p.bounds[(corner&1)?1:0][0]+data[i*4],p.bounds[(corner&2)?1:0][1]+data[i*4+1],p.bounds[(corner&4)?1:0][2]+data[i*4+2]).project(camera);const x=(projected.x+1)*el.clientWidth/2,y=(1-projected.y)*el.clientHeight/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}projected.copy(centers[i]).add(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])).project(camera);if(projected.z< -1||projected.z>1)return;targets.push({index:i,x:(projected.x+1)*el.clientWidth/2,y:(1-projected.y)*el.clientHeight/2,left,right,top,bottom});});}dirty=false;}

  };animate();
  const contextLost=(e:Event)=>{e.preventDefault();onError('The 3D session was paused by your device. Reload to continue.');};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();leftHandle.dispose();rightHandle.dispose();smasLeft?.dispose();smasRight?.dispose();faceMusclesLeft.dispose();faceMusclesRight.dispose();wisdomTeethHandle.dispose();clinicalHandle.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.traverse(o=>{if(o instanceof T.Mesh&&!geometries.includes(o.geometry)){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});env.dispose();partTexture.dispose();selectionTexture.dispose();markerGeometry.dispose();markerMaterial.dispose();hover.remove();labels.remove();clinicalLabels.remove();renderer.dispose();renderer.domElement.remove();};
 },[atlas]);
 return <div className="scene" ref={host}/>;
}
