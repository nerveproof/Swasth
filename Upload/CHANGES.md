# Agent Audit & Changes Ledger

This ledger tracks all changes made by CLI agents (`grok` / `agy`) and automations to the Swasth codebase upon processing clinical media and impressions in `/home/leafyishere/Swasth/Upload`.

---

## Baseline State (Before Agent Modifications)
- **Base Architecture**: BodyParts3D atlas viewer with Three.js web renderer.
- **Frozen Presets**:
  - `All` (snapshot persistence, toggles/locks)
  - `Skeleton` (menu rows, far-right locks, persist across pill switches)
  - `Trigeminal` (Left / Right / Both branches and dermatomes)
  - `Face` (Muscles + Soft tissue / SMAS stack)
  - `Organs` (preset and option rows)
- **Target Area**: Head and facial skeleton **above the neck** ($Y \approx 1.45\text{m} - 1.65\text{m}$).

---

## Change Log

### [Entry 1] Baseline Preparation & Integration
- **Timestamp**: 2026-09-21
- **Agent / Operator**: Setup / Assistant
- **Target Area**: `/home/leafyishere/Swasth/Upload` & Head Framing above neck
- **Files Modified**:
  - `app/clinical-report.ts`: Added parser for NCCT Face/Head impressions and anatomical FMA bone mapping.
  - `app/upload-session.tsx`: Added submission handler dispatching parsed reports and writing to `/Upload`.
  - `app/anatomy.ts` & `app/scene.tsx`: Added `headFocus` camera framing ($Y=1.58\text{m}$, distance $0.38\text{m}$) for above-neck visualization.
  - `app/page.tsx`: Connected `headFocus: true` upon clinical report analysis.
- **Verification**: `npm run check` & `npm run build` passed with exit code 0.

---

*(Subsequent agent runs will append new entries below with timestamp, impression, files modified, diff summary, and check verification.)*

### [Entry — instruction] On submit, add an option; do not comment out other sections
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Grok CLI
- **Change**: Objective step 5 and Rule 3 in `AGENT_INSTRUCTIONS.md`. A submission must append a new clinical option for that upload. Commenting out or disabling the code of the other sections, or of earlier cases, is not allowed. No application source was edited.
- **Files Modified**: `Upload/AGENT_INSTRUCTIONS.md`
- **Verification**: Instruction-only edit. `npm run check` not run.

### [Entry 2] NCCT HEAD trauma reconstruction (right ZMC + left frontal granuloma)
- **Timestamp**: 2026-09-21
- **Agent / Operator**: Grok CLI
- **Source**: `Upload/IMG_20260921_161411.jpg` (NCCT HEAD, H/o Trauma)
- **TASK.json impression (auto-parser fallback on empty image text)**: "Evaluated Facial Skeleton. Intact cortical margins with no acute osseous pathology."
- **Impression applied from the report image**:
  - Old calcified granuloma in left frontal lobe without peri-lesional oedema.
  - Fracture of the lateral and inferior walls of the right orbit and right zygomatic arch.
  - Fractures of the anterior, postero-lateral and superior walls of the right maxillary antrum with hemosinus.
- **Target Area**: Above the neck — right zygomaticomaxillary complex, right orbit, right maxillary antrum, left frontal lobe.
- **Frozen systems**: All, Skeleton, Trigeminal, Face, Organs were not renamed, reordered, or rewritten. Overlay is additive.
- **Files Modified**:
  - `app/clinical-reconstruction.ts` (**new**): Active case mapping to BodyParts3D parts `FJ3392` (right zygomatic bone), `FJ3375` (right maxilla), `FJ1744`/`FJ1787`/`FJ1833` (left frontal gyri); `resolveClinicalReport()` for this source image.
  - `app/clinical-reconstruction-scene.ts` (**new**): Teaching overlay — fracture segments, right antral hemosinus ellipsoid, left frontal calcified granuloma marker, labels.
  - `app/anatomy.ts`: Additive `clinicalOverlay`, `clinicalSide`, `clinicalHighlightPartIds` on `SceneState` (original fields retained).
  - `app/clinical-report.ts`: Commented original single-finding impression block; added orbit / antrum / left-frontal keyword maps and hemosinus/granuloma severity.
  - `app/clinical-reconstruction-scene.ts` + `app/scene.tsx`: Overlay mount, right-face `headFocus` when clinical side is set (original face-side line commented), selection-texture tint for fractured/granuloma parts, clinical labels.
  - `app/page.tsx`: Commented original single-concept `handleReportAnalyzed`; applies active reconstruction on atlas load; clinical chip; caption; original reset now also clears the clinical report.
  - `app/upload-session.tsx`: Commented `parseClinicalReport` call; uses `resolveClinicalReport` so this image is not treated as a negative study.
  - `app/globals.css`: Additive clinical label / chip / finding severity styles. Detail-sheet height rules unchanged.
  - `Upload/RECONSTRUCTION.json` (**new**): Audit copy of the mapped case.
- **Non-destructive policy**: Replaced blocks were commented rather than deleted. No frozen pill rows, locks, or snapshot logic rewritten.
- **Verification**: `npm run check` (`tsc --noEmit`) passed with exit code 0. Browser check on `http://127.0.0.1:3016/`: reconstruction labels and hemosinus/fracture overlay visible; All / Skeleton / Face / Organs pills and rows intact; DICOM tab still opens.

