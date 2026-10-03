# Fast path for a new above-neck film

Use this path for every new upload: CT, NCCT, X-ray, CBCT, or MRI. An MRI report is the same job as a CT report. Do not start a DICOM viewer, volume renderer, or MPR view.

The run script names the film and the next `fractureGroup` number. Trust that. The photograph or PDF is the report. `TASK.json` often says "intact cortical margins" when the image was not read. Ignore that sentence when a film is present.

## Do this only

1. Read the named film. Stay above the neck (face, sinuses, orbits, skull, brain).
2. In `app/clinical-reconstruction.ts`, append one report and one `ClinicalReconstruction`. Add one filename check at the top of `resolveClinicalReport`. Append the object to `CLINICAL_CASES`. Leave `ACTIVE_CLINICAL_RECONSTRUCTION` on the 3D CT FACE case.
3. In `app/clinical-reconstruction-scene.ts`, add `fractureGroupN` and `anchorsN` after the existing groups. Add one `visible` line in `applyFlags` and one branch in `labelAnchors`. Do not edit groups 1–3 or their segments.
4. Run `npm run check`. Then, if the app is already open, select the new case once and one older case once. Stop.

## Do not

- Do not comment out, disable, or replace an existing case, group, or label.
- Do not rewrite All, Skeleton, Trigeminal, Face, or Organs.
- Do not open or edit the DICOM tab, `dicom-viewer`, or series browser.
- Do not re-read the atlas, `page.tsx`, or `scene.tsx` unless a step below says so.
- Do not run `npm run build`. Do not tour every systems pill. Do not resize the browser for a phone pass.
- Do not commit or push.

## Case object

Match this shape. These fields exist. `highlightColor`, `cameraTarget`, `cameraDirection`, and `cameraDistance` do not.

```typescript
export const NEXT_REPORT: ClinicalReportResult = {
  title: 'Radiology Summary: <filename>',
  modality: 'MRI', // NCCT | CT | MRI | CBCT | X-Ray | Report
  studyRegion: '<above-neck region>',
  findings: [
    { structureName: '<name>', conceptId: 'FMA00000', side: 'right', finding: '<sentence from the report>', severity: 'significant' },
  ],
  impression: '<impression from the film>',
  primaryConceptId: 'FMA00000',
  targetPill: 'skeleton',
};

export const NEXT_RECONSTRUCTION: ClinicalReconstruction = {
  id: 'mri-YYYYMMDD-short-name',
  sourceFile: '<filename>',
  report: NEXT_REPORT,
  highlightPartIds: [],
  side: 'both',
  showFractureLines: false,
  showHemosinus: false,
  showGranuloma: false,
  view: 'front',
  studyDate: 'DD/MM/YYYY',
  caption: 'MRI · <SHORT FINDING>',
  doctorNotes: {
    author: '<reporting doctor>',
    date: 'DD/MM/YYYY',
    category: 'CLINICAL NOTES · <REGION>',
    title: "Doctor's Clinical Notes — <study>",
    type: '<modality and finding>',
    displacement: '<displacement, or "No displacement described.">',
    observation: '<what the film says>',
    plan: '<the film plan, or "Please correlate clinically.">',
  },
};
```

Always set `doctorNotes`. If it is missing, the notes sheet falls back to an orbital-fracture surgical plan.

`showFractureLines` is true only when the film says fracture. `showHemosinus` only for blood in a sinus. `showGranuloma` only for a calcified granuloma. A normal study, and an MRI that describes neither, keeps all three false and uses an empty segment list.

If this case must not paint the right zygoma or right maxilla red, add its id to `CLINICAL_CASE_HIGHLIGHT_RGBA` with `{}`. Those two bones are red for every case that is not listed there. No other scene change.

## Scene append

Frame already used by the viewer: +Y cranial, +Z anterior, +X patient left, right is −X. Head landmarks sit near Y 1.45–1.65.

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
  { id: 'next-finding', label: '<short label>', world: new T.Vector3(0, 1.58, 0.06), kind: 'normal' },
];
```

`kind` is `fracture`, `hemosinus`, `granuloma`, or `normal`. Use `normal` for a normal structure. Use `fracture` only for a fracture. For an MRI lesion that is none of those, add `'lesion'` to the kind union, one CSS rule `.clinical-label[data-kind=lesion]`, and `if (a.kind === 'lesion') return true` in the label filter. That is the only extra edit.

Known parts, so you do not scan the atlas: FJ3392 right zygoma, FJ3375 right maxilla, FJ3269 left maxilla, FJ3287 left zygoma, FJ3200 frontal bone, FJ2557 septal cartilage. Put a marker inside the bone that the report names. One node check against `public/models/atlas.json` bounds is enough when the part is not in that list.

Wire:

```typescript
fractureGroupN.visible = (activeCaseId === '<new-id>') && flags.fractureLines;
```

Add the new id as one more branch in the existing `labelAnchors` chain. Do not replace the chain.

## Log

Append a short entry to `Upload/CHANGES.md`: film, impression, new case id, files touched, and the `npm run check` result. Append the case to `Upload/RECONSTRUCTION.json` without deleting the cases already there.

## Still required

- Previous cases stay in `CLINICAL_CASES` and stay selectable.
- Frozen systems All, Skeleton, Trigeminal, Face, and Organs stay as they are.
- Reconstruction stays above the neck.
- `npm run check` must exit 0.
- Do not push or commit secrets.
