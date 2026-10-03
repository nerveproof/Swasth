#!/usr/bin/env bash
# ==============================================================================
# Swastha Clinical Reconstruction Agent Runner
# Default Engine: Grok CLI (with Agy CLI support)
# Supports 2D Films / PDFs & Multimodal DICOM Series
# ==============================================================================

set -euo pipefail

WORKSPACE_DIR="/home/leafyishere/Swasth"
UPLOAD_DIR="${WORKSPACE_DIR}/Upload"
TASK_FILE="${UPLOAD_DIR}/TASK.json"
TASK_DICOM_FILE="${UPLOAD_DIR}/TASK-dicom.json"
CHANGES_FILE="${UPLOAD_DIR}/CHANGES.md"
RECON_FILE="${UPLOAD_DIR}/RECONSTRUCTION.json"
PARSER_SCRIPT="${UPLOAD_DIR}/dicom-parser.py"

INSTRUCTIONS_2D="${UPLOAD_DIR}/AGENT_INSTRUCTIONS.md"
INSTRUCTIONS_DICOM="${UPLOAD_DIR}/DICOM_AGENT_INSTRUCTIONS.md"

AGENT_CLI="grok"
FORCE_DICOM=0
SPECIFIED_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent)
      AGENT_CLI="$2"
      shift 2
      ;;
    --dicom)
      FORCE_DICOM=1
      shift 1
      ;;
    --path)
      SPECIFIED_PATH="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "=========================================="
echo " Starting Clinical Agent via [${AGENT_CLI}]"
echo " Working Directory: ${WORKSPACE_DIR}"
echo " Upload Directory:  ${UPLOAD_DIR}"
echo "=========================================="

if [ ! -d "${UPLOAD_DIR}" ]; then
  echo "Error: Upload directory does not exist: ${UPLOAD_DIR}"
  exit 1
fi

SCENE_FILE="${WORKSPACE_DIR}/app/clinical-reconstruction-scene.ts"
NEXT_GROUP="$(grep -cE 'const fractureGroup[0-9]+' "${SCENE_FILE}" || true)"
NEXT_GROUP=$((NEXT_GROUP + 1))

# Detect if DICOM series/folder is present
IS_DICOM=0
if [ "${FORCE_DICOM}" -eq 1 ]; then
  IS_DICOM=1
elif [ -f "${TASK_DICOM_FILE}" ]; then
  IS_DICOM=1
elif [ -n "${SPECIFIED_PATH}" ] && [[ "${SPECIFIED_PATH}" == *.dcm || -d "${SPECIFIED_PATH}" ]]; then
  IS_DICOM=1
else
  # Check for .dcm files or nested directories in Upload
  DCM_COUNT="$(find "${UPLOAD_DIR}" -type f -iname '*.dcm' | wc -l || true)"
  if [ "${DCM_COUNT}" -gt 0 ]; then
    IS_DICOM=1
  fi
fi

if [ "${IS_DICOM}" -eq 1 ]; then
  echo "Mode: DICOM Series Reconstruction"

  DICOM_TARGET=""
  if [ -n "${SPECIFIED_PATH}" ]; then
    DICOM_TARGET="${SPECIFIED_PATH}"
  else
    # Find newest directory containing .dcm or files, or newest .dcm file
    DICOM_SUBDIR="$(find "${UPLOAD_DIR}" -mindepth 1 -maxdepth 2 -type d \
      ! -name '.*' -printf '%T@\t%p\n' | sort -nr | head -1 | cut -f2- || true)"
    if [ -n "${DICOM_SUBDIR}" ] && [ "$(find "${DICOM_SUBDIR}" -type f | wc -l)" -gt 0 ]; then
      DICOM_TARGET="${DICOM_SUBDIR}"
    else
      DICOM_TARGET="$(find "${UPLOAD_DIR}" -type f -iname '*.dcm' -printf '%T@\t%p\n' | sort -nr | head -1 | cut -f2- || true)"
    fi
  fi

  if [ -z "${DICOM_TARGET}" ] || [ ! -e "${DICOM_TARGET}" ]; then
    echo "Warning: DICOM mode triggered but no DICOM path identified. Falling back to Upload directory."
    DICOM_TARGET="${UPLOAD_DIR}"
  fi

  echo "Target DICOM: ${DICOM_TARGET}"
  echo "Next group:   fractureGroup${NEXT_GROUP}"

  # Run lightweight header parser to extract metadata for agent prompt
  DICOM_SUMMARY=""
  if [ -f "${PARSER_SCRIPT}" ]; then
    echo "Running DICOM header parser..."
    DICOM_SUMMARY="$(python3 "${PARSER_SCRIPT}" "${DICOM_TARGET}" 2>/dev/null || true)"
  fi

  PROMPT="DICOM Series 3D Reconstruction (above the neck only). Do not explore the app or open DICOM viewer.

