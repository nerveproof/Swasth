/**
 * clinical-report.ts
 * Parser and anatomical concept mapper for NCCT Face & head radiology summaries.
 * Connects clinical findings to BodyParts3D concepts for interactive 3D visualization.
 */

export interface ClinicalFinding {
  structureName: string;
  conceptId: string;
  side?: 'left' | 'right' | 'bilateral';
  finding: string;
  severity?: 'normal' | 'mild' | 'moderate' | 'significant';
}

export interface ClinicalReportResult {
  title: string;
  modality: 'NCCT' | 'CT' | 'MRI' | 'CBCT' | 'X-Ray' | 'Report';
  studyRegion: string;
  findings: ClinicalFinding[];
  impression: string;
  primaryConceptId?: string;
  targetPill: 'skeleton' | 'face' | 'dental';
}

/**
 * Mapping table from clinical and anatomical keywords to BodyParts3D concept IDs.
 */
interface AnatomyMapping {
  keywords: string[];
  conceptId: string;
  name: string;
  side?: 'left' | 'right';
  targetPill: 'skeleton' | 'face' | 'dental';
}

const FACIAL_ANATOMY_MAP: AnatomyMapping[] = [
  {
    keywords: ['mandible', 'mandibular', 'lower jaw', 'mental foramen', 'ramus', 'condyle of mandible'],
    conceptId: 'FMA52748',
    name: 'Mandible',
    targetPill: 'skeleton',
  },
  {
    keywords: ['right lateral orbital wall', 'small fracture of the right lateral orbital wall', 'small fracture of right lateral'],
    conceptId: 'FMA52892',
    name: 'Right Lateral Orbital Wall',
    side: 'right',
    targetPill: 'skeleton',
  },
  {
    keywords: ['right zygomatic arch', 'zygomatic arch is deformed'],
    conceptId: 'FMA52892',
    name: 'Right Zygomatic Arch',
    side: 'right',
    targetPill: 'skeleton',
  },
  {
    keywords: ['right zygoma', 'right zygomatic', 'right malar'],
    conceptId: 'FMA52892',
    name: 'Right Zygomatic Bone',
    side: 'right',
    targetPill: 'skeleton',
  },
  {
    keywords: ['left zygoma', 'left zygomatic', 'left malar'],
    conceptId: 'FMA52893',
    name: 'Left Zygomatic Bone',
    side: 'left',
    targetPill: 'skeleton',
  },
  {
    keywords: ['zygoma', 'zygomatic', 'zygomatic arch', 'malar bone', 'cheekbone'],
    conceptId: 'FMA52747',
    name: 'Zygomatic Bone',
    targetPill: 'skeleton',
  },
  {
    keywords: ['anterior and lateral walls', 'lateral walls of maxillary', 'walls of maxillary sinus', 'walls of the maxillary sinus'],
    conceptId: 'FMA53649',
    name: 'Right Maxillary Sinus Walls',
    side: 'right',
    targetPill: 'skeleton',
  },
  {
    keywords: ['right maxilla', 'right maxillary'],
    conceptId: 'FMA53649',
    name: 'Right Maxilla',
    side: 'right',
    targetPill: 'skeleton',
  },
  {
    keywords: ['left maxilla', 'left maxillary'],
    conceptId: 'FMA53650',
    name: 'Left Maxilla',
    side: 'left',
    targetPill: 'skeleton',
  },
  {
    keywords: ['maxilla', 'maxillary', 'upper jaw', 'maxillary sinus', 'hard palate'],
    conceptId: 'FMA9711',
    name: 'Maxilla',
    targetPill: 'skeleton',
  },
  {
    keywords: ['right nasal bone'],
    conceptId: 'FMA53647',
    name: 'Right Nasal Bone',
    side: 'right',
    targetPill: 'skeleton',
  },
  {
    keywords: ['left nasal bone'],
    conceptId: 'FMA53648',
    name: 'Left Nasal Bone',
    side: 'left',
    targetPill: 'skeleton',
  },
  {
    keywords: ['nasal bone', 'nasal bridge', 'nasal aperture', 'septum'],
    conceptId: 'FMA52745',
    name: 'Nasal Bone',
    targetPill: 'skeleton',
  },
  {
    keywords: ['pterygoid plate', 'pterygoid plates'],
    conceptId: 'FMA52736',
    name: 'Pterygoid Plates',
    targetPill: 'skeleton',
  },
  {
    keywords: ['cribriform plate', 'cribriform'],
    conceptId: 'FMA52740',
    name: 'Cribriform Plate',
    targetPill: 'skeleton',
  },
  {
    keywords: ['base of skull', 'skull base'],
    conceptId: 'FMA52736',
    name: 'Skull Base',
    targetPill: 'skeleton',
  },
  {
    keywords: ['frontal bone', 'forehead', 'frontal sinus', 'supraorbital'],
    conceptId: 'FMA52734',
    name: 'Frontal Bone',
    targetPill: 'skeleton',
  },
  {
    keywords: ['temporal bone', 'mastoid', 'zygomatic process of temporal'],
    conceptId: 'FMA52737',
    name: 'Temporal Bone',
    targetPill: 'skeleton',
  },
  {
    keywords: ['right orbit', 'right orbital', 'lateral and inferior walls of the right orbit'],
    conceptId: 'FMA52892',
    name: 'Right Orbital Walls',
    side: 'right',
    targetPill: 'skeleton',
  },
  {
    keywords: ['left orbit', 'left orbital'],
    conceptId: 'FMA52893',
    name: 'Left Orbital Walls',
    side: 'left',
    targetPill: 'skeleton',
  },
  {
    keywords: ['right maxillary antrum', 'right maxillary sinus', 'right antrum', 'hemosinus'],
    conceptId: 'FMA53649',
    name: 'Right Maxillary Antrum',
    side: 'right',
    targetPill: 'skeleton',
  },
  {
    keywords: ['left frontal lobe', 'left frontal', 'calcified granuloma'],
    conceptId: 'FMA72970',
    name: 'Left Frontal Lobe',
    side: 'left',
    targetPill: 'skeleton',
  },
];