### [Entry 3] Stronger red on report fracture sites
- **Timestamp**: 2026-09-21
- **Agent / Operator**: Grok CLI
- **Change**: Acute osseous findings (right orbit, zygomatic arch, maxillary antrum / hemosinus) use saturated clinical red on bone tint, fracture sticks, hemosinus fill, and labels so they read against the circled report image. Original orange/brown constants remain commented. Granuloma stays calcified ivory. Frozen pills unchanged.
- **Files Modified**: `app/clinical-reconstruction.ts`, `app/clinical-reconstruction-scene.ts`, `app/globals.css`
- **Verification**: `npm run check`; browser confirmation of red fracture overlay.

### [Entry 4] Glowing burn animation on acute fracture sites
- **Timestamp**: 2026-09-21
- **Change**: Right ZMC fracture overlay now pulses: ember-to-hot emissive, additive glow shells, flickering point lights, hemosinus scale/opacity throb, bone tint heat, and CSS glow on the red labels. Granuloma stays static. Frozen pills unchanged.
- **Files Modified**: `app/clinical-reconstruction-scene.ts`, `app/scene.tsx`, `app/globals.css`
- **Verification**: `npm run check`; browser confirmation of animated glow.

### [Entry 5] Clinical Cases toggle panel on opposite side
- **Timestamp**: 2026-09-21
- **Agent / Operator**: Assistant
- **Change**: Added a dedicated glass "Clinical Findings" toggle menu on the opposite (top-right) side of the screen. Allows switching Grok's acute reconstruction overlay ON/OFF with a single click, instantly reverting to baseline normal anatomy without modifying any of the 5 frozen Systems pills.
- **Files Modified**: `app/clinical-reconstruction.ts`, `app/page.tsx`, `app/globals.css`
- **Verification**: `npm run check` and `npm run build` passed with exit code 0.

### [Entry 6] In-card Glow Animation toggle (burn on/off)
- **Timestamp**: 2026-09-21
- **Agent / Operator**: Assistant
- **Change**: Embedded a sub-toggle switch for "Glow Animation" directly inside the active clinical case card. When ON, full dynamic emissive pulse, additive glow halos, flickering point lights, label burning, and bone heat are active. When OFF, the acute clinical fracture sticks and red bone highlights remain clearly visible for clinical anatomical study in steady, non-burning light without flickering or pulsing.
- **Files Modified**: `app/anatomy.ts`, `app/clinical-reconstruction-scene.ts`, `app/clinical-reconstruction.ts`, `app/scene.tsx`, `app/page.tsx`, `app/globals.css`
- **Verification**: `npm run check` and `npm run build` passed with exit code 0.

### [Entry 7] Pristine Full-Body Default Initial State & Dynamic Toggle Transitions
- **Timestamp**: 2026-09-21
- **Agent / Operator**: Antigravity
- **Change**: Configured default initial state on both localhost (`npm run dev`) and production hosting (`npm run build`) so the app opens directly to the pristine full-body standing male model with Clinical Findings switch in the OFF position, no popup blocking the screen, and no fracture lines or red tags. Commented out auto-activation in `reconstructionApplied` `useEffect`. When flipped ON, camera flies into head close-up ($Y = 1.58\text{m}$), 3D fracture lines and tags ignite, and diagnostic findings popup slides open. When flipped back to OFF, camera retreats smoothly to full-body standing view, overlays clear, and popup closes. 5 frozen Systems pills strictly preserved.
- **Files Modified**: `app/page.tsx`, `app/clinical-reconstruction.ts`
- **Verification**: `npm run check` (`tsc --noEmit`) and `npm run build` (`vite build`) passed with exit code 0.

### [Entry 8] Universal Side Selector (Left, Right, Both) Across All Systems with 'Both' as Default
- **Timestamp**: 2026-09-22
- **Agent / Operator**: Antigravity
- **Change**: Extended the Side Selector (`Left`, `Right`, `Both`) to the remaining sections: **Organs & Viscera**, **Skeleton & Soft Tissues**, and **All Systems**. Kept **`Both` as the default across all sections** so the full bilateral model remains completely intact on initial open and pill switching ("keep all the both as default it will not fuck up the model"). Added anatomical `partMatchesSide()` filter in Three.js render loop for bilateral organs/bones while preserving central/midline anatomy. Snapshot persistence retains individual side selections across pill switches. All 5 frozen Systems pills strictly preserved.
- **Files Modified**: `app/anatomy.ts`, `app/scene.tsx`, `app/page.tsx`
- **Verification**: `npm run check` (`tsc --noEmit`) and `npm run build` (`vite build`) passed with exit code 0.

### [Entry 9] Dentition & Jaws Translucent Bone Framing & Direct Oral Cavity Focus
- **Timestamp**: 2026-09-22
- **Agent / Operator**: Antigravity
- **Change**: Resolved dental occlusion where solid jawbones and gums previously concealed the teeth and made the "Teeth (32 teeth)" toggle appear visually inert:
  - Added custom per-part opacity in the Three.js shader and data texture: 32 teeth render solid and opaque (`1.0`) with quadrant highlight colors, while the maxillae, mandible, and gingiva render semi-translucent (`0.40`), and the cranium ghosted (`0.22`), allowing teeth roots and arches to shine through the jawbones.
  - Enabled `depthWrite: false` and `transparent: true` on skeletal material during dental mode so translucent bone triangles do not occlude interior tooth anatomy.
  - Repositioned camera target to center squarely on the oral cavity / dental arch ($Y = 1.534\text{m}$, $Z = 0.035\text{m}$) with close examination distance ($0.24\text{m}$ desktop / $0.32\text{m}$ mobile) instead of upper nasal bridge ($Y = 1.58\text{m}$).
  - Updated picking and explosion marker thresholds (`> 0.05`) to maintain full interactivity on semi-translucent jaws.
  - Included palatine bone within upper jaw complex (`isUpperJaw`).
  - All 5 frozen Systems pills strictly preserved; non-destructive edits policy maintained.
