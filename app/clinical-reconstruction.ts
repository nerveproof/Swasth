/**
 * clinical-reconstruction.ts
 * Active above-neck reconstruction for the uploaded 3D CT FACE report.
 * The previous NCCT HEAD case (right ZMC + hemosinus + left frontal granuloma) stays in this file.
 * Overlay and highlights are additive; frozen Systems pills are unchanged.
 */

import type {Atlas, NervousSide, SceneState} from './anatomy';
import {parseClinicalReport, type ClinicalFinding, type ClinicalReportResult} from './clinical-report';

export interface DoctorNotesData {
  author: string;
  date: string;
  category?: string;
  title?: string;
  type: string;
  displacement: string;
  observation: string;
  plan: string;
}

export interface ClinicalReconstruction {
  id: string;
  sourceFile: string;
  report: ClinicalReportResult;
  highlightPartIds: string[];
  side: Extract<NervousSide, 'left' | 'right' | 'both'>;
  showFractureLines: boolean;
  showHemosinus: boolean;
  showGranuloma: boolean;
  /** Head camera when this case is switched on. Omitted cases stay three-quarter. */
  view?: 'front' | 'three-quarter';
  /** Case-card date. Omitted cases keep the existing filename rule. */
  studyDate?: string;
  /** Scene caption while this case is on. Omitted cases keep the 3D CT FACE caption. */
  caption?: string;
  doctorNotes?: DoctorNotesData;
}

/** BodyParts3D part ids for this NCCT HEAD trauma case (right ZMC + left frontal). */
export const NCCT_HEAD_HIGHLIGHT_PARTS = {
  rightZygomatic: 'FJ3392',
  rightMaxilla: 'FJ3375',
  leftInferiorFrontalGyrus: 'FJ1744',
  leftMiddleFrontalGyrus: 'FJ1787',
  leftSuperiorFrontalGyrus: 'FJ1833',
} as const;

/** RGBA bytes written into the selection texture (0–255). */
export const CLINICAL_HIGHLIGHT_RGBA: Record<string, [number, number, number, number]> = {
  // Acute fracture sites — saturated red so they match the circled report findings.
  // [NCCT_HEAD_HIGHLIGHT_PARTS.rightZygomatic]: [212, 82, 54, 210],
  // [NCCT_HEAD_HIGHLIGHT_PARTS.rightMaxilla]: [188, 58, 68, 200],
  [NCCT_HEAD_HIGHLIGHT_PARTS.rightZygomatic]: [220, 24, 32, 235],
  [NCCT_HEAD_HIGHLIGHT_PARTS.rightMaxilla]: [200, 16, 28, 230],
  // Previous NCCT HEAD left-frontal granuloma tint. Not in the 3D CT FACE report, so it must not paint.
  // [NCCT_HEAD_HIGHLIGHT_PARTS.leftInferiorFrontalGyrus]: [214, 196, 150, 150],
  // [NCCT_HEAD_HIGHLIGHT_PARTS.leftMiddleFrontalGyrus]: [214, 196, 150, 150],
  // [NCCT_HEAD_HIGHLIGHT_PARTS.leftSuperiorFrontalGyrus]: [214, 196, 150, 150],
};

const NCCT_HEAD_FINDINGS: ClinicalFinding[] = [
  {
    structureName: 'Right orbital walls',
    conceptId: 'FMA52892',
    side: 'right',
    finding: 'Fracture of the lateral and inferior walls of the right orbit.',
    severity: 'significant',
  },
  {
    structureName: 'Right zygomatic bone',
    conceptId: 'FMA52892',
    side: 'right',
    finding: 'Fracture of the right zygomatic arch.',
    severity: 'significant',
  },
  {
    structureName: 'Right maxilla / antrum',
    conceptId: 'FMA53649',
    side: 'right',
    finding: 'Fractures of the anterior, postero-lateral and superior walls of the right maxillary antrum with hemosinus.',
    severity: 'significant',
  },
  {
    structureName: 'Left frontal lobe',
    conceptId: 'FMA72970',
    side: 'left',
    finding: 'Old calcified granuloma in the left frontal lobe without peri-lesional oedema.',
    severity: 'mild',
  },
];

