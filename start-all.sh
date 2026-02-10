#!/bin/bash
set -e

export BACKEND_PORT=${BACKEND_PORT:-3002}
export FRONTEND_PORT=${FRONTEND_PORT:-3005}

echo "🔧 Config: Backend=$BACKEND_PORT Frontend=$FRONTEND_PORT"
pkill -f "node dist/main" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
lsof -ti:$BACKEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:$FRONTEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2

cd /var/www/html/Boltalka-Node/packages/backend
PORT=$BACKEND_PORT npm run start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

sleep 3

cd /var/www/html/Boltalka-Node/packages/frontend
PORT=$FRONTEND_PORT npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ Backend: http://localhost:$BACKEND_PORT (PID: $BACKEND_PID)"
echo "✅ Frontend: http://localhost:$FRONTEND_PORT (PID: $FRONTEND_PID)"
echo "Ctrl+C to stop"

wait