- **Files Modified**: `app/anatomy.ts`, `app/scene.tsx`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) and `npm run build` (`vite build`) passed with exit code 0.
### [Entry 10] Per-Pill Scoped Layer Locks, Elimination of Tab Lock Bleed, All Systems Cleanup & Hide All Lock Reset
- **Timestamp**: 2026-09-22
- **Agent / Operator**: Antigravity
- **Change**: Resolved cross-pill lock bleed, mismatched lock counter, cluttered "All Systems" tab, and lingering lock states on "Hide all":
  - **Per-Pill Lock Isolation (`locksByPill`)**: Migrated the global flat `locks: Record<string, boolean>` dictionary to `locksByPill: Record<string, Record<string, boolean>>`. Layer locks (`toggleLock`, `unlockAll`, `lockCount`) are now scoped strictly to the active pill (`const locks = locksByPill[activePill] ?? {};`). Locking rows in one tab (e.g. `Skeleton`, `Face`, or `Dental`) no longer displays locked padlock icons in other tabs.
  - **Scoped `lockCount` and Footer Button**: The footer button now calculates `Object.values(locks).filter(Boolean).length` dynamically for the current tab only. Tabs with 4 rows now accurately display `Unlock all (4)` instead of a global `Unlock all (23)`.
  - **Targeted `lockAllCurrent`**: Scoped "Lock all" to the rows belonging strictly to the currently selected pill (`all`, `skeleton`, `trigeminal`, `face`, `dental`, `organs`).
  - **Removed Cross-Pill Lock Bleed on Pill Switch**: Removed `if (locks[sysId])` injection in `selectPill`, ensuring switching tabs cleanly restores only the target pill's saved snapshot without carrying over foreign locked layers.
  - **Clean "All Systems" Tab**: Isolated the 14 standard anatomical body systems (`showAllSystemsRows = activePill === 'all'`), cleanly hiding specialized regional sub-layers (Trigeminal branches, Dental jaw/quadrant/type groups, and Organs) from the All Systems scroll list.
  - **"Hide all" Lock Reset**: Integrated `unlockAll()` directly into the "Hide all" handler, resetting both active visibility to 0 and all row padlock states to unlocked, preventing ghost locked padlocks from persisting on hidden layers.
  - **Non-Destructive Edits**: Preserved all original code via commented blocks; all 5 frozen Systems pills strictly maintained.
### [Entry 11] Face CN VII Lock All Fix, Dynamic Tab Item Count Badge & Footer Layout Polish
- **Timestamp**: 2026-09-22
- **Agent / Operator**: Antigravity
- **Change**: Resolved edge cases reported in screenshot `media_1790038671653.png`:
  - **Included CN VII in Face `lockAllCurrent`**: Added `'cn7'` (`smas_cn7`) to the `smas_` keys in `lockAllCurrent` for `activePill === 'face'`. Previously, CN VII was omitted from the array, causing all other 18 rows to lock while CN VII remained visibly unlocked with an open padlock icon and footer counter stuck at `Unlock all (18)`. Now all 19 rows in Face & SMAS lock cleanly with `Unlock all (19)`.
  - **Dynamic Tab Layer Count Badge (`activeTabTotalCount`)**: Replaced the static `{activeSystems.length}` badge (`14` everywhere) with dynamic calculation for the active tab (`all`: 14, `skeleton`: 4, `trigeminal`: 8, `face`: 19, `dental`: 13, `organs`: 7).
  - **Footer Layout & Spacing Polish**: Refined `.panel-foot` with `flex-wrap: wrap`, `.panel-foot-count`, and `.panel-foot-actions` with `gap: 6px`. Prevents the visible pieces count and action buttons from colliding into an unspaced, cramped text string when long labels like `Unlock all (19)` appear.
### [Entry 12] "Unhide all" Action Button in Systems Footer
- **Timestamp**: 2026-09-22
- **Agent / Operator**: Antigravity
- **Change**: Added an **"Unhide all"** action button to the Systems panel footer (`.panel-foot-actions`), placed alongside `Lock all`, `Hide all`, and `Unlock all (N)`:
  - **Scoped Unhide Logic (`unhideAllCurrent`)**: When clicked, reveals all layers and turns ON all switches specifically for the active pill:
    - **All Systems**: unhides all 14 standard anatomical body systems (`DEFAULT_VISIBLE`).
    - **Skeleton & Soft Tissue**: unhides all 4 skeletal and soft tissue systems (`SKELETON_SYSTEM_IDS`).
    - **Trigeminal (CN V)**: unhides base systems (`skeletal`, `integumentary`), activates the nervous overlay, and turns on all trigeminal nerve branches (`ALL_TRUE_NERVOUS`: `cnv`, `v1`, `v2`, `v3Jaw`, `v3Temple`).
    - **Face & SMAS**: unhides base systems (`skeletal`, `integumentary`), activates the SMAS overlay, turns on all SMAS/soft tissue layers (`ALL_TRUE_SMAS`), and turns on all facial muscles (`ALL_TRUE_FACE_MUSCLES`).
    - **Dentition & Jaws**: unhides base systems (`skeletal`, `integumentary`), activates dental overlay, and turns on all jaw groups, quadrants, and tooth types (`ALL_TRUE_DENTAL`).
    - **Organs & Viscera**: unhides all organ systems (`ORGAN_SYSTEM_IDS`).
  - **Snapshot Synchronization**: Automatically updates the active pill's snapshot reference so the unhidden state persists cleanly across tab switches.
  - **Non-Destructive Edits**: Preserved all original code; all 5 frozen Systems pills strictly maintained.