export const NCCT_HEAD_TRAUMA_REPORT: ClinicalReportResult = {
  title: 'Radiology Summary: IMG_20260921_161411.jpg',
  modality: 'NCCT',
  studyRegion: 'Head · facial skeleton (above neck)',
  findings: NCCT_HEAD_FINDINGS,
  impression:
    'Impression: Old calcified granuloma in left frontal lobe without peri-lesional oedema. Bony fracture as described — right orbital lateral and inferior walls, right zygomatic arch, and right maxillary antrum (anterior, postero-lateral, superior walls) with hemosinus.',
  primaryConceptId: 'FMA52892',
  targetPill: 'skeleton',
};

// Was `export const ACTIVE_CLINICAL_RECONSTRUCTION` for IMG_20260921_161411.
// Kept intact so the prior NCCT HEAD case is not deleted.
export const NCCT_HEAD_TRAUMA_RECONSTRUCTION: ClinicalReconstruction = {
  id: 'ncct-head-20260921-right-zmc',
  sourceFile: 'IMG_20260921_161411.jpg',
  report: NCCT_HEAD_TRAUMA_REPORT,
  highlightPartIds: [
    NCCT_HEAD_HIGHLIGHT_PARTS.rightZygomatic,
    NCCT_HEAD_HIGHLIGHT_PARTS.rightMaxilla,
    NCCT_HEAD_HIGHLIGHT_PARTS.leftInferiorFrontalGyrus,
    NCCT_HEAD_HIGHLIGHT_PARTS.leftMiddleFrontalGyrus,
    NCCT_HEAD_HIGHLIGHT_PARTS.leftSuperiorFrontalGyrus,
  ],
  side: 'right',
  showFractureLines: true,
  showHemosinus: true,
  showGranuloma: true,
  caption: 'NCCT HEAD · RIGHT ZMC # · HEMOSINUS · L FRONTAL GRANULOMA',
  doctorNotes: {
    author: 'Dr. R. Sharma, MD (Radiology) · NCCT Review',
    date: '21/09/2026',
    category: 'CLINICAL NOTES · SKELETON & CRANIUM',
    title: "Doctor's Clinical Notes — Right ZMC Region",
    type: 'Right ZMC comminuted fracture with hemosinus & old left frontal granuloma',
    displacement: 'Lateral & inferior orbital rim disruption with sinus wall step-off',
    observation: 'Hemosinus identified in right maxillary antrum; left frontal calcification stable without edema.',
    plan: 'Maxillofacial surgical evaluation for orbital floor / ZMC exploration. Neurosurgery consult for granuloma baseline.'
  }
};

const CT_FACE_3D_FINDINGS: ClinicalFinding[] = [
  {
    structureName: 'Right zygomatic bone',
    conceptId: 'FMA52892',
    side: 'right',
    finding: 'Fracture of the right zygomatic bone.',
    severity: 'significant',
  },
  {
    structureName: 'Right maxillary sinus',
    conceptId: 'FMA53649',
    side: 'right',
    finding: 'Fracture of the anterior and lateral walls of the right maxillary sinus.',
    severity: 'significant',
  },
  {
    structureName: 'Right lateral orbital wall',
    conceptId: 'FMA52892',
    side: 'right',
    finding: 'Small fracture of the right lateral orbital wall.',
    severity: 'significant',
  },
  {
    structureName: 'Right zygomatic arch',
    conceptId: 'FMA52892',
    side: 'right',
    finding: 'Right zygomatic arch is deformed.',
    severity: 'significant',
  },
  {
    structureName: 'Mandible',
    conceptId: 'FMA52748',
    finding: 'Mandible appears normal.',
    severity: 'normal',
  },
  {
    structureName: 'Pterygoid plates',
    conceptId: 'FMA52736',
    finding: 'Medial and lateral pterygoid plates are normal.',
    severity: 'normal',
  },
  {
    structureName: 'Cribriform plate',
    conceptId: 'FMA52740',
    finding: 'Cribriform plate appears normal.',
    severity: 'normal',
  },
  {
    structureName: 'Skull base',
    conceptId: 'FMA52736',
    finding: 'Base of skull appears normal.',
    severity: 'normal',
  },
  {
    structureName: 'Nasal bones',
    conceptId: 'FMA52745',
    finding: 'Nasal bones are normal.',
    severity: 'normal',
  },
];

