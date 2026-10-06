/**
 * clinical-reconstruction-scene.ts
 * Teaching overlay for the active 3D CT FACE reconstruction
 * (right zygomatic body fracture, small lateral orbital wall fracture,
 * deformed right zygomatic arch, anterior and lateral maxillary sinus walls).
 * The previous NCCT HEAD sticks (inferior orbit, postero-lateral and superior antrum, hemosinus, granuloma)
 * stay in this file and are drawn when that case is selected.
 * Positions are BodyParts3D metres: +Y cranial, +Z anterior, +X patient left. Right side is −X.
 */

import * as T from 'three';

export interface ClinicalReconstructionFlags {
  fractureLines: boolean;
  hemosinus: boolean;
  granuloma: boolean;
  glow?: boolean;
}

export interface ClinicalLabelAnchor {
  id: string;
  label: string;
  world: T.Vector3;
  kind: 'fracture' | 'hemosinus' | 'granuloma' | 'normal' | 'lesion';
}

export interface ClinicalReconstructionHandle {
  group: T.Group;
  setActiveCase: (caseId?: string) => void;
  setVisible: (v: boolean) => void;
  setFlags: (flags: ClinicalReconstructionFlags) => void;
  labelAnchors: () => ClinicalLabelAnchor[];
  tick: (elapsed: number) => void;
  dispose: () => void;
}

const FRACTURE_COLOR = 0xdc1f2a;
const HEMOSINUS_COLOR = 0xb01018;
const GRANULOMA_COLOR = 0xddd4b8;