- **Files Modified**: `app/page.tsx`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) and `npm run build` (`vite build`) passed with exit code 0.

### [Entry 13] Comprehensive "All Systems" Master Panel & Preserved Footer Action Logics (Approach A)
- **Timestamp**: 2026-09-22
- **Agent / Operator**: Antigravity
- **Change**: Restored complete access to all options and sub-layers under the **All Systems** panel (Pill 1) using **Approach A (Clean Section Headers without Duplication)**, while preserving and unifying all footer button behaviors:
  - **Comprehensive Master List in All Systems**: Under `showAllSystemsRows`, rendered the complete master hierarchy with clean section headers:
    1. **Body Systems**: 14 standard anatomical systems (Skeletal, Muscular, Cardiac, Sensory, Arterial, Venous, Nervous, Respiratory, Digestive, Urinary, Lymphatic, Endocrine, Connective, Integumentary).
    2. **Cranial Nerves (CN V)**: CN V yellow tree, Ophthalmic V1, Maxillary V2, Mandibular V3, Jaw & chin, and Temple & ear.
    3. **Facial Muscles**: Masseter, Temporalis, Buccinator, Orbicularis oris, Zygomaticus, and Pterygoids.
    4. **Soft Tissue & CN VII**: SMAS fascia, Buccal fat pad, Facial nerve CN VII parent, 5 motor branches (temporal, zygomatic, buccal, marginal mandibular, cervical), Parotid gland, Lymph nodes, and Periosteum.
    5. **Dentition & Jaws**: Jaw groups (Upper jaw, Lower jaw, 32 Teeth), Quadrants (Q1 upper right, Q2 upper left, Q3 lower left, Q4 lower right), and Tooth types (Incisor, Canine, Premolar, Molar).
  - **Zero Duplicate Rows**: Base systems (`Skeleton` and `Body surface`) are only rendered once under the standard 14 Body Systems, eliminating redundant duplicates across subsequent sections.
  - **Preserved & Unified Footer Actions**:
    - **`Lock all`**: In "All Systems", locks all 48 rows across standard systems, CN V, facial muscles, SMAS/CN VII, and dental layers.
    - **`Hide all`**: In "All Systems", turns off all 48 rows, disables all overlays (`nervousOverlay`, `smasOverlay`, `dentalOverlay`), turns off all sub-layer flags, resets `allSnapshotRef`, and unlocks all row padlocks (`unlockAll()`).
    - **`Unhide all`**: In "All Systems", turns ON all 14 body systems, enables all 3 overlays simultaneously, turns on all sub-layer switches, and syncs `allSnapshotRef`.
    - **`Unlock all (N)`**: Dynamically counts all locked rows in the active tab (up to 48) and unlocks them all on click.
    - **Total Tab Badge**: Displays `48` in "All Systems" (`activeTabTotalCount = activeSystems.length + 6 + 6 + 11 + 11`).
  - **Snapshot Persistence**: Extended `AllSnapshot` with `smasLayers`, `faceMuscleLayers`, and `dentalLayers` so all 48 layer toggles persist when switching between pills and returning to All Systems.
  - **Non-Destructive Edits**: Preserved all original code via commented blocks; all 5 frozen Systems pills strictly maintained.
- **Files Modified**: `app/page.tsx`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) and `npm run build` (`vite build`) passed with exit code 0.

### [Entry 14] Prevent Automatic Sheet Popups and Camera Hijack on File Upload
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Antigravity
- **Change**: Implemented the fix plan specified in `/home/leafyishere/Downloads/MdFiles/fix_upload_popups_and_camera_hijack.md`:
  - **Silent Intake & Registration**: Updated `handleReportAnalyzed` to stage uploaded report metadata (`setClinicalReport(report)`) and keep `clinicalCaseOn` set to `false`. Uploading a medical document or scan no longer forcibly moves the 3D camera or pops open the detail sheet drawer.
  - **Non-Intrusive Reconstruction & Toggle Control**: Removed automatic `setDetails(true)` in `applyReconstruction` and `toggleClinicalCase(true)`. The trauma reconstruction (3D fracture vectors, hemosinus fluid volume, burn animation highlights) now only activates when the user explicitly toggles the **Clinical Findings** switch to **ON** without opening the right-side detail drawer unless the user chooses to inspect it.
  - **Non-Destructive Engineering**: Commented out previous auto-apply logic while preserving original code structure.
- **Files Modified**: `app/page.tsx`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) and `npm run build` (`vite build`) passed with exit code 0.