export const CT_FACE_3D_REPORT: ClinicalReportResult = {
  title: 'Radiology Summary: IMG_20260929_074905-295zo.jpg',
  modality: 'CT',
  studyRegion: 'Face · facial skeleton (above neck)',
  findings: CT_FACE_3D_FINDINGS,
  impression:
    '3D CT FACE: Fracture of the right zygomatic bone and of the anterior and lateral walls of the maxillary sinus. Small fracture of the right lateral orbital wall. Right zygomatic arch is deformed. Mandible, medial and lateral pterygoid plates, cribriform plate, base of skull, and nasal bones are normal.',
  primaryConceptId: 'FMA52892',
  targetPill: 'skeleton',
};

export const CT_FACE_3D_RECONSTRUCTION: ClinicalReconstruction = {
  id: 'ct-face-3d-20180218-right-zygoma',
  sourceFile: 'IMG_20260929_074905-295zo.jpg',
  report: CT_FACE_3D_REPORT,
  highlightPartIds: [
    NCCT_HEAD_HIGHLIGHT_PARTS.rightZygomatic,
    NCCT_HEAD_HIGHLIGHT_PARTS.rightMaxilla,
  ],
  side: 'right',
  showFractureLines: true,
  showHemosinus: false,
  showGranuloma: false,
  caption: '3D CT FACE · RIGHT ZYGOMA # · SINUS WALLS # · ARCH DEFORMED',
  doctorNotes: {
    author: 'Dr. R. Sharma, MD (Radiology) · NCCT Review',
    date: '18/02/2018',
    category: 'CLINICAL NOTES · SKELETON',
    title: "Doctor's Clinical Notes — Right Zygomatic Region",
    type: 'Tripod / ZMC comminuted fracture',
    displacement: 'Inferior & lateral orbital rim step-off (3.2 mm dislocation)',
    observation: 'Surrounding soft tissue hemosinus present in maxillary antrum; edema noted.',
    plan: 'Maxillofacial surgical consult requested for open reduction and internal fixation (ORIF).'
  }
};

const XRAY_PNS_OM_FINDINGS: ClinicalFinding[] = [
  {
    structureName: 'Bilateral maxillary air sinuses',
    conceptId: 'FMA9711',
    side: 'bilateral',
    finding: 'Bilateral maxillary air sinuses appear normal.',
    severity: 'normal',
  },
  {
    structureName: 'Frontal air sinus',
    conceptId: 'FMA52734',
    finding: 'Frontal air sinus appears normal.',
    severity: 'normal',
  },
  {
    structureName: 'Nasal septum',
    conceptId: 'FMA59503',
    finding: 'Nasal septum is in the midline.',
    severity: 'normal',
  },
  {
    structureName: 'Orbital walls',
    conceptId: 'FMA52892',
    side: 'bilateral',
    finding: 'Orbital walls appear normal.',
    severity: 'normal',
  },
];

export const XRAY_PNS_OM_REPORT: ClinicalReportResult = {
  title: 'Radiology Summary: IMG_20260929_172007.jpg',
  modality: 'X-Ray',
  studyRegion: 'Paranasal sinuses · OM view (above neck)',
  findings: XRAY_PNS_OM_FINDINGS,
  impression:
    'X-RAY P.N.S. OM VIEW (08 Jun 2019): Bilateral maxillary air sinuses appear normal. Frontal air sinus appears normal. Nasal septum is in the midline. Orbital walls appear normal. Please correlate clinically.',
  primaryConceptId: 'FMA9711',
  targetPill: 'skeleton',
};

