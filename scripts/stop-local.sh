#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"

stop_pid_file() {
  local name="$1"
  local pid_file="$RUN_DIR/$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "${name}: not running"
    return
  fi

  local pid
  pid="$(cat "$pid_file")"

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    for _ in {1..10}; do
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      sleep 1
    done
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "${name}: stopped PID $pid"
  else
    echo "${name}: stale PID file removed"
  fi

  rm -f "$pid_file"
}

stop_pid_file "API" "api.pid"
stop_pid_file "Web" "web.pid"