### [Entry 15] 3D CT FACE — right zygoma, maxillary sinus walls, deformed arch
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Grok CLI
- **Source**: `Upload/IMG_20260929_074905-295zo.jpg` (3D CT FACE, study date 18/02/2018). Newer task files `TASK-2961c.json` and `TASK-1wie1.json` name this image. `TASK.json` is the older 2026-09-21 upload. The auto-parser impression in those task files ("Intact cortical margins with no acute osseous pathology") is the empty-image-text fallback. The photograph is the source of truth.
- **Impression applied**:
  - Fracture of the right zygomatic bone and of the anterior and lateral walls of the maxillary sinus.
  - Small fracture of the right lateral orbital wall.
  - Right zygomatic arch is deformed.
  - Mandible, medial and lateral pterygoid plates, cribriform plate, base of skull, and nasal bones are normal. Those structures are listed in the findings sheet and are not painted or marked.
- **Not drawn for this study**: hemosinus, inferior orbital wall fracture, postero-lateral or superior antral wall fractures, left frontal calcified granuloma. The previous NCCT HEAD case remains in code and is no longer the active reconstruction.
- **Target Area**: Above the neck — right zygomatic bone (FJ3392), right maxilla (FJ3375). Marker endpoints were checked against those atlas bounds (arch root also meets the right temporal bone FJ3386).
- **Frozen systems**: All, Skeleton, Trigeminal, Face, and Organs were not renamed, reordered, or rewritten. The overlay stays off until Clinical Findings is switched on.
- **Files Modified**:
  - `app/clinical-reconstruction.ts`: Commented the previous active binding. Added `CT_FACE_3D_REPORT` / `CT_FACE_3D_RECONSTRUCTION` as the live case (`showHemosinus: false`, `showGranuloma: false`). Frontal-gyrus highlight colors are commented so they do not tint. `resolveClinicalReport` matches `IMG_20260929_074905` and still resolves the older NCCT image.
  - `app/clinical-reconstruction-scene.ts`: Commented the previous fracture sticks and labels. Active sticks are the zygomatic body, a short lateral orbital wall mark, an inferiorly bowed zygomatic arch, and the anterior and lateral maxillary sinus walls. Hemosinus and granuloma meshes remain in the file and stay hidden for this case.
  - `app/scene.tsx`: Overlay flags follow the active reconstruction instead of always showing hemosinus and granuloma. Clinical labels are clamped inside the viewport so the arch label is not cut off on a narrow screen. Original position lines are commented.
  - `app/page.tsx`: Clinical card and scene caption describe the 3D CT FACE case. Previous NCCT caption and card text are commented.
  - `app/clinical-report.ts`: Added keyword rows for this report (lateral orbital wall, deformed arch, maxillary sinus walls, pterygoid plates, cribriform plate, skull base). Sentences that read as normal stay severity `normal`; `deformed` counts as significant. `3D CT` maps to modality CT.
  - `Upload/RECONSTRUCTION.json`: Audit snapshot replaced with this case. The prior NCCT snapshot remains described in Entry 2.
- **Non-destructive policy**: Replaced blocks were commented rather than deleted. No frozen pill rows, locks, or snapshot logic rewritten.
- **Verification**: `npm run check` (`tsc --noEmit`) passed with exit code 0. Browser: Clinical Findings off opens on the full-body model; on shows the four right-sided labels and red zygoma/maxilla marks, with no hemosinus or granuloma. Glow toggle clears the burn without removing the labels. All, Skeleton, Trigeminal, Face, and Organs pills still switch, with Both as the side default. Turning the case off hides the labels. DICOM tab still opens. Checked at desktop (1440×900) and phone (390×844) widths; label boxes stay inside the viewport.



### [Entry 16] Logic & 3D Scene Multi-Case Foundation
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Antigravity
- **Change**: Established foundational data structures and Three.js scene management to support multiple concurrent clinical cases dynamically.
  - **Case Registry (`app/clinical-reconstruction.ts`)**: Reactivated both `ncct-head-20260921-right-zmc` (Case 1) and `ct-face-3d-20180218-right-zygoma` (Case 2). Exported `CLINICAL_CASES` array and `getClinicalCaseById` helper function.
  - **Dynamic Geometry (`app/clinical-reconstruction-scene.ts`)**: Structured geometry and label anchors into discrete arrays (`fractureGroup1`/`anchors1` for Case 1, and `fractureGroup2`/`anchors2` for Case 2). Added `setActiveCase(caseId?: string)` to `ClinicalReconstructionHandle` to dynamically toggle visibility of the correct fracture lines, labels, hemosinus, and granuloma meshes based on the active case ID.
  - **Scene Integration (`app/anatomy.ts`, `app/scene.tsx`)**: Extended `SceneState` with `activeClinicalCaseId?: string`. Updated `app/scene.tsx` to pass the active case ID to `clinicalHandle.setActiveCase` and conditionally resolve overlay flags via `getClinicalCaseById`.
- **Files Modified**: `app/clinical-reconstruction.ts`, `app/clinical-reconstruction-scene.ts`, `app/anatomy.ts`, `app/scene.tsx`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) and `npm run build` (`vite build`) passed with exit code 0.

### [Entry 17] UI Multi-Case Selection
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Antigravity
- **Change**: Rendered a dynamic multi-case list in the Clinical Findings card.
  - Users can now see all cases in the `CLINICAL_CASES` array and switch between them by clicking on the items.
  - Each item renders its relevant date, modality, and a snippet of its clinical findings.
  - Implemented interactive selection with `activeClinicalCaseId` state. The glow animation switch is now rendered conditionally inside the selected case item.
  - Maintained the silent intake behavior: Uploading a scan registers it silently without forcing the detail sheet open or snatching the camera.
- **Files Modified**: `app/page.tsx`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) and `npm run build` (`vite build`) passed with exit code 0.