export const XRAY_PNS_OM_RECONSTRUCTION: ClinicalReconstruction = {
  id: 'xray-pns-om-20190608-normal',
  sourceFile: 'IMG_20260929_172007.jpg',
  report: XRAY_PNS_OM_REPORT,
  // Reviewed bones are not painted. FJ3392 and FJ3375 stay in the shared fracture tint map for the earlier cases only.
  highlightPartIds: [],
  side: 'both',
  showFractureLines: false,
  showHemosinus: false,
  showGranuloma: false,
  view: 'front',
  studyDate: '08/06/2019',
  caption: 'X-RAY PNS OM · MAXILLARY SINUSES NORMAL · FRONTAL SINUS NORMAL · SEPTUM MIDLINE · ORBITAL WALLS NORMAL',
  doctorNotes: {
    author: 'Dr. Muhammad Qasim, MBBS, DMRD · Dr. O.P. Gupta, MD · 08/06/2019',
    date: '08/06/2019',
    category: 'CLINICAL NOTES · PARANASAL SINUSES',
    title: "Doctor's Clinical Notes — PNS OM View",
    type: 'X-RAY P.N.S. OM VIEW — normal study',
    displacement: 'No displacement. Nasal septum is in the midline.',
    observation: 'Mr. Oshonik, 18 yrs, male, referred by Dr. V.P. Singh MS. Bilateral maxillary air sinuses, the frontal air sinus, and the orbital walls appear normal.',
    plan: 'Please correlate clinically. This film does not describe a fracture, an air-fluid level, or septal deviation.',
  },
};

const MRI_NOSE_PNS_FINDINGS: ClinicalFinding[] = [
  {
    structureName: 'Paranasal sinuses',
    conceptId: 'FMA9711',
    side: 'bilateral',
    finding: 'Sinuses including bilateral maxillary, ethmoidal, sphenoidal and frontal are clear with intact walls showing no abnormal signals.',
    severity: 'normal',
  },
  {
    structureName: 'Nasal septum',
    conceptId: 'FMA54375',
    finding: 'No obvious deviation of the nasal septum is seen.',
    severity: 'normal',
  },
  {
    structureName: 'Right inferior turbinate',
    conceptId: 'FMA54737',
    side: 'right',
    finding: 'Mild prominence of the right inferior turbinate is seen.',
    severity: 'mild',
  },
  {
    structureName: 'Left inferior turbinate',
    conceptId: 'FMA54738',
    side: 'left',
    finding: 'Mild prominence of the left inferior turbinate is seen.',
    severity: 'mild',
  },
  {
    structureName: 'Nasopharynx',
    conceptId: 'FMA52736',
    finding: 'Nasopharyngeal region appears normal with no evidence of an altered signal mass.',
    severity: 'normal',
  },
  {
    structureName: 'Sphenopalatine foramina and pterygopalatine fossae',
    conceptId: 'FMA52736',
    side: 'bilateral',
    finding: 'Sphenopalatine foramina and pterygopalatine fossae are normal.',
    severity: 'normal',
  },
  {
    structureName: 'Osteomeatal units',
    conceptId: 'FMA9711',
    side: 'bilateral',
    finding: 'Bilateral osteomeatal units are normal.',
    severity: 'normal',
  },
  {
    structureName: 'Remaining turbinates',
    conceptId: 'FMA54736',
    side: 'bilateral',
    finding: 'Rest turbinates are normal.',
    severity: 'normal',
  },
  {
    structureName: 'Nasal cavities',
    conceptId: 'FMA59503',
    side: 'bilateral',
    finding: 'Nasal cavities are patent with normal signals from the bones. No bony erosion is seen.',
    severity: 'normal',
  },
  {
    structureName: 'Orbits',
    conceptId: 'FMA53082',
    side: 'bilateral',
    finding: 'Orbits and their contents appear normal.',
    severity: 'normal',
  },
  {
    structureName: 'Cribriform plate',
    conceptId: 'FMA52740',
    finding: 'Cribriform plate is intact with a central crista galli.',
    severity: 'normal',
  },
  {
    structureName: 'Pterygoid plates and superior alveolar ridge',
    conceptId: 'FMA52736',
    side: 'bilateral',
    finding: 'The pterygoid plates and superior alveolar ridge are normal.',
    severity: 'normal',
  },
];

export const MRI_NOSE_PNS_REPORT: ClinicalReportResult = {
  title: 'Radiology Summary: IMG_20260929_172018.jpg',
  modality: 'MRI',
  studyRegion: 'Nose and paranasal sinuses (above neck)',
  findings: MRI_NOSE_PNS_FINDINGS,
  impression:
    'MRI nose and paranasal sinuses (11 Jun 2019): Mild prominence of bilateral inferior turbinates, otherwise a normal study of the nose and paranasal sinuses. Please correlate clinically.',
  primaryConceptId: 'FMA54736',
  targetPill: 'skeleton',
};