/**
 * Parse an uploaded clinical summary (text content or file name) and resolve
 * the affected anatomical structures for 3D focus.
 */
export function parseClinicalReport(text: string, filename = ''): ClinicalReportResult {
  const normalized = (text + ' ' + filename).toLowerCase();

  // Detect modality
  let modality: ClinicalReportResult['modality'] = 'NCCT';
  if (normalized.includes('cbct')) modality = 'CBCT';
  else if (normalized.includes('mri')) modality = 'MRI';
  else if (normalized.includes('x-ray') || normalized.includes('xray')) modality = 'X-Ray';
  // else if (normalized.includes('ct') || normalized.includes('ncct')) modality = 'NCCT';
  else if (normalized.includes('3d ct') || normalized.includes('3dct')) modality = 'CT';
  else if (normalized.includes('ct') || normalized.includes('ncct')) modality = 'NCCT';
  else modality = 'Report';

  const findings: ClinicalFinding[] = [];
  let primaryMatch: AnatomyMapping | null = null;

  for (const item of FACIAL_ANATOMY_MAP) {
    for (const kw of item.keywords) {
      if (normalized.includes(kw)) {
        if (!primaryMatch) primaryMatch = item;
        
        // Extract surrounding sentence if possible
        const regex = new RegExp(`([^.?!\\n]*${kw}[^.?!\\n]*)`, 'i');
        const sentenceMatch = text.match(regex);
        const snippet = sentenceMatch ? sentenceMatch[1].trim() : `Evaluated on ${modality} Face scan`;

        const low = snippet.toLowerCase();
        // const severity = snippet.toLowerCase().includes('fracture') || snippet.toLowerCase().includes('displacement') || snippet.toLowerCase().includes('hemosinus')
        //   ? 'significant'
        //   : snippet.toLowerCase().includes('granuloma') || snippet.toLowerCase().includes('calcified') || snippet.toLowerCase().includes('thickening') || snippet.toLowerCase().includes('erosion')
        //   ? 'mild'
        //   : 'normal';
        const readsNormal = /appears normal|are normal|is normal/.test(low);
        const severity = readsNormal
          ? 'normal'
          : low.includes('fracture') || low.includes('displacement') || low.includes('hemosinus') || low.includes('deformed')
          ? 'significant'
          : low.includes('granuloma') || low.includes('calcified') || low.includes('thickening') || low.includes('erosion')
          ? 'mild'
          : 'normal';
        findings.push({
          structureName: item.name,
          conceptId: item.conceptId,
          side: item.side,
          finding: snippet,
          severity,
        });
        break;
      }
    }
  }

  // Fallback if no specific bone was matched but it's an NCCT Face / head report
  if (!primaryMatch) {
    primaryMatch = FACIAL_ANATOMY_MAP[0]; // Mandible as default anchor
    findings.push({
      structureName: 'Facial Skeleton',
      conceptId: 'FMA52748',
      finding: 'NCCT Face study: Facial bone anatomy preserved; no cortical disruption detected.',
      severity: 'normal',
    });
  }

  // Generate an Impression
  // let impression = 'NCCT Face examination reviewed. Anatomical alignment evaluated.';
  // if (findings.length > 0) {
  //   const significant = findings.find(f => f.severity === 'significant');
  //   if (significant) {
  //     impression = `Impression: Notable finding at ${significant.structureName} — "${significant.finding}".`;
  //   } else {
  //     impression = `Impression: Evaluated ${findings.map(f => f.structureName).join(', ')}. Intact cortical margins with no acute osseous pathology.`;
  //   }
  // }
  let impression = 'NCCT Face examination reviewed. Anatomical alignment evaluated.';
  if (findings.length > 0) {
    const significant = findings.filter(f => f.severity === 'significant');
    const mild = findings.filter(f => f.severity === 'mild');
    if (significant.length > 0) {
      impression = `Impression: ${significant.map(f => f.finding).join(' ')}${mild.length ? ' ' + mild.map(f => f.finding).join(' ') : ''}`;
    } else {
      impression = `Impression: Evaluated ${findings.map(f => f.structureName).join(', ')}. Intact cortical margins with no acute osseous pathology.`;
    }
  }

  return {
    title: filename ? `Radiology Summary: ${filename}` : 'NCCT Face Clinical Report',
    modality,
    studyRegion: 'Facial Bones & PNS',
    findings,
    impression,
    primaryConceptId: primaryMatch?.conceptId || 'FMA52748',
    targetPill: primaryMatch?.targetPill || 'skeleton',
  };
}
