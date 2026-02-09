#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo -e "\n${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Docker is installed
print_header "Checking system requirements"

if ! command -v docker &> /dev/null; then
  print_error "Docker is not installed"
  exit 1
fi
print_success "Docker is installed"

if ! command -v docker-compose &> /dev/null; then
  print_error "Docker Compose is not installed"
  exit 1
fi
print_success "Docker Compose is installed"

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
  print_error ".env.docker file not found"
  print_info "Creating .env.docker from template..."
  cp .env.docker .env.docker 2>/dev/null || {
    print_error "Failed to create .env.docker"
    exit 1
  }
fi
print_success ".env.docker file exists"

# Load environment variables
export $(cat .env.docker | grep -v '^#' | xargs)

# Start services
print_header "Starting Docker services"

docker-compose down 2>/dev/null
print_info "Cleaned up previous containers"

docker-compose up -d
if [ $? -ne 0 ]; then
  print_error "Failed to start Docker services"
  docker-compose logs
  exit 1
fi
print_success "Docker services started"

# Wait for database
print_header "Waiting for database to be ready"

for i in {1..30}; do
  if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
    print_success "Database is ready"
    break
  fi
  echo -n "."
  sleep 1
done

# Run Prisma migrations
print_header "Running database migrations"

docker-compose exec -T backend pnpm exec prisma migrate deploy
if [ $? -eq 0 ]; then
  print_success "Database migrations completed"
else
  print_error "Database migrations failed"
  docker-compose logs backend
  exit 1
fi

# Display service information
print_header "✨ Boltalka is running!"

echo -e "${GREEN}Services Status:${NC}"
docker-compose ps

echo -e "\n${GREEN}Access URLs:${NC}"
echo -e "  Frontend:  ${BLUE}http://localhost:${FRONTEND_PORT:-3001}${NC}"
echo -e "  Backend:   ${BLUE}http://localhost:${BACKEND_PORT:-3000}${NC}"
echo -e "  Health:    ${BLUE}http://localhost:${BACKEND_PORT:-3000}/health${NC}"
echo -e "  Database:  ${BLUE}postgres://${DB_USER:-postgres}@localhost:${DB_PORT:-5432}/${DB_NAME:-boltalka}${NC}"

echo -e "\n${GREEN}Useful commands:${NC}"
echo -e "  View logs:     ${BLUE}docker-compose logs -f${NC}"
echo -e "  Backend logs:  ${BLUE}docker-compose logs -f backend${NC}"
echo -e "  Frontend logs: ${BLUE}docker-compose logs -f frontend${NC}"
echo -e "  Database:      ${BLUE}docker-compose logs -f postgres${NC}"
echo -e "  Stop services: ${BLUE}docker-compose down${NC}"
echo -e "  Rebuild:       ${BLUE}docker-compose up -d --build${NC}"

print_info "Press Ctrl+C to exit or run 'docker-compose logs -f' to see all logs"