export const MRI_NOSE_PNS_RECONSTRUCTION: ClinicalReconstruction = {
  id: 'mri-nose-pns-20190611-inf-turbinates',
  sourceFile: 'IMG_20260929_172018.jpg',
  report: MRI_NOSE_PNS_REPORT,
  highlightPartIds: [],
  side: 'both',
  showFractureLines: false,
  showHemosinus: false,
  showGranuloma: false,
  view: 'front',
  studyDate: '11/06/2019',
  caption: 'MRI NOSE & PNS · MILD BILATERAL INFERIOR TURBINATE PROMINENCE · OTHERWISE NORMAL',
  doctorNotes: {
    author: 'Dr. Muhammad Qasim, MBBS, DMRD · Dr. O.P. Gupta, MD · 11/06/2019',
    date: '11/06/2019',
    category: 'CLINICAL NOTES · NOSE AND PARANASAL SINUSES',
    title: "Doctor's Clinical Notes — MRI Nose and Paranasal Sinuses",
    type: 'MRI — mild prominence of bilateral inferior turbinates',
    displacement: 'No displacement described. No obvious nasal septal deviation and no bony erosion.',
    observation:
      'Mr. Oshanik, 18 yrs, referred by Dr. V.P. Singh MS. T1, T2, and STIR sequences in sagittal, axial, and coronal planes. Both inferior turbinates are mildly prominent. Maxillary, ethmoid, sphenoid, and frontal sinuses are clear with intact walls. The septum, nasopharynx, osteomeatal units, remaining turbinates, nasal cavities, orbits, cribriform plate, pterygoid plates, and superior alveolar ridge are normal.',
    plan: 'Please correlate clinically.',
  },
};

const CBCT_RIGHT_MAXILLA_FINDINGS: ClinicalFinding[] = [
  {
    structureName: 'Maxillary right second premolar and first molar',
    conceptId: 'FMA53649',
    side: 'right',
    finding:
      'Apical periodontitis / irreversible pulpitis involving the maxillary right first molar and second premolar region. Teeth 14, 15, and 16 are endodontically treated. Slight periodontal-ligament widening is present around the palatal root of 16. Radiopaque obturation is seen in the mesiobuccal, distobuccal, and palatal roots of 16 and the buccal and palatal roots of 15 and 14, slightly underextended in all canals of 16 and 15 and the palatal canal of 14.',
    severity: 'significant',
  },
  {
    structureName: 'Right maxillary sinus',
    conceptId: 'FMA53649',
    side: 'right',
    finding: 'Mild reactive mucosal thickening in the right maxillary sinus.',
    severity: 'mild',
  },
  {
    structureName: 'Crowns and roots of maxillary right premolars and first molar',
    conceptId: 'FMA53649',
    side: 'right',
    finding:
      'No crack or fracture line in the crown or root of the maxillary right premolars and first molar. No breach of labial or lingual cortex.',
    severity: 'normal',
  },
];

export const CBCT_RIGHT_MAXILLA_REPORT: ClinicalReportResult = {
  title: 'Radiology Summary: IMG20260929180717-o4nji.jpg',
  modality: 'CBCT',
  studyRegion: 'Right maxilla, teeth 14 15 16 (above neck)',
  findings: CBCT_RIGHT_MAXILLA_FINDINGS,
  impression:
    'Segmental CBCT of the right maxilla (27 Jul 2019), region of interest teeth 14, 15, and 16: apical periodontitis / irreversible pulpitis involving the maxillary right first molar and second premolar. No fracture line. Mild reactive mucosal thickening in the right maxillary sinus. Correlate with clinical data.',
  primaryConceptId: 'FMA53649',
  targetPill: 'skeleton',
};

