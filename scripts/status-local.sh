#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"

show_status() {
  local name="$1"
  local pid_file="$RUN_DIR/$2"

  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "${name}: running (PID $(cat "$pid_file"))"
  else
    echo "${name}: stopped"
  fi
}

show_status "API" "api.pid"
show_status "Web" "web.pid"
