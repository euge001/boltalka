#!/bin/bash

# Quick start without migrations
docker-compose down 2>/dev/null
docker-compose up -d

echo "Starting services..."
sleep 5
docker-compose ps
echo ""
echo "Frontend:  http://localhost:3001"
echo "Backend:   http://localhost:3000"
echo "Health:    http://localhost:3000/health"