export const CBCT_RIGHT_MAXILLA_RECONSTRUCTION: ClinicalReconstruction = {
  id: 'cbct-right-maxilla-20190727-apical',
  sourceFile: 'IMG20260929180717-o4nji.jpg',
  report: CBCT_RIGHT_MAXILLA_REPORT,
  highlightPartIds: [],
  side: 'right',
  showFractureLines: false,
  showHemosinus: false,
  showGranuloma: false,
  view: 'front',
  studyDate: '27/07/2019',
  caption: 'CBCT RIGHT MAXILLA · APICAL PERIODONTITIS 15 & 16 · NO FRACTURE',
  doctorNotes: {
    author: 'Dr Sameer Rastogi, Consultant oral radiologist · Vineet oral diagnostic and imaging center, Meerut · 27/07/2019',
    date: '27/07/2019',
    category: 'CLINICAL NOTES · RIGHT MAXILLA',
    title: "Doctor's Clinical Notes — Segmental CBCT of the right maxilla",
    type: 'CBCT — apical periodontitis / irreversible pulpitis, teeth 15 and 16',
    displacement: 'No displacement described. No crack or fracture line in the crown or root, and no breach of labial or lingual cortex.',
    observation:
      'Oshunik, 19 year old male. Pain in the upper right back tooth region for 3 months, facial trauma 2 years earlier with surgery for facial fractures, and endodontic treatment of the maxillary right premolars and first molar 3–4 months earlier. CBCT (CS 9300, 1 mm / 90 microns) of teeth 14, 15, and 16. Teeth seen 18, 17, 16, 15, and 14; 14, 15, and 16 are endodontically treated. Slight periodontal-ligament widening around the palatal root of 16. Obturation material in the roots of 16, 15, and 14, slightly underextended in the canals of 16 and 15 and the palatal canal of 14. Mild reactive mucosal thickening in the right maxillary sinus. Mouth opening is normal and there is no vestibular tenderness.',
    plan: 'Correlation with clinical data is necessary for a definitive treatment plan. This report is not for medicolegal use.',
  },
};

const CT_NECK_LEFT_PAROTID_FINDINGS: ClinicalFinding[] = [
  {
    structureName: 'Left parotid gland',
    conceptId: 'FMA52748',
    side: 'left',
    finding:
      'Well-defined soft-tissue density nodular lesion within the left parotid gland measuring 15.7 x 13.5 mm. Differential includes pleomorphic adenoma or another benign parotid tumor versus an inflammatory lesion.',
    severity: 'significant',
  },
  {
    structureName: 'Cervical lymph nodes, levels IA, IB, and II',
    conceptId: 'FMA59803',
    finding:
      'Subcentimetric and centimetric lymph nodes at levels IA, IB, and II. The largest measures 12.1 x 10.9 mm and is likely reactive. No other significantly enlarged node is seen in the neck.',
    severity: 'mild',
  },
  {
    structureName: 'Base of skull',
    conceptId: 'FMA52736',
    finding: 'Visualized base of skull and cervical spine appear normal. No lytic or sclerotic lesion is seen.',
    severity: 'normal',
  },
  {
    structureName: 'Pharynx, larynx, and thyroid',
    conceptId: 'FMA52736',
    finding:
      'Nasopharynx, oropharynx, and laryngopharynx are normal, with no mass or compression of the air column. Epiglottis, valleculae, pyriform fossae, vocal cords, and larynx are normal. Visceral, retropharyngeal, parapharyngeal, prevertebral, and carotid spaces are normal. Both thyroid lobes and the isthmus are normal, with no focal lesion. Thyroid cartilage and cricoid cartilages are normal.',
    severity: 'normal',
  },
];

export const CT_NECK_LEFT_PAROTID_REPORT: ClinicalReportResult = {
  title: 'Radiology Summary: IMG20260929182228.jpg',
  modality: 'CT',
  studyRegion: 'Left parotid and skull base (above neck)',
  findings: CT_NECK_LEFT_PAROTID_FINDINGS,
  impression:
    'CT neck without contrast (02 Jun 2026): well-defined soft-tissue nodular lesion in the left parotid gland, 15.7 x 13.5 mm. Differential includes pleomorphic adenoma or another benign parotid tumor versus an inflammatory lesion. Further evaluation with USG and FNAC is advised. A 12.1 x 10.9 mm node at levels IA, IB, or II is likely reactive. Base of skull shows no lytic or sclerotic lesion. Advise clinical correlation.',
  primaryConceptId: 'FMA52748',
  targetPill: 'skeleton',
};