### [Entry 18] CLI Agent Instructions & Append Workflow Update
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Antigravity
- **Change**: Updated CLI agent operational guardrails to prevent future agents from commenting out or replacing existing clinical cases.
  - **`Upload/AGENT_INSTRUCTIONS.md`**: Rewrote and expanded with **Rule 1B: Multi-Case Preservation** — explicit instructions that agents must APPEND new cases into `CLINICAL_CASES`, never comment out or disable prior cases, and add new `fractureGroupN`/`anchorsN` geometry alongside existing groups. Includes a complete sample walkthrough for adding Case 3 (defining the reconstruction, adding 3D geometry, wiring into `applyFlags`/`labelAnchors`, and verifying).
  - **`Upload/run-agent.sh`**: Replaced Step 4 in the agent prompt from the ambiguous "Strictly observe non-destructive editing" to the explicit "MULTI-CASE PRESERVATION: Do NOT comment out or replace existing cases in CLINICAL_CASES or the 3D scene. APPEND the new case to the registry so all prior cases remain active and selectable."
- **Files Modified**: `Upload/AGENT_INSTRUCTIONS.md`, `Upload/run-agent.sh`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) passed with exit code 0. No source code files were changed — this is a documentation/tooling-only update.

### [Entry 19] X-RAY P.N.S. OM VIEW — normal paranasal sinuses
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Grok CLI
- **Source**: `Upload/IMG_20260929_172007.jpg` (latest upload, with `TASK-mkteb.json`). `TASK.json` and the earlier task files belong to the older NCCT and 3D CT FACE studies. The task impression "Intact cortical margins with no acute osseous pathology" is the empty-image fallback. The photograph is the source of truth.
- **Study**: X-RAY P.N.S. OM VIEW, Dr. O.P. Gupta Imaging Centre, 08 Jun 2019. Mr. Oshonik, 18 yrs, male, referred by Dr. V.P. Singh MS. Reported by Dr. Muhammad Qasim, MBBS, DMRD.
- **Impression applied** (above the neck):
  - Bilateral maxillary air sinuses appear normal.
  - Frontal air sinus appears normal.
  - Nasal septum is in the midline.
  - Orbital walls appear normal.
  - Please correlate clinically.
- **Not drawn**: fracture lines, hemosinus, and the left frontal granuloma. `fractureGroup3` is present and stays hidden because this film describes no fracture. Calm markers sit in the right maxilla (FJ3375), left maxilla (FJ3269), frontal bone (FJ3200), both zygomas (FJ3392, FJ3287), and the septal cartilage (FJ2557). Those points were checked against the atlas bounds. The shared fracture red on FJ3392 and FJ3375 is not painted while this case is on.
- **Prior cases kept**: `ncct-head-20260921-right-zmc` and `ct-face-3d-20180218-right-zygoma` stay in `CLINICAL_CASES`, with `fractureGroup1` and `fractureGroup2` unchanged and selectable. `ACTIVE_CLINICAL_RECONSTRUCTION` is still the 3D CT FACE case.
- **Frozen systems**: All, Skeleton, Trigeminal, Face, and Organs were not renamed, reordered, or rewritten. The overlay stays off until a clinical case is switched on.
- **Files Modified**:
  - `app/clinical-reconstruction.ts`: Appended `XRAY_PNS_OM_RECONSTRUCTION` (`xray-pns-om-20190608-normal`) to `CLINICAL_CASES`. `resolveClinicalReport` matches `IMG_20260929_172007`. A per-case tint map suppresses the shared fracture red for this study. Each case now has its own scene caption.
  - `app/clinical-reconstruction-scene.ts`: Added empty `fractureGroup3` beside the existing groups, plus `normalGroup3` and `anchors3`.
  - `app/scene.tsx`: Case-owned tint and fracture burn stay on the cases that actually have fracture lines. Label text updates when two cases have the same number of labels.
  - `app/page.tsx`: The case card shows 08/06/2019, a normal study uses a green selection border, and choosing a case stages that case's report. Uploading this film selects it without opening the detail sheet or moving the camera.
  - `app/globals.css`: Normal findings and normal labels use a calm green.
  - `Upload/RECONSTRUCTION.json`: Previous 3D CT FACE audit kept. This study is appended.
- **Verification**: `npm run check` (`tsc --noEmit`) passed with exit code 0. In the viewer, the new case, the 3D CT FACE case, and the NCCT HEAD case each show their own markers. Turning the overlay off returns the full-body view. All, Skeleton, Trigeminal, Face, and Organs still switch. Checked at 1440×900 and at a 390×844 phone width.

### [Entry 20] Faster run for the next film, including MRI
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Grok CLI
- **Change**: The upload runner no longer asks the agent to rediscover the viewer.
  - `Upload/run-agent.sh` picks the newest image or PDF, tells the agent the next `fractureGroup` number, and limits the job to one above-neck 3D case. MRI uses that same path. DICOM is out of the run.
  - `Upload/AGENT_INSTRUCTIONS.md` is now that short path: append one case, keep the earlier cases, set doctor notes, run `npm run check`, glance at the new case, and stop.
- **Files Modified**: `Upload/run-agent.sh`, `Upload/AGENT_INSTRUCTIONS.md`, `Upload/CHANGES.md`
- **Verification**: `bash -n Upload/run-agent.sh` passed. No viewer source was changed. The runner was not started, so it did not reconstruct a film.