function segmentMesh(
  a: [number, number, number],
  b: [number, number, number],
  material: T.Material,
  radius = 0.00145,
): T.Mesh {
  const start = new T.Vector3(a[0], a[1], a[2]);
  const end = new T.Vector3(b[0], b[1], b[2]);
  const dir = end.clone().sub(start);
  const length = Math.max(dir.length(), 0.002);
  const geom = new T.CylinderGeometry(radius, radius, length, 7);
  const mesh = new T.Mesh(geom, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  mesh.renderOrder = 12;
  return mesh;
}

export function mountClinicalReconstruction(parent: T.Group): ClinicalReconstructionHandle {
  const group = new T.Group();
  group.name = 'clinical-reconstruction-overlay';
  group.visible = false;
  parent.add(group);

  const geometries: T.BufferGeometry[] = [];
  const materials: T.Material[] = [];

  const fractureMat = new T.MeshStandardMaterial({
    color: FRACTURE_COLOR,
    emissive: FRACTURE_COLOR,
    emissiveIntensity: 0.55,
    roughness: 0.38,
    metalness: 0.06,
    transparent: true,
    opacity: 0.98,
    depthTest: false,
    depthWrite: false,
  });
  materials.push(fractureMat);
  const glowMat = new T.MeshBasicMaterial({
    color: 0xff4a18,
    transparent: true,
    opacity: 0.28,
    blending: T.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    side: T.DoubleSide,
  });
  materials.push(glowMat);

  // --- Case 1: ncct-head-20260921-right-zmc ---
  const fractureGroup1 = new T.Group();
  fractureGroup1.name = 'clinical-fracture-lines-case1';
  fractureGroup1.visible = false;
  const segments1: Array<{a:[number, number, number]; b:[number, number, number]; radius?:number; glow?:number}> = [
    {a:[-0.05, 1.586, 0.048], b:[-0.06, 1.574, 0.026]},
    {a:[-0.06, 1.574, 0.026], b:[-0.066, 1.568, 0.01]},
    {a:[-0.046, 1.612, 0.046], b:[-0.049, 1.592, 0.044]},
    {a:[-0.042, 1.59, 0.05], b:[-0.018, 1.586, 0.064]},
    {a:[-0.024, 1.572, 0.08], b:[-0.012, 1.552, 0.074]},
    {a:[-0.046, 1.572, 0.046], b:[-0.04, 1.55, 0.034]},
    {a:[-0.038, 1.586, 0.052], b:[-0.016, 1.584, 0.062]},
  ];
  segments1.forEach(seg => {
    const mesh = segmentMesh(seg.a, seg.b, fractureMat, seg.radius ?? 0.00145);
    geometries.push(mesh.geometry);
    fractureGroup1.add(mesh);
    const glow = segmentMesh(seg.a, seg.b, glowMat, seg.glow ?? 0.0036);
    geometries.push(glow.geometry);
    fractureGroup1.add(glow);
  });
  group.add(fractureGroup1);

  const anchors1: ClinicalLabelAnchor[] = [
    {id: "fx-zygoma", label: "R zygomatic arch #", world: new T.Vector3(-0.06, 1.574, 0.026), kind: 'fracture'},
    {id: "fx-orbit", label: "R orbital walls #", world: new T.Vector3(-0.04, 1.598, 0.05), kind: 'fracture'},
    {id: "fx-antrum", label: "R antrum # \u00b7 hemosinus", world: new T.Vector3(-0.027, 1.56, 0.056), kind: 'hemosinus'},
    {id: "granuloma", label: "L frontal granuloma", world: new T.Vector3(0.029, 1.664, 0.036), kind: 'granuloma'},
  ];

  // --- Case 2: ct-face-3d-20180218-right-zygoma ---
  const fractureGroup2 = new T.Group();
  fractureGroup2.name = 'clinical-fracture-lines-case2';
  fractureGroup2.visible = false;
  const segments2: Array<{a:[number, number, number]; b:[number, number, number]; radius?:number; glow?:number}> = [
    {a:[-0.055, 1.592, 0.05], b:[-0.04, 1.578, 0.056]},
    {a:[-0.048, 1.6, 0.044], b:[-0.038, 1.586, 0.054]},
    {a:[-0.0435, 1.607, 0.049], b:[-0.0465, 1.599, 0.046], radius:0.0009, glow:0.0022},
    {a:[-0.05, 1.584, 0.044], b:[-0.058, 1.566, 0.028]},
    {a:[-0.058, 1.566, 0.028], b:[-0.066, 1.574, 0.012]},
    {a:[-0.026, 1.572, 0.08], b:[-0.014, 1.554, 0.072]},
    {a:[-0.044, 1.578, 0.056], b:[-0.041, 1.554, 0.044]},
  ];
  segments2.forEach(seg => {
    const mesh = segmentMesh(seg.a, seg.b, fractureMat, seg.radius ?? 0.00145);
    geometries.push(mesh.geometry);
    fractureGroup2.add(mesh);
    const glow = segmentMesh(seg.a, seg.b, glowMat, seg.glow ?? 0.0036);
    geometries.push(glow.geometry);
    fractureGroup2.add(glow);
  });
  group.add(fractureGroup2);

  const anchors2: ClinicalLabelAnchor[] = [
    {id: "fx-zygoma-body", label: "R zygomatic bone #", world: new T.Vector3(-0.048, 1.596, 0.052), kind: 'fracture'},
    {id: "fx-orbit-lat", label: "R lateral orbit # \u00b7 small", world: new T.Vector3(-0.045, 1.612, 0.048), kind: 'fracture'},
    {id: "fx-arch-def", label: "R zygomatic arch deformed", world: new T.Vector3(-0.058, 1.566, 0.028), kind: 'fracture'},
    {id: "fx-sinus", label: "R maxillary sinus ant. + lat. walls #", world: new T.Vector3(-0.026, 1.562, 0.072), kind: 'fracture'},
  ];

  // --- Case 3: xray-pns-om-20190608-normal ---
  const fractureGroup3 = new T.Group();
  fractureGroup3.name = 'clinical-fracture-lines-case3';
  fractureGroup3.visible = false;
  const segments3: Array<{a:[number, number, number]; b:[number, number, number]; radius?:number; glow?:number}> = [
  ];
  segments3.forEach(seg => {
    const mesh = segmentMesh(seg.a, seg.b, fractureMat, seg.radius ?? 0.00145);
    geometries.push(mesh.geometry);
    fractureGroup3.add(mesh);
    const glow = segmentMesh(seg.a, seg.b, glowMat, seg.glow ?? 0.0036);
    geometries.push(glow.geometry);
    fractureGroup3.add(glow);
  });
  group.add(fractureGroup3);

  const normalMat = new T.MeshStandardMaterial({
    color: 0x1f8f72,
    emissive: 0x14614c,
    emissiveIntensity: 0.22,
    roughness: 0.42,
    metalness: 0.04,
    transparent: true,
    opacity: 0.82,
    depthTest: false,
    depthWrite: false,
  });
  materials.push(normalMat);
  const normalSphere = new T.SphereGeometry(1, 16, 12);
  geometries.push(normalSphere);

  const normalGroup3 = new T.Group();
  normalGroup3.name = 'clinical-normal-markers-case3';
  normalGroup3.visible = false;
  { const mesh = new T.Mesh(normalSphere, normalMat); mesh.position.set(-0.026, 1.56, 0.052); mesh.scale.setScalar(0.0062); mesh.renderOrder = 12; normalGroup3.add(mesh); }
  { const mesh = new T.Mesh(normalSphere, normalMat); mesh.position.set(0.022, 1.56, 0.05); mesh.scale.setScalar(0.0062); mesh.renderOrder = 12; normalGroup3.add(mesh); }
  { const mesh = new T.Mesh(normalSphere, normalMat); mesh.position.set(0.0, 1.616, 0.064); mesh.scale.setScalar(0.0056); mesh.renderOrder = 12; normalGroup3.add(mesh); }
  { const mesh = new T.Mesh(normalSphere, normalMat); mesh.position.set(-0.036, 1.605, 0.058); mesh.scale.setScalar(0.0052); mesh.renderOrder = 12; normalGroup3.add(mesh); }
  { const mesh = new T.Mesh(normalSphere, normalMat); mesh.position.set(0.036, 1.605, 0.058); mesh.scale.setScalar(0.0052); mesh.renderOrder = 12; normalGroup3.add(mesh); }
  { const septum = segmentMesh([0, 1.566, 0.078], [0, 1.588, 0.082], normalMat, 0.00115); geometries.push(septum.geometry); normalGroup3.add(septum); }
  group.add(normalGroup3);

  const anchors3: ClinicalLabelAnchor[] = [
    {id: "pns-r-max", label: "R maxillary normal", world: new T.Vector3(-0.024, 1.534, 0.086), kind: 'normal'},
    {id: "pns-l-max", label: "L maxillary normal", world: new T.Vector3(0.026, 1.534, 0.086), kind: 'normal'},
    {id: "pns-frontal", label: "Frontal sinus normal", world: new T.Vector3(0, 1.638, 0.078), kind: 'normal'},
    {id: "pns-septum", label: "Septum midline", world: new T.Vector3(0.0, 1.566, 0.102), kind: 'normal'},
    {id: "pns-r-orbit", label: "R orbit normal", world: new T.Vector3(-0.034, 1.622, 0.07), kind: 'normal'},
    {id: "pns-l-orbit", label: "L orbit normal", world: new T.Vector3(0.036, 1.622, 0.07), kind: 'normal'},
  ];

  // --- Case 4: mri-nose-pns-20190611-inf-turbinates ---
  const fractureGroup4 = new T.Group();
  fractureGroup4.name = 'clinical-fracture-lines-case4';
  fractureGroup4.visible = false;
  const segments4: Array<{a:[number, number, number]; b:[number, number, number]; radius?:number; glow?:number}> = [
  ];
  segments4.forEach(seg => {
    const mesh = segmentMesh(seg.a, seg.b, fractureMat, seg.radius ?? 0.00145);
    geometries.push(mesh.geometry);
    fractureGroup4.add(mesh);
    const glow = segmentMesh(seg.a, seg.b, glowMat, seg.glow ?? 0.0036);
    geometries.push(glow.geometry);
    fractureGroup4.add(glow);
  });
  group.add(fractureGroup4);

  const anchors4: ClinicalLabelAnchor[] = [
    {id: "mri-r-it", label: "R inferior turbinate \u00b7 mild prominence", world: new T.Vector3(-0.015, 1.559, 0.058), kind: 'lesion'},
    {id: "mri-l-it", label: "L inferior turbinate \u00b7 mild prominence", world: new T.Vector3(0.014, 1.574, 0.058), kind: 'lesion'},
    {id: "mri-sinuses", label: "Sinuses clear \u00b7 walls intact", world: new T.Vector3(0, 1.638, 0.078), kind: 'normal'},
    {id: "mri-septum", label: "Septum \u00b7 no deviation", world: new T.Vector3(0, 1.584, 0.096), kind: 'normal'},
    {id: "mri-cribriform", label: "Cribriform intact", world: new T.Vector3(0, 1.606, 0.042), kind: 'normal'},
    {id: "mri-r-orbit", label: "R orbit normal", world: new T.Vector3(-0.034, 1.622, 0.07), kind: 'normal'},
    {id: "mri-l-orbit", label: "L orbit normal", world: new T.Vector3(0.036, 1.622, 0.07), kind: 'normal'},
  ];

  // --- Case 5: cbct-right-maxilla-20190727-apical ---
  const fractureGroup5 = new T.Group();
  fractureGroup5.name = 'clinical-fracture-lines-case5';
  fractureGroup5.visible = false;
  const segments5: Array<{a:[number, number, number]; b:[number, number, number]; radius?:number; glow?:number}> = [
  ];
  segments5.forEach(seg => {
    const mesh = segmentMesh(seg.a, seg.b, fractureMat, seg.radius ?? 0.00145);
    geometries.push(mesh.geometry);
    fractureGroup5.add(mesh);
    const glow = segmentMesh(seg.a, seg.b, glowMat, seg.glow ?? 0.0036);
    geometries.push(glow.geometry);
    fractureGroup5.add(glow);
  });
  group.add(fractureGroup5);

  const anchors5: ClinicalLabelAnchor[] = [
    {id: "cbct-16", label: "R 1st molar \u00b7 apical periodontitis", world: new T.Vector3(-0.03, 1.508, 0.046), kind: 'lesion'},
    {id: "cbct-15", label: "R 2nd premolar \u00b7 apical periodontitis", world: new T.Vector3(-0.026, 1.514, 0.066), kind: 'lesion'},
    {id: "cbct-sinus", label: "R maxillary sinus \u00b7 mild mucosal thickening", world: new T.Vector3(-0.026, 1.548, 0.062), kind: 'lesion'},
    {id: "cbct-cortex", label: "No fracture \u00b7 cortex intact", world: new T.Vector3(-0.034, 1.522, 0.054), kind: 'normal'},
  ];

  // --- Case 6: ct-neck-20260602-left-parotid ---
  const fractureGroup6 = new T.Group();
  fractureGroup6.name = 'clinical-fracture-lines-case6';
  fractureGroup6.visible = false;
  const segments6: Array<{a:[number, number, number]; b:[number, number, number]; radius?:number; glow?:number}> = [
  ];
  segments6.forEach(seg => {
    const mesh = segmentMesh(seg.a, seg.b, fractureMat, seg.radius ?? 0.00145);
    geometries.push(mesh.geometry);
    fractureGroup6.add(mesh);
    const glow = segmentMesh(seg.a, seg.b, glowMat, seg.glow ?? 0.0036);
    geometries.push(glow.geometry);
    fractureGroup6.add(glow);
  });
  group.add(fractureGroup6);

  const anchors6: ClinicalLabelAnchor[] = [
    {id: "ct-l-parotid", label: "L parotid \u00b7 15.7 x 13.5 mm nodule", world: new T.Vector3(0.049, 1.552, 0.016), kind: 'lesion'},
    {id: "ct-neck-node", label: "Neck node \u00b7 12.1 x 10.9 mm, likely reactive", world: new T.Vector3(0.022, 1.528, 0.03), kind: 'lesion'},
    {id: "ct-skull-base", label: "Base of skull \u00b7 no lytic lesion", world: new T.Vector3(-0.001, 1.592, 0.018), kind: 'normal'},
  ];

  // --- Case 7: dicom-mri-20260428-pat001 ---
  const fractureGroup7 = new T.Group();
  fractureGroup7.name = 'clinical-fracture-lines-case7';
  fractureGroup7.visible = false;
  const segments7: Array<{a:[number, number, number]; b:[number, number, number]; radius?:number; glow?:number}> = [];
  segments7.forEach(seg => {
    const mesh = segmentMesh(seg.a, seg.b, fractureMat, seg.radius ?? 0.00145);
    geometries.push(mesh.geometry);
    fractureGroup7.add(mesh);
    const glow = segmentMesh(seg.a, seg.b, glowMat, seg.glow ?? 0.0036);
    geometries.push(glow.geometry);
    fractureGroup7.add(glow);
  });
  group.add(fractureGroup7);

  const anchors7: ClinicalLabelAnchor[] = [
    { id: 'mri-brain-1', label: 'MR Trigeminal Nerves \u00b7 W/WO Cont', world: new T.Vector3(0, 1.6, 0.05), kind: 'normal' },
  ];

  // --- Case 8: fnac-20260605-left-parotid ---
  const fractureGroup8 = new T.Group();
  fractureGroup8.name = 'clinical-fracture-lines-case8';
  fractureGroup8.visible = false;
  const segments8: Array<{a:[number, number, number]; b:[number, number, number]; radius?:number; glow?:number}> = [];
  segments8.forEach(seg => {
    const mesh = segmentMesh(seg.a, seg.b, fractureMat, seg.radius ?? 0.00145);
    geometries.push(mesh.geometry);
    fractureGroup8.add(mesh);
    const glow = segmentMesh(seg.a, seg.b, glowMat, seg.glow ?? 0.0036);
    geometries.push(glow.geometry);
    fractureGroup8.add(glow);
  });
  group.add(fractureGroup8);

  const anchors8: ClinicalLabelAnchor[] = [
    { id: 'fnac-sialadenitis', label: 'FNAC: Sialadenitis', world: new T.Vector3(0.049, 1.552, 0.016), kind: 'lesion' },
  ];

  const hemosinusMat = new T.MeshStandardMaterial({
    color: HEMOSINUS_COLOR,
    emissive: HEMOSINUS_COLOR,
    emissiveIntensity: 0.22,
    roughness: 0.48,
    metalness: 0.02,
    transparent: true,
    opacity: 0.62,
    depthTest: false,
    depthWrite: false,
    side: T.DoubleSide,
  });
  materials.push(hemosinusMat);
  const hemosinusGeom = new T.SphereGeometry(1, 20, 16);
  geometries.push(hemosinusGeom);
  const hemosinus = new T.Mesh(hemosinusGeom, hemosinusMat);
  hemosinus.name = 'clinical-right-hemosinus';
  hemosinus.position.set(-0.027, 1.56, 0.056);
  hemosinus.scale.set(0.0115, 0.0105, 0.0125);
  hemosinus.renderOrder = 11;
  group.add(hemosinus);
  const hemosinusGlowMat = new T.MeshBasicMaterial({
    color: 0xff2a14,
    transparent: true,
    opacity: 0.22,
    blending: T.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    side: T.DoubleSide,
  });
  materials.push(hemosinusGlowMat);
  const hemosinusGlow = new T.Mesh(hemosinusGeom, hemosinusGlowMat);
  hemosinusGlow.position.copy(hemosinus.position);
  hemosinusGlow.scale.set(0.016, 0.015, 0.017);
  hemosinusGlow.renderOrder = 10;
  group.add(hemosinusGlow);

  const burnLight = new T.PointLight(0xff3a12, 1.4, 0.16, 2);
  burnLight.position.set(-0.050, 1.586, 0.048);
  group.add(burnLight);
  const orbitLight = new T.PointLight(0xff6a22, 0.9, 0.12, 2);
  orbitLight.position.set(-0.045, 1.604, 0.048);
  group.add(orbitLight);

  const ember = new T.Color();
  const emberHot = new T.Color(0xffc266);
  const emberCore = new T.Color(FRACTURE_COLOR);

  const granulomaMat = new T.MeshStandardMaterial({
    color: GRANULOMA_COLOR,
    emissive: 0xbba87a,
    emissiveIntensity: 0.18,
    roughness: 0.38,
    metalness: 0.32,
    depthTest: false,
    depthWrite: false,
  });
  materials.push(granulomaMat);
  const granulomaGeom = new T.SphereGeometry(0.0046, 18, 14);
  geometries.push(granulomaGeom);
  const granuloma = new T.Mesh(granulomaGeom, granulomaMat);
  granuloma.name = 'clinical-left-frontal-granuloma';
  granuloma.position.set(0.029, 1.664, 0.036);
  granuloma.renderOrder = 13;
  group.add(granuloma);

  let activeCaseId: string | undefined = undefined;
  let flags: ClinicalReconstructionFlags = {fractureLines: false, hemosinus: false, granuloma: false, glow: true};

  const applyFlags = () => {
    const isGlowOn = flags.glow ?? true;

    fractureGroup1.visible = (activeCaseId === 'ncct-head-20260921-right-zmc') && flags.fractureLines;
    fractureGroup2.visible = (activeCaseId === 'ct-face-3d-20180218-right-zygoma') && flags.fractureLines;
    fractureGroup3.visible = (activeCaseId === 'xray-pns-om-20190608-normal') && flags.fractureLines;
    fractureGroup4.visible = (activeCaseId === 'mri-nose-pns-20190611-inf-turbinates') && flags.fractureLines;
    fractureGroup5.visible = (activeCaseId === 'cbct-right-maxilla-20190727-apical') && flags.fractureLines;
    fractureGroup6.visible = (activeCaseId === 'ct-neck-20260602-left-parotid') && flags.fractureLines;
    fractureGroup7.visible = (activeCaseId === 'dicom-mri-20260428-pat001') && flags.fractureLines;
    fractureGroup8.visible = (activeCaseId === 'fnac-20260605-left-parotid') && flags.fractureLines;
    normalGroup3.visible = activeCaseId === 'xray-pns-om-20190608-normal';
    hemosinus.visible = activeCaseId === 'ncct-head-20260921-right-zmc' && flags.hemosinus;
    hemosinusGlow.visible = activeCaseId === 'ncct-head-20260921-right-zmc' && flags.hemosinus && isGlowOn;
    granuloma.visible = activeCaseId === 'ncct-head-20260921-right-zmc' && flags.granuloma;
    burnLight.visible = flags.fractureLines && isGlowOn;
    orbitLight.visible = flags.fractureLines && isGlowOn;
    glowMat.visible = isGlowOn;
    if (!isGlowOn) {
      fractureMat.color.set(FRACTURE_COLOR);
      fractureMat.emissive.set(FRACTURE_COLOR);
      fractureMat.emissiveIntensity = 0.45;
      fractureMat.opacity = 0.95;
      hemosinusMat.emissiveIntensity = 0.15;
      hemosinusMat.opacity = 0.65;
      hemosinus.scale.set(0.0115, 0.0105, 0.0125);
    }
  };
  applyFlags();

  return {
    group,
    setActiveCase(caseId?: string) {
      activeCaseId = caseId;
      applyFlags();
    },
    setVisible(v: boolean) {
      group.visible = v;
    },
    setFlags(next: ClinicalReconstructionFlags) {
      flags = next;
      applyFlags();
    },
    labelAnchors() {

      if (activeCaseId === 'fnac-20260605-left-parotid') return anchors8;
      if (activeCaseId === 'dicom-mri-20260428-pat001') return anchors7;
      const activeAnchors = (activeCaseId === 'ncct-head-20260921-right-zmc' ? anchors1 : (activeCaseId === 'ct-face-3d-20180218-right-zygoma' ? anchors2 : (activeCaseId === 'xray-pns-om-20190608-normal' ? anchors3 : (activeCaseId === 'mri-nose-pns-20190611-inf-turbinates' ? anchors4 : (activeCaseId === 'cbct-right-maxilla-20190727-apical' ? anchors5 : (activeCaseId === 'ct-neck-20260602-left-parotid' ? anchors6 : []))))));
      return activeAnchors.filter(a => {
        if (a.kind === 'fracture') return flags.fractureLines;
        if (a.kind === 'hemosinus') return flags.hemosinus;
        if (a.kind === 'granuloma') return flags.granuloma;
        return true;
      });
    },
    tick(elapsed: number) {
      if (!group.visible) return;
      const isGlowOn = flags.glow ?? true;
      if (!isGlowOn) return;
      const wave = 0.5 + 0.5 * Math.sin(elapsed * 2.35);
      const flicker = 0.5 + 0.5 * Math.sin(elapsed * 13.7) * Math.sin(elapsed * 7.1 + 0.6);
      const heat = Math.min(1, wave * 0.82 + flicker * 0.28);
      ember.copy(emberCore).lerp(emberHot, heat * 0.72);
      fractureMat.color.copy(ember);
      fractureMat.emissive.copy(ember);
      fractureMat.emissiveIntensity = 0.55 + heat * 1.85;
      fractureMat.opacity = 0.86 + heat * 0.14;
      glowMat.color.copy(ember);
      glowMat.opacity = 0.16 + heat * 0.42;
      const blood = 0.5 + 0.5 * Math.sin(elapsed * 1.55 + 0.9);
      hemosinusMat.emissiveIntensity = 0.18 + blood * 0.85;
      hemosinusMat.opacity = 0.5 + blood * 0.28;
      hemosinusGlowMat.opacity = 0.12 + blood * 0.32;
      const pulse = 1 + blood * 0.08;
      hemosinus.scale.set(0.0115 * pulse, 0.0105 * pulse, 0.0125 * pulse);
      hemosinusGlow.scale.set(0.016 * pulse, 0.015 * pulse, 0.017 * pulse);
      burnLight.intensity = 0.7 + heat * 2.4;
      orbitLight.intensity = 0.45 + heat * 1.6;
      burnLight.color.copy(ember);
    },
    dispose() {
      parent.remove(group);
      geometries.forEach(geom => geom.dispose());
      materials.forEach(m => m.dispose());
    },
  };
}