export const CT_NECK_LEFT_PAROTID_RECONSTRUCTION: ClinicalReconstruction = {
  id: 'ct-neck-20260602-left-parotid',
  sourceFile: 'IMG20260929182228.jpg',
  report: CT_NECK_LEFT_PAROTID_REPORT,
  highlightPartIds: [],
  side: 'left',
  showFractureLines: false,
  showHemosinus: false,
  showGranuloma: false,
  view: 'front',
  studyDate: '02/06/2026',
  caption: 'CT NECK · LEFT PAROTID NODULE 15.7 x 13.5 mm · NO FRACTURE',
  doctorNotes: {
    author: 'Dr. Ankur Aggarwal, MBBS, M.D (Consultant Radiologist), MCI/09-34285 · Star Radiology · 02/06/2026',
    date: '02/06/2026',
    category: 'CLINICAL NOTES · LEFT PAROTID',
    title: "Doctor's Clinical Notes — CT neck, left parotid nodule",
    type: 'Non-contrast CT — left parotid soft-tissue nodule',
    displacement: 'No displacement described. No lytic or sclerotic lesion in the visualized base of skull or cervical spine.',
    observation:
      'Mr. Oshonik, 26 year old male, patient ID 18120, referred by Dr. Shivesh Goyal. Non-contrast spiral CT from the base of skull to the sternoclavicular joint. A well-defined soft-tissue nodule in the left parotid measures 15.7 x 13.5 mm. The atlas has no parotid mesh, so the marker sits on the left mandibular ramus where that gland lies. Subcentimetric and centimetric nodes are present at levels IA, IB, and II; the largest is 12.1 x 10.9 mm and likely reactive. The pharynx, larynx, vocal cords, deep neck spaces, submandibular glands, thyroid, thyroid cartilage, and cricoid are normal.',
    plan: 'Needs further evaluation with USG and FNAC for better characterization. Advise clinical correlation. Not for medico-legal purpose.',
  },
};


const MR_BRAIN_PAT001_FINDINGS: ClinicalFinding[] = [
  {
    structureName: 'Trigeminal Nerves',
    conceptId: 'FMA50801',
    side: 'bilateral',
    finding: 'MR Trigeminal Nerves W/WO Cont. AX DWI 2000_ADC series.',
    severity: 'normal',
  },
];

export const MR_BRAIN_PAT001_REPORT: ClinicalReportResult = {
  title: 'DICOM Radiology Summary: PAT001',
  modality: 'MRI',
  studyRegion: 'Trigeminal Nerves',
  findings: MR_BRAIN_PAT001_FINDINGS,
  impression: 'MR Trigeminal Nerves without acute findings in this metadata summary.',
  primaryConceptId: 'FMA50801',
  targetPill: 'skeleton',
};

export const MR_BRAIN_PAT001_RECONSTRUCTION: ClinicalReconstruction = {
  id: 'dicom-mri-20260428-pat001',
  sourceFile: 'PAT001',
  report: MR_BRAIN_PAT001_REPORT,
  highlightPartIds: [],
  side: 'both',
  showFractureLines: false,
  showHemosinus: false,
  showGranuloma: false,
  view: 'front',
  studyDate: '28/04/2026',
  caption: 'DICOM MRI · MR TRIGEMINAL NERVES',
  doctorNotes: {
    author: 'MR ASSOCIATES SL 3T',
    date: '28/04/2026',
    category: 'DICOM SERIES · TRIGEMINAL NERVES',
    title: "Doctor's Clinical Notes — MR Trigeminal Nerves W/WO Cont",
    type: 'MRI - MR Trigeminal Nerves W/WO Cont',
    displacement: 'No acute displacement.',
    observation: 'Slices count: 1669, window preset: Custom (C:243 W:538), bone/soft-tissue details: MR Trigeminal Nerves.',
    plan: 'Please correlate clinically.',
  },
};

/**
 * Per-case bone tint. When a case is listed here, its map replaces the shared fracture red.
 * This normal PNS study lists no parts, so the right zygoma and maxilla are not painted red.
 */
export const CLINICAL_CASE_HIGHLIGHT_RGBA: Record<string, Record<string, [number, number, number, number]>> = {
  'xray-pns-om-20190608-normal': {},
  'mri-nose-pns-20190611-inf-turbinates': {},
  'cbct-right-maxilla-20190727-apical': {},
  'ct-neck-20260602-left-parotid': {},
  'dicom-mri-20260428-pat001': {},
};

