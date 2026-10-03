# Fast path for a DICOM folder or series upload

Use this path when a DICOM series, folder of `.dcm` slices, or CD export is uploaded into `Upload/`. Stay above the neck (craniofacial skeleton, orbits, paranasal sinuses, jaws, skull base, brain).

The runner script names the DICOM folder or files and the next `fractureGroup` number (`NEXT_GROUP`). Trust that.

---

## Do this only

1. **Extract Metadata**:
   Run the zero-dependency parser to inspect the series:
   ```bash
   python3 Upload/dicom-parser.py Upload/<dicom-folder-or-file>
   ```
   Note the modality (`CT`, `MR`, `CBCT`), `studyDate`, `seriesDescription`, `windowPreset`, `sliceThicknessMm`, `patient` information, and slice count.

2. **Map Above-Neck Anatomy**:
   Map findings to BodyParts3D parts above the neck ($Y \approx 1.45\text{m} - 1.65\text{m}$):
   - `FJ3392`: Right zygoma
   - `FJ3375`: Right maxilla & maxillary sinus
   - `FJ3287`: Left zygoma
   - `FJ3269`: Left maxilla & maxillary sinus
   - `FJ3200`: Frontal bone & frontal sinuses
   - `FJ2557`: Septal cartilage (nasal septum)
   - `FJ3394`: Sphenoid bone & skull base
   - `FJ3369`: Right inferior nasal concha (turbinate)
   - `FJ3263`: Left inferior nasal concha (turbinate)
   - `FJ3289`: Left mandibular ramus / angle
   - `FJ2766`: Left submandibular region

3. **In `app/clinical-reconstruction.ts`**:
   - Append one `ClinicalReportResult` and one `ClinicalReconstruction`.
   - Add folder / file match at the top of `resolveClinicalReport()`.
   - Append the reconstruction object to `CLINICAL_CASES`.
   - Leave `ACTIVE_CLINICAL_RECONSTRUCTION` on `CT_FACE_3D_RECONSTRUCTION`.

4. **In `app/clinical-reconstruction-scene.ts`**:
   - Add `fractureGroupN` and `anchorsN` after existing groups (matching `NEXT_GROUP`).
   - Add one visibility line in `applyFlags`:
     ```typescript
     fractureGroupN.visible = (activeCaseId === '<new-id>') && flags.fractureLines;
     ```
   - Add one branch in the `labelAnchors()` switch/if chain:
     ```typescript
     if (activeCaseId === '<new-id>') return anchorsN;
     ```
   - Do NOT edit groups 1–6 or their existing segments.

5. **Verify**:
   Run `npm run check`. Stop.

---

## Do not

- Do not comment out, disable, or replace an existing case, group, or label.
- Do not rewrite All, Skeleton, Trigeminal, Face, or Organs.
- Do not open or edit the DICOM tab, `dicom-viewer`, or series browser.
- Do not re-read the atlas, `page.tsx`, or `scene.tsx`.
- Do not run `npm run build`. Do not resize or tour pills.
- Do not commit or push.

---

## Case Object Schema

Match this exact shape in `app/clinical-reconstruction.ts`:

