import * as T from 'three';
import type { FaceMuscleId, FaceMuscleLayers } from './anatomy';
import { FACE_MUSCLE_COLORS, type FaceMusclesData } from './face-muscles';

export interface FaceMusclesHandle {
 group: T.Group;
 pickables: T.Object3D[];
 setVisible: (v: boolean) => void;
 setLayers: (layers: FaceMuscleLayers) => void;
 dispose: () => void;
}

function sheetGeometry(rows: [number, number, number][][]): T.BufferGeometry {
 const ny = rows.length, nx = rows[0].length;
 const positions: number[] = [];
 const indices: number[] = [];
 for (let j = 0; j < ny; j++) {
  for (let i = 0; i < nx; i++) {
   const p = rows[j][i];
   positions.push(p[0], p[1], p[2]);
  }
 }
 for (let j = 0; j < ny - 1; j++) {
  for (let i = 0; i < nx - 1; i++) {
   const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
   indices.push(a, c, b, b, c, d);
  }
 }
 const g = new T.BufferGeometry();
 g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
 g.setIndex(indices);
 g.computeVertexNormals();
 const pos = g.getAttribute('position') as T.BufferAttribute;
 const nrm = g.getAttribute('normal') as T.BufferAttribute;
 const lift = 0.001;
 for (let i = 0; i < pos.count; i++) {
  pos.setXYZ(i, pos.getX(i) + nrm.getX(i) * lift, pos.getY(i) + nrm.getY(i) * lift, pos.getZ(i) + nrm.getZ(i) * lift);
 }
 pos.needsUpdate = true;
 g.computeVertexNormals();
 return g;
}

function tubeGeometry(path: [number, number, number][], radius: number, closed = false): T.BufferGeometry {
 const points = path.map(p => new T.Vector3(p[0], p[1], p[2]));
 const curve = new T.CatmullRomCurve3(points, closed);
 return new T.TubeGeometry(curve, Math.max(24, path.length * 6), radius, 8, closed);
}

export function mountFaceMusclesOverlay(
 scene: T.Scene | T.Group | T.Object3D,
 data: FaceMusclesData,
 side: 'left' | 'right' = 'left'
): FaceMusclesHandle {
 const group = new T.Group();
 group.name = `face-muscles-overlay-${side}`;
 group.visible = false;
 scene.add(group);

 const pickables: T.Object3D[] = [];
 const materials: T.Material[] = [];
 const geometries: T.BufferGeometry[] = [];
 const muscleMeshes: Record<FaceMuscleId, T.Mesh[]> = {
  masseter: [],
  temporalis: [],
  buccinator: [],
  orbicularis: [],
  zygomaticus: [],
  pterygoids: [],
 };

 let layers: FaceMuscleLayers = {
  masseter: true,
  temporalis: true,
  buccinator: true,
  orbicularis: true,
  zygomaticus: true,
  pterygoids: true,
 };

 const renderOrders: Record<FaceMuscleId, number> = {
  pterygoids: 9,
  buccinator: 10,
  masseter: 13,
  temporalis: 13,
  zygomaticus: 14,
  orbicularis: 14,
 };

 function addSheet(id: FaceMuscleId, rows: [number, number, number][][], label: string) {
  const geom = sheetGeometry(rows);
  geometries.push(geom);
  const color = FACE_MUSCLE_COLORS[id];
  const mat = new T.MeshStandardMaterial({
   color,
   emissive: color,
   emissiveIntensity: 0.12,
   roughness: 0.65,
   metalness: 0.04,
   transparent: true,
   opacity: 0.90,
   side: T.DoubleSide,
   depthWrite: false,
  });
  materials.push(mat);
  const mesh = new T.Mesh(geom, mat);
  mesh.renderOrder = renderOrders[id];
  mesh.name = `facemuscle-${id}-${label}`;
  group.add(mesh);
  pickables.push(mesh);
  muscleMeshes[id].push(mesh);
 }

 function addTube(id: FaceMuscleId, path: [number, number, number][], radius: number, closed = false, label: string) {
  const geom = tubeGeometry(path, radius, closed);
  geometries.push(geom);
  const color = FACE_MUSCLE_COLORS[id];
  const mat = new T.MeshStandardMaterial({
   color,
   emissive: color,
   emissiveIntensity: 0.14,
   roughness: 0.60,
   metalness: 0.04,
   transparent: true,
   opacity: 0.92,
   side: T.DoubleSide,
   depthWrite: false,
  });
  materials.push(mat);
  const mesh = new T.Mesh(geom, mat);
  mesh.renderOrder = renderOrders[id];
  mesh.name = `facemuscle-${id}-${label}`;
  group.add(mesh);
  pickables.push(mesh);
  muscleMeshes[id].push(mesh);
 }

 for (const sheet of data.masseter) {
  addSheet('masseter', sheet.rows, sheet.label);
 }
 for (const sheet of data.temporalis) {
  addSheet('temporalis', sheet.rows, sheet.label);
 }
 for (const sheet of data.buccinator) {
  addSheet('buccinator', sheet.rows, sheet.label);
 }
 for (const tube of data.orbicularis) {
  addTube('orbicularis', tube.path, tube.radius, tube.closed, tube.label);
 }
 for (const tube of data.zygomaticus) {
  addTube('zygomaticus', tube.path, tube.radius, tube.closed, tube.label);
 }
 for (const tube of data.pterygoids) {
  addTube('pterygoids', tube.path, tube.radius, tube.closed, tube.label);
 }

 const applyLayers = () => {
  for (const id of Object.keys(muscleMeshes) as FaceMuscleId[]) {
   const isVisible = layers[id] ?? true;
   for (const mesh of muscleMeshes[id]) {
    mesh.visible = isVisible;
   }
  }
 };

 return {
  group,
  pickables,
  setVisible(v: boolean) {
   group.visible = v;
  },
  setLayers(next: FaceMuscleLayers) {
   layers = next;
   applyLayers();
  },
  dispose() {
   scene.remove(group);
   geometries.forEach(g => g.dispose());
   materials.forEach(m => m.dispose());
  },
 };
}
