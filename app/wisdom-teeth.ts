import * as T from 'three';
import { type DentalLayers, type NervousSide, DENTAL_QUADRANT_COLORS } from './anatomy';

export interface WisdomTeethHandle {
  group: T.Group;
  setVisible: (v: boolean) => void;
  setLayers: (layers: DentalLayers, side: NervousSide) => void;
  dispose: () => void;
}

interface ToothSpec {
  id: 'q1' | 'q2' | 'q3' | 'q4';
  name: string;
  side: 'left' | 'right';
  isUpper: boolean;
  position: [number, number, number];
  color: string;
}

const WISDOM_SPECS: ToothSpec[] = [
  {
    id: 'q1',
    name: 'Right upper third secondary molar tooth (Wisdom)',
    side: 'right',
    isUpper: true,
    position: [-0.0244, 1.5536, 0.0310],
    color: DENTAL_QUADRANT_COLORS.q1,
  },
  {
    id: 'q2',
    name: 'Left upper third secondary molar tooth (Wisdom)',
    side: 'left',
    isUpper: true,
    position: [0.0231, 1.5536, 0.0310],
    color: DENTAL_QUADRANT_COLORS.q2,
  },
  {
    id: 'q3',
    name: 'Left lower third secondary molar tooth (Wisdom)',
    side: 'left',
    isUpper: false,
    position: [0.0296, 1.5368, 0.0227],
    color: DENTAL_QUADRANT_COLORS.q3,
  },
  {
    id: 'q4',
    name: 'Right lower third secondary molar tooth (Wisdom)',
    side: 'right',
    isUpper: false,
    position: [-0.0309, 1.5368, 0.0227],
    color: DENTAL_QUADRANT_COLORS.q4,
  },
];

function createMolarGeometry(isUpper: boolean): T.BufferGeometry {
  const geom = new T.BoxGeometry(0.0095, 0.016, 0.0095, 8, 12, 8);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Crown cusp shape
    const crown = isUpper ? -y : y;
    if (crown > 0.002) {
      const cuspX = Math.sin(x * 400);
      const cuspZ = Math.sin(z * 400);
      const dy = (Math.abs(cuspX) + Math.abs(cuspZ)) * 0.0008;
      y += isUpper ? -dy : dy;
    } else {
      // Root tapering
      const taper = Math.max(0.45, 1.0 + (crown - 0.002) * 45);
      x *= taper;
      z *= taper;
    }
    pos.setXYZ(i, x, y, z);
  }
  geom.computeVertexNormals();
  return geom;
}

export function mountWisdomTeeth(parent: T.Group): WisdomTeethHandle {
  const group = new T.Group();
  group.name = 'wisdom-teeth-overlay';
  group.visible = false;
  parent.add(group);

  const geometries: T.BufferGeometry[] = [];
  const materials: T.Material[] = [];
  const meshes: { mesh: T.Mesh; spec: ToothSpec }[] = [];

  const upperGeom = createMolarGeometry(true);
  const lowerGeom = createMolarGeometry(false);
  geometries.push(upperGeom, lowerGeom);

  WISDOM_SPECS.forEach(spec => {
    const mat = new T.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.35,
      metalness: 0.08,
      side: T.DoubleSide,
    });
    materials.push(mat);

    const geom = spec.isUpper ? upperGeom : lowerGeom;
    const mesh = new T.Mesh(geom, mat);
    mesh.name = spec.name;
    mesh.position.set(...spec.position);
    mesh.rotation.y = spec.side === 'right' ? -0.15 : 0.15;
    group.add(mesh);
    meshes.push({ mesh, spec });
  });

  return {
    group,
    setVisible(v: boolean) {
      group.visible = v;
    },
    setLayers(layers: DentalLayers, side: NervousSide) {
      meshes.forEach(({ mesh, spec }) => {
        if (!layers.teeth || !layers.molar) {
          mesh.visible = false;
          return;
        }
        if (side === 'left' && spec.side !== 'left') {
          mesh.visible = false;
          return;
        }
        if (side === 'right' && spec.side !== 'right') {
          mesh.visible = false;
          return;
        }
        mesh.visible = !!layers[spec.id];
      });
    },
    dispose() {
      parent.remove(group);
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
    },
  };
}
