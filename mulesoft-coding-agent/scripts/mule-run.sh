#!/usr/bin/env bash
# scripts/mule-run.sh
#
# Wrapper for local MuleSoft Maven runs.
# Streams build output to the terminal AND saves a full copy to
# target/mule-last-run.log so the run-analyzer-subagent can read it.
#
# Usage (from inside an outputs/<project> directory):
#   ../../scripts/mule-run.sh package -DskipTests
#   ../../scripts/mule-run.sh test
#   ../../scripts/mule-run.sh package          # full build + tests
#
# The log is always written to <project>/target/mule-last-run.log
# and symlinked from /tmp/mule-last-run-<artifact>.log for easy access.

set -uo pipefail

PROJECT_DIR="$(pwd)"
ARTIFACT="$(basename "$PROJECT_DIR")"
LOG_DIR="$PROJECT_DIR/target"
LOG_FILE="$LOG_DIR/mule-last-run.log"
STARTED="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "$LOG_DIR"

# Header
{
  echo "=============================="
  echo " MuleSoft Local Run"
  echo " Project : $ARTIFACT"
  echo " Command : mvn $*"
  echo " Started : $STARTED"
  echo "=============================="
  echo ""
} | tee "$LOG_FILE"

# Run Maven — stream to terminal and append to log
mvn "$@" 2>&1 | tee -a "$LOG_FILE"
MVN_EXIT=${PIPESTATUS[0]}

# Footer
{
  echo ""
  echo "=============================="
  echo " Run finished"
  echo " Exit code : $MVN_EXIT"
  echo " Ended     : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo " Log saved : $LOG_FILE"
  echo "=============================="
} | tee -a "$LOG_FILE"

# Symlink for quick access regardless of cwd
ln -sf "$LOG_FILE" "/tmp/mule-last-run-${ARTIFACT}.log" 2>/dev/null || true

exit "$MVN_EXIT"
