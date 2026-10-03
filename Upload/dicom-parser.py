#!/usr/bin/env python3
"""
Upload/dicom-parser.py
Zero-dependency lightweight DICOM header parser for Swastha.
Extracts metadata, series information, geometry, and windowing from DICOM files and folders.

Usage:
    python3 Upload/dicom-parser.py <path-to-file-or-folder>
Outputs clean JSON to stdout.
"""

import os
import sys
import json
import struct

# Standard DICOM Tags for header extraction
KNOWN_TAGS = {
    (0x0008, 0x0020): ("StudyDate", "str"),
    (0x0008, 0x0030): ("StudyTime", "str"),
    (0x0008, 0x0050): ("AccessionNumber", "str"),
    (0x0008, 0x0060): ("Modality", "str"),
    (0x0008, 0x0070): ("Manufacturer", "str"),
    (0x0008, 0x0080): ("InstitutionName", "str"),
    (0x0008, 0x0090): ("ReferringPhysicianName", "str"),
    (0x0008, 0x1030): ("StudyDescription", "str"),
    (0x0008, 0x103E): ("SeriesDescription", "str"),
    (0x0010, 0x0010): ("PatientName", "str"),
    (0x0010, 0x0020): ("PatientID", "str"),
    (0x0010, 0x0030): ("PatientBirthDate", "str"),
    (0x0010, 0x0040): ("PatientSex", "str"),
    (0x0010, 0x1010): ("PatientAge", "str"),
    (0x0018, 0x0015): ("BodyPartExamined", "str"),
    (0x0018, 0x0050): ("SliceThickness", "float"),
    (0x0018, 0x5100): ("PatientPosition", "str"),
    (0x0020, 0x0010): ("StudyID", "str"),
    (0x0020, 0x0011): ("SeriesNumber", "int"),
    (0x0020, 0x0013): ("InstanceNumber", "int"),
    (0x0020, 0x0032): ("ImagePositionPatient", "float_list"),
    (0x0020, 0x0037): ("ImageOrientationPatient", "float_list"),
    (0x0028, 0x0010): ("Rows", "int"),
    (0x0028, 0x0011): ("Columns", "int"),
    (0x0028, 0x0030): ("PixelSpacing", "float_list"),
    (0x0028, 0x1050): ("WindowCenter", "float_list"),
    (0x0028, 0x1051): ("WindowWidth", "float_list"),
    (0x0028, 0x1052): ("RescaleIntercept", "float"),
    (0x0028, 0x1053): ("RescaleSlope", "float"),
}

EXPLICIT_LONG_VRS = {b"OB", b"OW", b"OF", b"OD", b"SQ", b"UT", b"UN", b"UC", b"UR"}
KNOWN_VRS = {
    b"AE", b"AS", b"AT", b"CS", b"DA", b"DS", b"DT", b"FL", b"FD",
    b"IS", b"LO", b"LT", b"OB", b"OD", b"OF", b"OW", b"PN", b"SH",
    b"SL", b"SQ", b"SS", b"ST", b"TM", b"UI", b"UL", b"UN", b"UR",
    b"US", b"UT", b"UV"
}

def clean_string(val):
    if isinstance(val, bytes):
        val = val.decode("utf-8", errors="ignore")
    return val.strip().strip("\x00")

def parse_tag_value(val_bytes, type_hint, vr=None):
    s = clean_string(val_bytes)
    if type_hint == "int":
        try:
            return int(s.split("\\")[0])
        except (ValueError, IndexError):
            return s
    elif type_hint == "float":
        try:
            return float(s.split("\\")[0])
        except (ValueError, IndexError):
            return s
    elif type_hint == "float_list":
        try:
            parts = [p.strip() for p in s.split("\\") if p.strip()]
            return [float(p) for p in parts]
        except ValueError:
            return s
    return s