```typescript
export const NEXT_DICOM_REPORT: ClinicalReportResult = {
  title: 'DICOM Radiology Summary: <folder-or-series-name>',
  modality: 'CT', // CT | MRI | CBCT | NCCT | X-Ray
  studyRegion: '<region above neck, e.g. Craniofacial / Paranasal Sinuses / Orbits>',
  findings: [
    {
      structureName: '<anatomical structure>',
      conceptId: 'FMA00000',
      side: 'right', // 'left' | 'right' | 'bilateral'
      finding: '<finding described from DICOM series>',
      severity: 'significant', // 'normal' | 'mild' | 'moderate' | 'significant'
    },
  ],
  impression: '<concise clinical impression>',
  primaryConceptId: 'FMA00000',
  targetPill: 'skeleton', // 'skeleton' | 'face' | 'dental'
};

export const NEXT_DICOM_RECONSTRUCTION: ClinicalReconstruction = {
  id: 'dicom-<modality-lower>-YYYYMMDD-<short-name>',
  sourceFile: '<folder-name-or-file>',
  report: NEXT_DICOM_REPORT,
  highlightPartIds: [],
  side: 'both', // 'left' | 'right' | 'both'
  showFractureLines: false, // true ONLY if acute bone fracture present
  showHemosinus: false,     // true ONLY if sinus fluid level present
  showGranuloma: false,     // true ONLY if calcified granuloma present
  view: 'front',            // 'front' | 'three-quarter'
  studyDate: 'DD/MM/YYYY',
  caption: 'DICOM <MODALITY> · <SHORT FINDING>',
  doctorNotes: {
    author: '<reporting radiologist / DICOM institution>',
    date: 'DD/MM/YYYY',
    category: 'DICOM SERIES · <REGION>',
    title: "Doctor's Clinical Notes — <series description>",
    type: '<modality and key findings>',
    displacement: '<displacement, or "No acute displacement.">',
    observation: '<series observation: slices count, window preset, bone/soft-tissue details>',
    plan: '<clinical plan, or "Please correlate clinically.">',
  },
};
```

Always provide complete `doctorNotes`. If missing, the notes sheet falls back to an unrelated orbital fracture template.

If this case must not paint the right zygoma (`FJ3392`) or right maxilla (`FJ3375`) red, add its id to `CLINICAL_CASE_HIGHLIGHT_RGBA` with `{}`:
```typescript
CLINICAL_CASE_HIGHLIGHT_RGBA['<new-id>'] = {};
```

---

## Scene Overlay Append

Coordinate frame used by Three.js viewer:
- $+Y$ Cranial ($Y \approx 1.45\text{m} - 1.65\text{m}$ for head and face)
- $+Z$ Anterior
- $+X$ Patient Left (Patient Right is $-X$)

In `app/clinical-reconstruction-scene.ts`:

```typescript
const fractureGroupN = new T.Group();
fractureGroupN.name = 'clinical-fracture-lines-caseN';
fractureGroupN.visible = false;
const segmentsN: Array<{a:[number, number, number]; b:[number, number, number]}> = [];
segmentsN.forEach(seg => {
  const mesh = segmentMesh(seg.a, seg.b, fractureMat);
  geometries.push(mesh.geometry);
  fractureGroupN.add(mesh);
  const glow = segmentMesh(seg.a, seg.b, glowMat, 0.0036);
  geometries.push(glow.geometry);
  fractureGroupN.add(glow);
});
group.add(fractureGroupN);

const anchorsN: ClinicalLabelAnchor[] = [
  { id: 'dicom-finding-1', label: '<short label>', world: new T.Vector3(x, y, z), kind: 'normal' },
];
```

`kind` must be one of: `'fracture'`, `'hemosinus'`, `'granuloma'`, `'normal'`, or `'lesion'`.
- Use `'normal'` for intact / clear structures (renders in calm green).
- Use `'fracture'` only for acute fracture lines (renders in clinical red).
- Use `'lesion'` for soft-tissue nodules, mucosal thickening, or periodontitis (renders in amber).

---

## Audit & Log

1. Append a concise entry to `Upload/CHANGES.md`:
   - Study / DICOM series name
   - Modality, slices count, and date
   - Impression and mapped anatomical structures
   - New case ID and files modified
   - Result of `npm run check`
2. Append the new case object into `Upload/RECONSTRUCTION.json` without modifying existing cases.

---

## Still Required

- All previous cases (1 through 6) must remain in `CLINICAL_CASES` and remain fully selectable.
- Frozen systems `All`, `Skeleton`, `Trigeminal`, `Face`, and `Organs` stay 100% intact.
- Reconstructions stay strictly above the neck.
- `npm run check` (`tsc --noEmit`) must exit with 0 errors.