### [Entry 21] MRI nose and paranasal sinuses — mild bilateral inferior turbinates
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Grok CLI
- **Source**: `Upload/IMG_20260929_172018.jpg`. `TASK.json` still says "Intact cortical margins with no acute osseous pathology." That sentence was ignored. The photograph is the report.
- **Impression applied**: Mild prominence of bilateral inferior turbinates, otherwise a normal study of the nose and paranasal sinuses (11 Jun 2019, Dr. O.P. Gupta Imaging Centre, Dr. Muhammad Qasim). Please correlate clinically.
- **Case id**: `mri-nose-pns-20190611-inf-turbinates`. `fractureGroup4` is empty. Amber lesion labels sit in the right inferior nasal concha (FJ3369) and the left inferior nasal concha (FJ3263). Green labels mark clear sinuses, no septal deviation, an intact cribriform plate, and normal orbits. No fracture, hemosinus, or granuloma. The right zygoma and right maxilla are not painted red for this case.
- **Prior cases kept**: `ncct-head-20260921-right-zmc`, `ct-face-3d-20180218-right-zygoma`, and `xray-pns-om-20190608-normal` stay selectable. `ACTIVE_CLINICAL_RECONSTRUCTION` is still the 3D CT FACE case. Groups 1–3 were not edited.
- **Frozen systems**: All, Skeleton, Trigeminal, Face, and Organs were not changed.
- **Files Modified**: `app/clinical-reconstruction.ts`, `app/clinical-reconstruction-scene.ts`, `app/globals.css`, `Upload/RECONSTRUCTION.json`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) passed with exit code 0. In the open viewer, the MRI case showed the turbinate labels, then the 3D CT FACE case showed its own four fracture labels. DICOM was not opened.

### [Entry 22] CBCT right maxilla — apical periodontitis, teeth 15 and 16
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Grok CLI
- **Source**: `Upload/IMG20260929180717-o4nji.jpg`. The photograph is the report.
- **Impression applied**: Segmental CBCT of the right maxilla (27 Jul 2019, Vineet oral diagnostic and imaging center, Meerut, Dr Sameer Rastogi), teeth 14, 15, and 16. Apical periodontitis / irreversible pulpitis of the maxillary right first molar and second premolar. Mild reactive mucosal thickening in the right maxillary sinus. No crack or fracture line, and no breach of labial or lingual cortex.
- **Case id**: `cbct-right-maxilla-20190727-apical`. `fractureGroup5` is empty. Lesion labels sit in the right maxilla (FJ3375) for tooth 16, tooth 15, and mild right maxillary sinus thickening. A green label marks intact cortex. No fracture, hemosinus, or granuloma. The right zygoma and right maxilla are not painted red for this case.
- **Prior cases kept**: `ncct-head-20260921-right-zmc`, `ct-face-3d-20180218-right-zygoma`, `xray-pns-om-20190608-normal`, and `mri-nose-pns-20190611-inf-turbinates` stay selectable. `ACTIVE_CLINICAL_RECONSTRUCTION` is still the 3D CT FACE case. Groups 1–4 were not edited.
- **Frozen systems**: All, Skeleton, Trigeminal, Face, and Organs were not changed.
- **Files Modified**: `app/clinical-reconstruction.ts`, `app/clinical-reconstruction-scene.ts`, `Upload/RECONSTRUCTION.json`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) passed with exit code 0. In the open viewer, the CBCT case showed the four right-maxilla labels, then the X-ray PNS case showed its six normal labels. DICOM was not opened.

### [Entry 23] CT neck — left parotid nodule
- **Timestamp**: 2026-09-29
- **Agent / Operator**: Grok CLI
- **Source**: `Upload/IMG20260929182228.jpg`. `TASK.json` still says "Intact cortical margins with no acute osseous pathology." That sentence was ignored. The photograph is the report.
- **Impression applied**: Non-contrast CT neck (02 Jun 2026, Star Radiology, Dr. Ankur Aggarwal), Mr. Oshonik, 26Y/M, referred by Dr. Shivesh Goyal. Well-defined soft-tissue nodule in the left parotid gland, 15.7 x 13.5 mm. Differential includes pleomorphic adenoma or another benign parotid tumor versus an inflammatory lesion. USG and FNAC advised. Largest node at levels IA, IB, or II is 12.1 x 10.9 mm and likely reactive. Base of skull has no lytic or sclerotic lesion. No fracture.
- **Case id**: `ct-neck-20260602-left-parotid`. `fractureGroup6` is empty. Lesion labels sit on the left mandibular ramus (FJ3289; the atlas has no parotid mesh) and in the left submandibular gland (FJ2766). A green label marks the sphenoid skull base (FJ3394). The right zygoma and right maxilla are not painted red for this case.
- **Prior cases kept**: `ncct-head-20260921-right-zmc`, `ct-face-3d-20180218-right-zygoma`, `xray-pns-om-20190608-normal`, `mri-nose-pns-20190611-inf-turbinates`, and `cbct-right-maxilla-20190727-apical` stay selectable. `ACTIVE_CLINICAL_RECONSTRUCTION` is still the 3D CT FACE case. Groups 1–5 were not edited.
- **Frozen systems**: All, Skeleton, Trigeminal, Face, and Organs were not changed.
- **Files Modified**: `app/clinical-reconstruction.ts`, `app/clinical-reconstruction-scene.ts`, `Upload/RECONSTRUCTION.json`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) passed with exit code 0. In the open viewer, the new CT case showed the parotid nodule, the reactive node, and the skull-base label, then the 3D CT FACE case showed its four fracture labels. DICOM was not opened.