def parse_dicom_file(filepath, max_bytes=512 * 1024):
    """
    Parses headers from a single DICOM file.
    Stops before large pixel data (0x7FE0, 0x0010).
    """
    try:
        with open(filepath, "rb") as f:
            data = f.read(max_bytes)
    except Exception as e:
        return None

    if len(data) < 132:
        return None

    pos = 0
    # Check for DICM preamble
    if data[128:132] == b"DICM":
        pos = 132
    else:
        # Check if direct DICOM without 128-byte preamble
        # First tag is usually (0x0008, ...) or (0x0002, ...)
        tag_g, tag_e = struct.unpack_from("<HH", data, 0)
        if tag_g in (0x0002, 0x0008):
            pos = 0
        else:
            return None

    elements = {}
    is_explicit = True
    transfer_syntax = None

    while pos + 4 <= len(data):
        tag_g, tag_e = struct.unpack_from("<HH", data, pos)
        pos += 4

        # Reached pixel data: can stop reading header
        if (tag_g, tag_e) == (0x7FE0, 0x0010):
            break

        # Group length elements or delimiter elements
        if tag_g == 0xFFFE:
            # Item tags
            if pos + 4 <= len(data):
                item_len = struct.unpack_from("<I", data, pos)[0]
                pos += 4
                if item_len != 0xFFFFFFFF and item_len < len(data):
                    pos += item_len
            continue

        # Outside group 0x0002, check if implicit VR is required by transfer syntax
        in_meta_group = (tag_g == 0x0002)
        explicit_mode = True if in_meta_group else is_explicit

        val_len = 0
        vr = None

        if explicit_mode:
            if pos + 2 > len(data):
                break
            vr_candidate = data[pos:pos+2]
            if vr_candidate in KNOWN_VRS:
                vr = vr_candidate
                pos += 2
                if vr in EXPLICIT_LONG_VRS:
                    pos += 2  # 2 reserved bytes
                    if pos + 4 > len(data):
                        break
                    val_len = struct.unpack_from("<I", data, pos)[0]
                    pos += 4
                else:
                    if pos + 2 > len(data):
                        break
                    val_len = struct.unpack_from("<H", data, pos)[0]
                    pos += 2
            else:
                # Fallback to implicit if unexpected VR encountered
                if pos + 4 > len(data):
                    break
                val_len = struct.unpack_from("<I", data, pos)[0]
                pos += 4
        else:
            if pos + 4 > len(data):
                break
            val_len = struct.unpack_from("<I", data, pos)[0]
            pos += 4

        # Undefined length
        if val_len == 0xFFFFFFFF:
            continue

        if val_len < 0 or pos + val_len > len(data):
            break

        val_bytes = data[pos:pos+val_len]
        pos += val_len

        # Check Transfer Syntax UID
        if (tag_g, tag_e) == (0x0002, 0x0010):
            transfer_syntax = clean_string(val_bytes)
            if transfer_syntax == "1.2.840.10008.1.2":
                is_explicit = False
            else:
                is_explicit = True

        if (tag_g, tag_e) in KNOWN_TAGS:
            name, type_hint = KNOWN_TAGS[(tag_g, tag_e)]
            elements[name] = parse_tag_value(val_bytes, type_hint, vr)

    return elements

def determine_window_preset(window_center, window_width):
    if not window_center or not window_width:
        return "Unknown"
    wc = window_center[0] if isinstance(window_center, list) else window_center
    ww = window_width[0] if isinstance(window_width, list) else window_width
    try:
        wc, ww = float(wc), float(ww)
    except (ValueError, TypeError):
        return "Unknown"

    if wc >= 250 and ww >= 1000:
        return "Bone (Craniofacial / Sinus)"
    elif 30 <= wc <= 50 and 60 <= ww <= 100:
        return "Brain / Intracranial"
    elif 30 <= wc <= 60 and 200 <= ww <= 450:
        return "Soft Tissue (Neck / Face)"
    elif wc <= -400 and ww >= 1000:
        return "Lung / Air Sinus"
    return f"Custom (C:{int(wc)} W:{int(ww)})"