Target DICOM Path: ${DICOM_TARGET}
Parsed Metadata Summary:
${DICOM_SUMMARY:-No summary available}

Next geometry: fractureGroup${NEXT_GROUP} and anchors${NEXT_GROUP}. Existing groups 1 to $((NEXT_GROUP - 1)) stay untouched.
Follow only the Fast path in ${INSTRUCTIONS_DICOM}.
Append one case above the neck to app/clinical-reconstruction.ts and app/clinical-reconstruction-scene.ts.
Keep every earlier case selectable. Do not change All, Skeleton, Trigeminal, Face, or Organs.
Run npm run check to verify TypeScript exits 0.
Append a short entry to ${CHANGES_FILE} and case to ${RECON_FILE}."

else
  echo "Mode: 2D Film / Report Photo Reconstruction"

  # Newest film only. TASK.json text is often an unread-image fallback.
  LATEST_FILM=""
  if [ -n "${SPECIFIED_PATH}" ]; then
    LATEST_FILM="${SPECIFIED_PATH}"
  else
    LATEST_FILM="$(find "${UPLOAD_DIR}" -maxdepth 1 -type f \
      \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.pdf' \) \
      ! -name 'AGENT_INSTRUCTIONS.md' ! -name 'DICOM_AGENT_INSTRUCTIONS.md' ! -name 'CHANGES.md' ! -name 'README.md' \
      -printf '%T@\t%p\n' | sort -nr | head -1 | cut -f2- || true)"
  fi

  echo "Film:        ${LATEST_FILM:-none}"
  echo "Next group:  fractureGroup${NEXT_GROUP}"

  if [ -z "${LATEST_FILM}" ]; then
    echo "Error: no image or PDF in ${UPLOAD_DIR}."
    exit 1
  fi

  PROMPT="Fast 3D finding only. Do not explore the app. MRI, CT, NCCT, CBCT, and X-ray all use this same append. Do not build or open DICOM.

Film: ${LATEST_FILM}
Read that file. Ignore the impression string inside ${TASK_FILE} when it disagrees with the film.
Next geometry: fractureGroup${NEXT_GROUP} and anchors${NEXT_GROUP}. Existing groups stay untouched.
Follow only the Fast path in ${INSTRUCTIONS_2D}.
Append one case above the neck. Keep every earlier case selectable. Do not change All, Skeleton, Trigeminal, Face, or Organs.
Run npm run check. If the viewer is already open, select the new case once and one older case once, then stop.
Append a short entry to ${CHANGES_FILE}."
fi

echo "=========================================="
echo " Invoking Agent CLI: [${AGENT_CLI}]"
echo "=========================================="

if [ "${AGENT_CLI}" = "grok" ]; then
  if command -v grok &>/dev/null; then
    echo "Running grok CLI..."
    cd "${WORKSPACE_DIR}"
    grok --cwd "${WORKSPACE_DIR}" "${PROMPT}"
  elif [ -f "/home/leafyishere/.npm-global/bin/grok" ]; then
    echo "Running /home/leafyishere/.npm-global/bin/grok..."
    cd "${WORKSPACE_DIR}"
    /home/leafyishere/.npm-global/bin/grok --cwd "${WORKSPACE_DIR}" "${PROMPT}"
  elif [ -f "/home/leafyishere/.grok/bin/grok" ]; then
    echo "Running /home/leafyishere/.grok/bin/grok..."
    cd "${WORKSPACE_DIR}"
    /home/leafyishere/.grok/bin/grok --cwd "${WORKSPACE_DIR}" "${PROMPT}"
  else
    echo "Error: grok CLI not found in PATH or at /home/leafyishere/.npm-global/bin/grok"
    exit 1
  fi
elif [ "${AGENT_CLI}" = "agy" ]; then
  AGY_BIN=""
  if command -v agy &>/dev/null; then
    AGY_BIN="agy"
  elif [ -f "/usr/bin/agy" ]; then
    AGY_BIN="/usr/bin/agy"
  else
    echo "Error: agy CLI not found in PATH or at /usr/bin/agy"
    exit 1
  fi

  echo "Running agy CLI..."
  cd "${WORKSPACE_DIR}"
  if [ -t 0 ]; then
    "${AGY_BIN}" --dangerously-skip-permissions -i "${PROMPT}"
  else
    "${AGY_BIN}" --dangerously-skip-permissions --prompt "${PROMPT}"
  fi
else
  echo "Unsupported agent: ${AGENT_CLI}. Use 'grok' or 'agy'."
  exit 1
fi

echo "=========================================="
echo " Agent run complete."
echo " Check ${CHANGES_FILE} for audit log."
echo "=========================================="
