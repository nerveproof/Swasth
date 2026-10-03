import type { FaceMuscleId, FaceMuscleLayers } from './anatomy';

export interface FaceMuscleSheet {
 id: FaceMuscleId;
 label: string;
 rows: [number, number, number][][];
}

export interface FaceMuscleTube {
 id: FaceMuscleId;
 label: string;
 radius: number;
 path: [number, number, number][];
 closed?: boolean;
}

export interface FaceMusclesData {
 masseter: FaceMuscleSheet[];
 temporalis: FaceMuscleSheet[];
 buccinator: FaceMuscleSheet[];
 orbicularis: FaceMuscleTube[];
 zygomaticus: FaceMuscleTube[];
 pterygoids: FaceMuscleTube[];
}

export const FACE_MUSCLE_COLORS: Record<FaceMuscleId, string> = {
 masseter: '#b56b60',
 temporalis: '#a85b50',
 buccinator: '#c27165',
 orbicularis: '#bf6a64',
 zygomaticus: '#cb7c72',
 pterygoids: '#a35248',
};

function generateOrbitPoints(count: number): [number, number, number][] {
 const points: [number, number, number][] = [];
 for (let i = 0; i < count; i++) {
  const theta = (i / count) * Math.PI * 2;
  const x = 0.032 + 0.016 * Math.cos(theta);
  const y = 1.612 + 0.011 * Math.sin(theta);
  const z = 0.060 + 0.005 * Math.cos(theta);
  points.push([x, y, z]);
 }
 return points;
}

function generateMouthPoints(count: number): [number, number, number][] {
 const points: [number, number, number][] = [];
 for (let i = 0; i < count; i++) {
  const theta = (i / count) * Math.PI * 2;
  const x = 0.012 + 0.016 * Math.cos(theta);
  const y = 1.534 + 0.0085 * Math.sin(theta);
  const z = 0.076 - 0.007 * Math.abs(Math.cos(theta));
  points.push([x, y, z]);
 }
 return points;
}

export const FACE_MUSCLES_DATA: FaceMusclesData = {
 masseter: [
  {
   id: 'masseter',
   label: 'Masseter',
   rows: [
    [
     [0.046, 1.582, 0.040],
     [0.054, 1.580, 0.028],
     [0.060, 1.576, 0.014],
    ],
    [
     [0.042, 1.554, 0.034],
     [0.050, 1.552, 0.022],
     [0.058, 1.548, 0.010],
    ],
    [
     [0.036, 1.526, 0.026],
     [0.046, 1.522, 0.016],
     [0.054, 1.518, 0.006],
    ],
    [
     [0.030, 1.500, 0.018],
     [0.040, 1.498, 0.010],
     [0.050, 1.494, 0.002],
    ],
   ],
  },
 ],
 temporalis: [
  {
   id: 'temporalis',
   label: 'Temporalis',
   rows: [
    [
     [0.018, 1.670, 0.032],
     [0.036, 1.674, 0.020],
     [0.054, 1.660, 0.006],
     [0.066, 1.635, -0.010],
     [0.068, 1.605, -0.018],
    ],
    [
     [0.028, 1.636, 0.030],
     [0.040, 1.636, 0.020],
     [0.052, 1.626, 0.010],
     [0.060, 1.610, 0.000],
     [0.062, 1.590, -0.006],
    ],
    [
     [0.040, 1.596, 0.028],
     [0.046, 1.594, 0.022],
     [0.052, 1.590, 0.016],
     [0.056, 1.584, 0.010],
     [0.058, 1.576, 0.006],
    ],
    [
     [0.048, 1.564, 0.024],
     [0.050, 1.564, 0.022],
     [0.052, 1.562, 0.020],
     [0.054, 1.560, 0.018],
     [0.056, 1.558, 0.016],
    ],
   ],
  },
 ],
 buccinator: [
  {
   id: 'buccinator',
   label: 'Buccinator',
   rows: [
    [
     [0.018, 1.558, 0.060],
     [0.028, 1.560, 0.050],
     [0.038, 1.558, 0.038],
     [0.046, 1.554, 0.024],
    ],
    [
     [0.016, 1.542, 0.064],
     [0.026, 1.544, 0.052],
     [0.036, 1.542, 0.038],
     [0.044, 1.538, 0.024],
    ],
    [
     [0.014, 1.526, 0.060],
     [0.024, 1.528, 0.048],
     [0.034, 1.526, 0.036],
     [0.042, 1.522, 0.022],
    ],
   ],
  },
 ],
 orbicularis: [
  {
   id: 'orbicularis',
   label: 'Orbicularis oculi',
   radius: 0.0022,
   closed: true,
   path: generateOrbitPoints(20),
  },
  {
   id: 'orbicularis',
   label: 'Orbicularis oris',
   radius: 0.0024,
   closed: true,
   path: generateMouthPoints(20),
  },
 ],
 zygomaticus: [
  {
   id: 'zygomaticus',
   label: 'Zygomaticus major',
   radius: 0.0022,
   closed: false,
   path: [
    [0.050, 1.582, 0.034],
    [0.042, 1.566, 0.046],
    [0.032, 1.548, 0.058],
    [0.022, 1.534, 0.068],
   ],
  },
  {
   id: 'zygomaticus',
   label: 'Zygomaticus minor',
   radius: 0.0018,
   closed: false,
   path: [
    [0.042, 1.590, 0.044],
    [0.034, 1.574, 0.056],
    [0.026, 1.558, 0.066],
    [0.020, 1.548, 0.072],
   ],
  },
 ],
 pterygoids: [
  {
   id: 'pterygoids',
   label: 'Medial pterygoid',
   radius: 0.0034,
   closed: false,
   path: [
    [0.034, 1.548, 0.016],
    [0.038, 1.528, 0.012],
    [0.044, 1.504, 0.006],
   ],
  },
  {
   id: 'pterygoids',
   label: 'Lateral pterygoid (superior head)',
   radius: 0.0026,
   closed: false,
   path: [
    [0.032, 1.566, 0.024],
    [0.044, 1.568, 0.016],
    [0.056, 1.570, 0.008],
   ],
  },
  {
   id: 'pterygoids',
   label: 'Lateral pterygoid (inferior head)',
   radius: 0.0028,
   closed: false,
   path: [
    [0.032, 1.554, 0.024],
    [0.044, 1.560, 0.016],
    [0.056, 1.566, 0.008],
   ],
  },
 ],
};

const flipX = (p: [number, number, number]): [number, number, number] => [-p[0], p[1], p[2]];

/** BodyParts3D +X is the subject's left. Negate X for the right-face copy. */
export function mirrorFaceMuscles(data: FaceMusclesData): FaceMusclesData {
 return {
  masseter: data.masseter.map(s => ({ ...s, rows: s.rows.map(row => row.map(flipX)) })),
  temporalis: data.temporalis.map(s => ({ ...s, rows: s.rows.map(row => row.map(flipX)) })),
  buccinator: data.buccinator.map(s => ({ ...s, rows: s.rows.map(row => row.map(flipX)) })),
  orbicularis: data.orbicularis.map(t => ({ ...t, path: t.path.map(flipX) })),
  zygomaticus: data.zygomaticus.map(t => ({ ...t, path: t.path.map(flipX) })),
  pterygoids: data.pterygoids.map(t => ({ ...t, path: t.path.map(flipX) })),
 };
}