def scan_dicom_path(target_path):
    """
    Scans a single file or directory for DICOM series and slices.
    """
    target_path = os.path.abspath(target_path)
    if not os.path.exists(target_path):
        return {"error": f"Path not found: {target_path}"}

    files_to_check = []
    if os.path.isfile(target_path):
        files_to_check.append(target_path)
        base_dir = os.path.dirname(target_path)
    else:
        base_dir = target_path
        for root, _, filenames in os.walk(target_path):
            for fn in filenames:
                fp = os.path.join(root, fn)
                # Ignore obvious non-dicom assets
                if fn.endswith((".json", ".md", ".sh", ".py", ".png", ".jpg", ".txt")):
                    continue
                files_to_check.append(fp)

    valid_slices = []
    for fp in files_to_check:
        hdr = parse_dicom_file(fp)
        if hdr and (hdr.get("Modality") or hdr.get("StudyDate") or hdr.get("SeriesDescription") or hdr.get("ImagePositionPatient")):
            rel = os.path.relpath(fp, base_dir)
            hdr["_filepath"] = rel
            valid_slices.append(hdr)

    if not valid_slices:
        return {
            "isDicom": False,
            "path": target_path,
            "message": "No valid DICOM headers found with standard tags or DICM preamble."
        }

    # Sort slices by InstanceNumber or ImagePositionPatient Z
    def slice_sort_key(s):
        pos = s.get("ImagePositionPatient")
        if isinstance(pos, list) and len(pos) >= 3:
            return (0, pos[2])
        inst = s.get("InstanceNumber")
        if isinstance(inst, int):
            return (1, inst)
        return (2, s.get("_filepath", ""))

    valid_slices.sort(key=slice_sort_key)

    primary = valid_slices[0]
    modalities = sorted(list({s.get("Modality") for s in valid_slices if s.get("Modality")}))
    series_descs = sorted(list({s.get("SeriesDescription") for s in valid_slices if s.get("SeriesDescription")}))
    body_parts = sorted(list({s.get("BodyPartExamined") for s in valid_slices if s.get("BodyPartExamined")}))

    z_coords = []
    for s in valid_slices:
        pos = s.get("ImagePositionPatient")
        if isinstance(pos, list) and len(pos) >= 3:
            z_coords.append(pos[2])

    z_span = None
    if len(z_coords) >= 2:
        z_span = {
            "minZ": round(min(z_coords), 2),
            "maxZ": round(max(z_coords), 2),
            "spanMm": round(abs(max(z_coords) - min(z_coords)), 2)
        }

    wc = primary.get("WindowCenter")
    ww = primary.get("WindowWidth")
    preset = determine_window_preset(wc, ww)

    # Format StudyDate nicely if YYYYMMDD
    raw_date = primary.get("StudyDate", "")
    formatted_date = raw_date
    if isinstance(raw_date, str) and len(raw_date) == 8 and raw_date.isdigit():
        formatted_date = f"{raw_date[6:8]}/{raw_date[4:6]}/{raw_date[0:4]}"

    result = {
        "isDicom": True,
        "sliceCount": len(valid_slices),
        "modality": modalities[0] if len(modalities) == 1 else "/".join(modalities) if modalities else "CT/MR",
        "modalities": modalities,
        "studyDate": formatted_date,
        "rawStudyDate": raw_date,
        "studyDescription": primary.get("StudyDescription", ""),
        "seriesDescription": series_descs[0] if series_descs else primary.get("SeriesDescription", ""),
        "seriesList": series_descs,
        "bodyPartExamined": body_parts[0] if body_parts else "HEAD / CRANIOFACIAL",
        "patient": {
            "name": primary.get("PatientName", "Anonymous"),
            "id": primary.get("PatientID", "Unknown"),
            "age": primary.get("PatientAge", ""),
            "sex": primary.get("PatientSex", "")
        },
        "sliceThicknessMm": primary.get("SliceThickness"),
        "pixelSpacing": primary.get("PixelSpacing"),
        "matrix": f"{primary.get('Rows', 512)}x{primary.get('Columns', 512)}",
        "windowCenter": wc,
        "windowWidth": ww,
        "windowPreset": preset,
        "spatialSpan": z_span,
        "institution": primary.get("InstitutionName", ""),
        "referringPhysician": primary.get("ReferringPhysicianName", ""),
        "sampleSlices": [s["_filepath"] for s in valid_slices[:8]]
    }

    return result

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python3 Upload/dicom-parser.py <path-to-file-or-folder>"
        }, indent=2))
        sys.exit(1)

    path = sys.argv[1]
    res = scan_dicom_path(path)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