// export const ACTIVE_CLINICAL_RECONSTRUCTION: ClinicalReconstruction = NCCT_HEAD_TRAUMA_RECONSTRUCTION;
export const ACTIVE_CLINICAL_RECONSTRUCTION: ClinicalReconstruction = CT_FACE_3D_RECONSTRUCTION;

const OSSEOUS_HIGHLIGHT_IDS = new Set<string>([
  NCCT_HEAD_HIGHLIGHT_PARTS.rightZygomatic,
  NCCT_HEAD_HIGHLIGHT_PARTS.rightMaxilla,
]);

export function isActiveReconstructionSource(filename: string): boolean {
  // return /IMG_20260921_161411/i.test(filename);
  return /IMG_20260929_074905/i.test(filename);
}

export function resolveClinicalReport(text: string, filename = ''): ClinicalReportResult {
  if (/PAT001/i.test(filename)) return MR_BRAIN_PAT001_REPORT;
  if (/IMG20260929182228/i.test(filename)) return CT_NECK_LEFT_PAROTID_REPORT;
  if (/IMG20260929180717/i.test(filename)) return CBCT_RIGHT_MAXILLA_REPORT;
  if (/IMG_20260929_172018/i.test(filename)) return MRI_NOSE_PNS_REPORT;
  if (/IMG_20260929_172007/i.test(filename)) return XRAY_PNS_OM_REPORT;
  if (/IMG_20260929_074905/i.test(filename)) return CT_FACE_3D_REPORT;
  if (/IMG_20260921_161411/i.test(filename)) return NCCT_HEAD_TRAUMA_REPORT;
  return parseClinicalReport(text, filename);
}

export function scenePatchFromReconstruction(
  recon: ClinicalReconstruction,
  atlas: Atlas,
  glow: boolean = true,
): Pick<
  SceneState,
  | 'selected'
  | 'isolate'
  | 'rotate'
  | 'view'
  | 'headFocus'
  | 'clinicalOverlay'
  | 'clinicalGlow'
  | 'clinicalSide'
  | 'clinicalHighlightPartIds'
  | 'activeClinicalCaseId'
> {
  const known = new Set(atlas.parts.map(p => p.id));
  const selected = recon.highlightPartIds.filter(id => OSSEOUS_HIGHLIGHT_IDS.has(id) && known.has(id));
  return {
    selected,
    isolate: false,
    rotate: false,
    view: recon.view ?? 'three-quarter',
    headFocus: true,
    clinicalOverlay: true,
    clinicalGlow: glow,
    clinicalSide: recon.side,
    clinicalHighlightPartIds: recon.highlightPartIds.filter(id => known.has(id)),
    activeClinicalCaseId: recon.id,
  };
}

export function resolvePrimaryConcept(atlas: Atlas, recon: ClinicalReconstruction) {
  const targetId = recon.report.primaryConceptId || 'FMA52892';
  return (
    atlas.concepts.find(c => c.id === targetId) ||
    atlas.concepts.find(c => c.name.toLowerCase().includes('zygomatic')) ||
    atlas.concepts[0]
  );
}

export function baselineScenePatch(): Pick<
  SceneState,
  | 'selected'
  | 'isolate'
  | 'rotate'
  | 'view'
  | 'headFocus'
  | 'clinicalOverlay'
  | 'clinicalGlow'
  | 'clinicalHighlightPartIds'
  | 'activeClinicalCaseId'
> {
  return {
    selected: [],
    isolate: false,
    rotate: false,
    view: 'three-quarter',
    headFocus: false,
    clinicalOverlay: false,
    clinicalGlow: false,
    clinicalHighlightPartIds: [],
    activeClinicalCaseId: undefined,
  };
}

export const CLINICAL_CASES: ClinicalReconstruction[] = [
  NCCT_HEAD_TRAUMA_RECONSTRUCTION,
  CT_FACE_3D_RECONSTRUCTION,
  XRAY_PNS_OM_RECONSTRUCTION,
  MRI_NOSE_PNS_RECONSTRUCTION,
  CBCT_RIGHT_MAXILLA_RECONSTRUCTION,
  CT_NECK_LEFT_PAROTID_RECONSTRUCTION,
  MR_BRAIN_PAT001_RECONSTRUCTION,
];

export function getClinicalCaseById(id: string): ClinicalReconstruction | undefined {
  return CLINICAL_CASES.find(c => c.id === id);
}
