import type { TrigeminalData } from './trigeminal';

export const TRIGEMINAL_DATA: TrigeminalData = {
  id: "trigeminal-cnv",
  title: "Trigeminal Nerve (CN V)",
  ganglion: {
    id: "gasserian",
    label: "Trigeminal ganglion",
    position: [0.062, 1.578, 0.010],
    radius: 0.0064
  },
  branches: [
    {
      id: "v1-frontal",
      division: "v1",
      part: "v1",
      label: "Frontal nerve (V1)",
      radius: 0.0017,
      path: [
        [0.062, 1.578, 0.010],
        [0.054, 1.596, 0.022],
        [0.044, 1.614, 0.038],
        [0.032, 1.632, 0.050],
        [0.022, 1.654, 0.054],
        [0.014, 1.678, 0.048],
        [0.010, 1.696, 0.038]
      ]
    },
    {
      id: "v1-supratrochlear",
      division: "v1",
      part: "v1",
      label: "Supratrochlear nerve (V1)",
      radius: 0.00135,
      path: [
        [0.044, 1.614, 0.038],
        [0.026, 1.620, 0.056],
        [0.012, 1.630, 0.068],
        [0.004, 1.642, 0.072]
      ]
    },
    {
      id: "v1-nasociliary",
      division: "v1",
      part: "v1",
      label: "Nasociliary nerve (V1)",
      radius: 0.0013,
      path: [
        [0.044, 1.614, 0.038],
        [0.028, 1.606, 0.058],
        [0.014, 1.596, 0.074],
        [0.004, 1.588, 0.084]
      ]
    },
    {
      id: "v2-infraorbital",
      division: "v2",
      part: "v2",
      label: "Infraorbital nerve (V2)",
      radius: 0.0017,
      path: [
        [0.062, 1.578, 0.010],
        [0.052, 1.580, 0.026],
        [0.040, 1.578, 0.046],
        [0.026, 1.572, 0.066],
        [0.014, 1.564, 0.080],
        [0.004, 1.556, 0.086]
      ]
    },
    {
      id: "v2-zygomatic",
      division: "v2",
      part: "v2",
      label: "Zygomaticofacial nerve (V2)",
      radius: 0.00125,
      path: [
        [0.052, 1.580, 0.026],
        [0.056, 1.588, 0.040],
        [0.050, 1.586, 0.054],
        [0.042, 1.580, 0.060]
      ]
    },
    {
      id: "v3-mental",
      division: "v3",
      part: "v3-jaw",
      label: "Inferior alveolar / mental nerve (V3)",
      radius: 0.0017,
      path: [
        [0.062, 1.578, 0.010],
        [0.058, 1.560, 0.012],
        [0.050, 1.540, 0.020],
        [0.036, 1.524, 0.032],
        [0.018, 1.514, 0.046],
        [0.006, 1.508, 0.056]
      ]
    },
    {
      id: "v3-auriculotemporal",
      division: "v3",
      part: "v3-temple",
      label: "Auriculotemporal nerve (V3)",
      radius: 0.00135,
      path: [
        [0.062, 1.578, 0.010],
        [0.066, 1.594, 0.000],
        [0.064, 1.616, -0.008],
        [0.054, 1.640, -0.006],
        [0.042, 1.658, 0.000]
      ]
    },
    {
      id: "v3-buccal",
      division: "v3",
      part: "v3-jaw",
      label: "Buccal nerve (V3)",
      radius: 0.00125,
      path: [
        [0.058, 1.560, 0.012],
        [0.048, 1.554, 0.032],
        [0.036, 1.548, 0.048],
        [0.024, 1.542, 0.060]
      ]
    }
  ],
  zones: [
    {
      id: "v1",
      division: "v1",
      label: "Ophthalmic Zone (V1)",
      color: "#2aa8b8",
      contour: [
        [0.002, 1.708, 0.032],
        [0.022, 1.706, 0.026],
        [0.042, 1.694, 0.018],
        [0.054, 1.672, 0.016],
        [0.056, 1.648, 0.028],
        [0.048, 1.628, 0.050],
        [0.030, 1.614, 0.068],
        [0.010, 1.608, 0.078],
        [0.002, 1.620, 0.074],
        [0.002, 1.662, 0.052]
      ]
    },
    {
      id: "v2",
      division: "v2",
      label: "Maxillary Zone (V2)",
      color: "#3daf6a",
      contour: [
        [0.010, 1.608, 0.078],
        [0.030, 1.600, 0.068],
        [0.048, 1.590, 0.052],
        [0.058, 1.576, 0.030],
        [0.050, 1.560, 0.044],
        [0.030, 1.554, 0.068],
        [0.012, 1.550, 0.082],
        [0.002, 1.556, 0.088],
        [0.002, 1.584, 0.086]
      ]
    },
    {
      id: "v3-jaw",
      division: "v3",
      label: "V3 jaw & chin",
      color: "#8a5bb8",
      contour: [
        [0.058, 1.560, 0.018],
        [0.050, 1.528, 0.018],
        [0.028, 1.506, 0.038],
        [0.006, 1.498, 0.054],
        [0.002, 1.510, 0.068],
        [0.008, 1.536, 0.070],
        [0.028, 1.548, 0.054],
        [0.048, 1.558, 0.038]
      ]
    },
    {
      id: "v3-temple",
      division: "v3",
      label: "V3 temple & ear",
      color: "#9b6cc9",
      contour: [
        [0.058, 1.576, 0.022],
        [0.066, 1.592, 0.006],
        [0.064, 1.618, -0.006],
        [0.052, 1.642, -0.004],
        [0.042, 1.650, 0.006],
        [0.048, 1.620, 0.012],
        [0.056, 1.590, 0.014],
        [0.060, 1.562, 0.010]
      ]
    }
  ]
};
