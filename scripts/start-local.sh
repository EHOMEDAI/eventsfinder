#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
DB_NAME="${LOCAL_DB_NAME:-eventsfinder_local}"
DB_USER="${LOCAL_DB_USER:-root}"
DB_PASSWORD="${LOCAL_DB_PASSWORD:-123456}"
DB_HOST="${LOCAL_DB_HOST:-127.0.0.1}"
DB_PORT="${LOCAL_DB_PORT:-3306}"
API_PORT="${PORT:-4000}"
WEB_PORT="${WEB_PORT:-3000}"

mkdir -p "$RUN_DIR"

export DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
export JWT_SECRET="${JWT_SECRET:-replace-with-a-long-random-secret}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:${API_PORT}}"
export EVENTBRITE_PRIVATE_TOKEN="${EVENTBRITE_PRIVATE_TOKEN:-}"

cd "$ROOT_DIR"

if [[ -f "$RUN_DIR/api.pid" ]] && kill -0 "$(cat "$RUN_DIR/api.pid")" 2>/dev/null; then
  echo "API already running with PID $(cat "$RUN_DIR/api.pid")."
else
  rm -f "$RUN_DIR/api.pid"
fi

if [[ -f "$RUN_DIR/web.pid" ]] && kill -0 "$(cat "$RUN_DIR/web.pid")" 2>/dev/null; then
  echo "Web already running with PID $(cat "$RUN_DIR/web.pid")."
else
  rm -f "$RUN_DIR/web.pid"
fi

mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

pnpm db:generate >/dev/null
pnpm db:deploy >/dev/null

ROLE_COUNT="$(mysql -N -s -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "SELECT COUNT(*) FROM Role;" 2>/dev/null || echo 0)"
if [[ "${ROLE_COUNT}" == "0" ]]; then
  echo "Seeding initial data into ${DB_NAME}..."
  pnpm db:seed >/dev/null
fi

if [[ ! -f "$RUN_DIR/api.pid" ]]; then
  nohup bash -lc "cd \"$ROOT_DIR\" && exec env PORT=\"${API_PORT}\" pnpm --filter api run dev" >"$RUN_DIR/api.log" 2>&1 < /dev/null &
  echo $! > "$RUN_DIR/api.pid"
fi

if [[ ! -f "$RUN_DIR/web.pid" ]]; then
  nohup bash -lc "cd \"$ROOT_DIR\" && exec pnpm --filter web run dev --port \"${WEB_PORT}\"" >"$RUN_DIR/web.log" 2>&1 < /dev/null &
  echo $! > "$RUN_DIR/web.pid"
fi

for _ in {1..30}; do
  if curl -sf "http://localhost:${API_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

for _ in {1..30}; do
  if curl -sfI "http://localhost:${WEB_PORT}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Local MySQL database: ${DB_NAME}"
echo "API: http://localhost:${API_PORT} (PID $(cat "$RUN_DIR/api.pid"))"
echo "Web: http://localhost:${WEB_PORT} (PID $(cat "$RUN_DIR/web.pid"))"
echo "Logs: $RUN_DIR/api.log and $RUN_DIR/web.log"
