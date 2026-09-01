#!/usr/bin/env bash
# scripts/mule-start.sh
#
# Wrapper for starting the Mule runtime locally against a generated outputs/<project>.
# Captures all runtime log output to outputs/<project>/logs/mule-runtime.log
# so the run-analyzer-subagent can read it automatically.
#
# Prerequisites:
#   - MULE_HOME must be set and point to a Mule 4 EE runtime installation
#   - The project must have been built first: ../../scripts/mule-run.sh package -DskipTests
#
# Usage (from inside an outputs/<project> directory):
#   ../../scripts/mule-start.sh                          # foreground, Ctrl+C to stop
#   ../../scripts/mule-start.sh -Dmule.key=yourKey      # with secure properties key
#   ../../scripts/mule-start.sh --background             # background mode, tails log
#
# The log is written to:
#   outputs/<project>/logs/mule-runtime.log    (primary)
#   /tmp/mule-runtime-<artifact>.log           (symlink for easy access)

set -uo pipefail

PROJECT_DIR="$(pwd)"
ARTIFACT="$(basename "$PROJECT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/mule-runtime.log"
STARTED="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
BACKGROUND=false
EXTRA_ARGS=()

mkdir -p "$LOG_DIR"

# Parse arguments — separate --background from Mule JVM args
for arg in "$@"; do
  if [ "$arg" = "--background" ]; then
    BACKGROUND=true
  else
    EXTRA_ARGS+=("$arg")
  fi
done

# Verify MULE_HOME
if [ -z "${MULE_HOME:-}" ]; then
  echo "[mule-start] ERROR: MULE_HOME is not set." | tee -a "$LOG_FILE"
  echo "[mule-start] Set it with: export MULE_HOME=/path/to/mule-enterprise-4.x.x" | tee -a "$LOG_FILE"
  exit 1
fi

if [ ! -d "$MULE_HOME" ]; then
  echo "[mule-start] ERROR: MULE_HOME='$MULE_HOME' does not exist." | tee -a "$LOG_FILE"
  exit 1
fi

# Verify the app JAR was built
APP_JAR=$(ls "$PROJECT_DIR/target/${ARTIFACT}-"*.jar 2>/dev/null | head -1)
if [ -z "$APP_JAR" ]; then
  echo "[mule-start] ERROR: No application JAR found in target/. Run first:" | tee -a "$LOG_FILE"
  echo "[mule-start]   ../../scripts/mule-run.sh package -DskipTests" | tee -a "$LOG_FILE"
  exit 1
fi

# Header
{
  echo "=============================="
  echo " MuleSoft Runtime Start"
  echo " Project  : $ARTIFACT"
  echo " JAR      : $(basename "$APP_JAR")"
  echo " MULE_HOME: $MULE_HOME"
  echo " Args     : ${EXTRA_ARGS[*]:-none}"
  echo " Started  : $STARTED"
  echo " Log file : $LOG_FILE"
  echo "=============================="
  echo ""
} | tee "$LOG_FILE"

# Symlink for easy access
ln -sf "$LOG_FILE" "/tmp/mule-runtime-${ARTIFACT}.log" 2>/dev/null || true

# Deploy the app to the Mule runtime apps directory
APPS_DIR="$MULE_HOME/apps"
mkdir -p "$APPS_DIR"
cp "$APP_JAR" "$APPS_DIR/"
echo "[mule-start] Deployed $(basename "$APP_JAR") to $APPS_DIR" | tee -a "$LOG_FILE"

# Set env default for env property if not already passed
ENV_SET=false
for arg in "${EXTRA_ARGS[@]:-}"; do
  [[ "$arg" == *"-Denv="* ]] && ENV_SET=true
done
if [ "$ENV_SET" = false ]; then
  EXTRA_ARGS+=("-Denv=local")
fi

# Start the Mule runtime
MULE_CMD="$MULE_HOME/bin/mule"
if [ ! -x "$MULE_CMD" ]; then
  echo "[mule-start] ERROR: Mule executable not found at $MULE_CMD" | tee -a "$LOG_FILE"
  exit 1
fi

NATIVE_LOG="$MULE_HOME/logs/mule_ee.log"
APP_LOG="$MULE_HOME/logs/int-mulesoft-${ARTIFACT}.log"

echo "[mule-start] Starting Mule runtime..." | tee -a "$LOG_FILE"
echo "[mule-start] Native Mule log: $NATIVE_LOG" | tee -a "$LOG_FILE"
echo "[mule-start] App log (log4j2): $APP_LOG" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

if [ "$BACKGROUND" = true ]; then
  # Start in background, then tail both logs to our capture file
  "$MULE_CMD" start "${EXTRA_ARGS[@]}" 2>&1 | tee -a "$LOG_FILE" &
  MULE_PID=$!
  echo "[mule-start] Mule started in background (PID=$MULE_PID)" | tee -a "$LOG_FILE"
  echo "[mule-start] Tailing app log. Press Ctrl+C to stop tailing (runtime keeps running)." | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
  # Wait for the app log to appear, then tail it
  for i in $(seq 1 30); do
    [ -f "$APP_LOG" ] && break
    sleep 1
  done
  if [ -f "$APP_LOG" ]; then
    tail -f "$APP_LOG" 2>&1 | tee -a "$LOG_FILE"
  else
    echo "[mule-start] App log not found after 30s. Check $NATIVE_LOG for startup errors." | tee -a "$LOG_FILE"
    tail -f "$NATIVE_LOG" 2>&1 | tee -a "$LOG_FILE"
  fi
else
  # Foreground — run and stream everything
  "$MULE_CMD" console "${EXTRA_ARGS[@]}" 2>&1 | tee -a "$LOG_FILE"
  EXIT_CODE=${PIPESTATUS[0]}
  {
    echo ""
    echo "=============================="
    echo " Mule runtime stopped"
    echo " Exit code : $EXIT_CODE"
    echo " Ended     : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "=============================="
  } | tee -a "$LOG_FILE"
  exit "$EXIT_CODE"
fi