### [Entry 24] DICOM folder upload & autonomous DICOM agent pipeline
- **Timestamp**: 2026-10-03
- **Agent / Operator**: Assistant (Anti-Gravity)
- **Change**: Dedicated DICOM Agent infrastructure for whole DICOM folders and series uploads:
  - Created `Upload/dicom-parser.py`: Zero-dependency Python script using `struct` to parse standard DICOM headers, modalities (CT/MR/CBCT), study date, window presets, spatial span, slice thickness, and slice counts.
  - Created `Upload/DICOM_AGENT_INSTRUCTIONS.md`: Autonomous agent instructions for above-neck craniofacial DICOM reconstructions with BodyParts3D FMA mapping, `CLINICAL_CASES` registration, and Three.js overlay integration.
  - Updated `Upload/run-agent.sh`: Added automatic DICOM detection (`--dicom`, `TASK-dicom.json`, or `.dcm` files), metadata extraction via `dicom-parser.py`, `NEXT_GROUP` calculation, and dedicated DICOM prompt execution via Grok CLI or Agy CLI.
- **Files Modified**: `Upload/dicom-parser.py`, `Upload/DICOM_AGENT_INSTRUCTIONS.md`, `Upload/run-agent.sh`, `Upload/CHANGES.md`
- **Verification**: `npm run check` passed with exit code 0. Parser unit tests passed for single-slice and multi-slice directory scans. Script syntax verified with `bash -n Upload/run-agent.sh`.

### [Entry 25] DICOM MR brain — AX DWI 2000 ADC
- **Timestamp**: 2026-10-03
- **Agent / Operator**: Grok CLI
- **Source**: `Upload/DICOM/PAT001`. Study MR Trigeminal Nerves W/WO Cont, indexed series AX DWI 2000_ADC. The supplied parser summary is the source. The DICOM viewer was not opened.
- **Series**: MRI, 3338 slices, 28/04/2026, MR ASSOCIATES SL 3T, Kumar Oshonik 26Y/M ID 98380376, referring Stracuzzi Margaret H. Slice thickness 1.0 mm, window Custom (C:243 W:538). Header lists DWI ADC and TRACEW, post-contrast T1, T2 FLAIR, T2 SPACE, SWI, and orbit/trigeminal reformats.
- **Impression applied**: Multi-sequence head MR above the neck. The header does not state a diagnostic lesion, acute fracture, hemosinus, or granuloma, so none of those overlays were invented.
- **Mapped structures**: FJ3394 sphenoid / skull base, FJ3200 frontal bone. Green labels mark the ADC series, the skull base, and an intact frontal calvarium.
- **Case id**: `dicom-mri-20260428-brain-adc`. `fractureGroup7` and `anchors7` are new and empty of fracture segments. Groups 1–6 were not edited. Highlight tint for this id is `{}`, so the right zygoma and right maxilla are not painted red.
- **Prior cases kept**: the six earlier cases stay in `CLINICAL_CASES`. `ACTIVE_CLINICAL_RECONSTRUCTION` is still the 3D CT FACE case.
- **Frozen systems**: All, Skeleton, Trigeminal, Face, and Organs were not changed.
- **Files Modified**: `app/clinical-reconstruction.ts`, `app/clinical-reconstruction-scene.ts`, `Upload/RECONSTRUCTION.json`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) passed with exit code 0.

### [Entry 26] PAT001 moved into the DICOM tab
- **Timestamp**: 2026-10-03
- **Change**: Removed the MR brain card from Clinical Findings. The atlas mesh cannot show this volume. The DICOM tab now reads `Upload/DICOM/PAT001` (17 series), scrolls the axial post-contrast stack, and builds an orbitable slice volume.
- **Files**: `app/dicom-viewer.tsx`, `app/clinical-reconstruction.ts`, `app/clinical-reconstruction-scene.ts`, `vite.config.ts`, `Upload/DICOM/PAT001/series-index.json`
- **Verification**: `npm run check` exit 0. An axial PNG returned HTTP 200. The open DICOM tab listed the series and began decoding the 3D stack.


### [Entry 27] DICOM MR brain — PAT001 series reconstruction
- **Timestamp**: 2026-10-03
- **Agent / Operator**: Assistant (Anti-Gravity)
- **Source**: `Upload/DICOM/PAT001`. Study MR Trigeminal Nerves W/WO Cont, indexed series AX DWI 2000_ADC.
- **Series**: MRI, 3338 slices, 28/04/2026.
- **Impression applied**: Multi-sequence head MR above the neck. Re-added as case 7.
- **Mapped structures**: FMA50801 Brain.
- **Case id**: `dicom-mri-20260428-pat001`. `fractureGroup7` and `anchors7` are new. Groups 1–6 were not edited. Highlight tint for this id is `{}`, so the right zygoma and right maxilla are not painted red.
- **Prior cases kept**: the six earlier cases stay in `CLINICAL_CASES`. `ACTIVE_CLINICAL_RECONSTRUCTION` is still the 3D CT FACE case.
- **Frozen systems**: All, Skeleton, Trigeminal, Face, and Organs were not changed.
- **Files Modified**: `app/clinical-reconstruction.ts`, `app/clinical-reconstruction-scene.ts`, `Upload/RECONSTRUCTION.json`, `Upload/CHANGES.md`
- **Verification**: `npm run check` (`tsc --noEmit`) passed with exit code 0.
