# CLI Command Reference - Boltalka AI Platform

## Overview

The Boltalka AI Platform provides a unified CLI command for managing the entire system. All operations are accessible through a single `./run` command at the project root.

## Quick Start

```bash
# Show help
./run help

# Show version and system info
./run version

# Run all tests
./run test

# Start Docker containers
./run docker:up

# Check system status
./run status
```

## Command Categories

### Testing Commands

| Command | Description |
|---------|-------------|
| `./run test` | Run all tests (backend + frontend) |
| `./run test:backend` | Run backend tests only (129 tests) |
| `./run test:frontend` | Run frontend tests only (63 tests) |

**Example:**
```bash
./run test:backend
# Output: Test Suites: 9 passed, 9 total
#         Tests: 129 passed, 129 total
```

### Docker Commands

| Command | Description |
|---------|-------------|
| `./run docker:up` | Start Docker containers |
| `./run docker:down` | Stop Docker containers |
| `./run docker:restart` | Restart Docker containers |
| `./run docker:fresh` | Clean rebuild of all containers |
| `./run docker:status` | Show container status |
| `./run docker:logs` | Stream container logs |

**Example:**
```bash
# Start services fresh
./run docker:fresh

# Check if services are running
./run docker:status

# Watch logs in real-time
./run docker:logs
```

### Git Commands

| Command | Description |
|---------|-------------|
| `./run git:status` | Show Git repository status |
| `./run git:log` | Show commit history (last 10) |
| `./run git:diff` | Show staged changes |

**Example:**
```bash
./run git:status
# Output: Latest commits:
#         9b02864 feat: Langfuse observability
#         d409d58 feat: LangGraph agents
#         ...
```

### Development Commands

| Command | Description |
|---------|-------------|
| `./run dev` | Start full development environment |
| `./run build` | Build entire project |
| `./run lint` | Lint all code |
| `./run format` | Format all code with Prettier |
| `./run clean` | Clean build artifacts |

### Monitoring & Health Commands

| Command | Description |
|---------|-------------|
| `./run status` | Show complete system status |
| `./run health` | Health check all services |
| `./run monitor` | Stream Docker logs (Ctrl+C to exit) |

**Example:**
```bash
./run status
# Output:
#   Git Repository: clean
#   Docker Containers: 3 running
#   Backend Tests: 129 passed
#   Recent Changes: [commit history]
```

### Deployment Commands

| Command | Description |
|---------|-------------|
| `./run deploy:prepare` | Prepare system for deployment |

**Checks:**
- Runs all tests
- Builds project
- Verifies Docker configuration
- Validates environment variables

## Command Examples

### Complete Development Workflow

```bash
# 1. Check status
./run status

# 2. Update code
# (edit files)

# 3. Run tests
./run test

# 4. Format code
./run format

# 5. Check git status
./run git:status

# 6. Commit changes
git add .
git commit -m "fix: your message"

# 7. Push changes
git push
```

### Deployment Workflow

```bash
# 1. Prepare for deployment
./run deploy:prepare

# 2. Review logs
./run docker:logs

# 3. Verify health
./run health

# 4. Deploy to production
# (your deployment command)
```

### Quick Testing

```bash
# Run tests and check status in one go
./run test && ./run status

# Monitor system while running tests
./run monitor &
./run test
killall docker-compose  # or Ctrl+C in the monitor terminal
```

### Docker Management

```bash
# Fresh start (clean rebuild)
./run docker:fresh

# Restart services (keep data)
./run docker:restart

# Check container logs
./run docker:logs

# Graceful shutdown
./run docker:down
```

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root:

```env
# Backend
DATABASE_URL=postgresql://boltalka:boltalka@localhost:5432/boltalka_dev
PORT=3000

# Langfuse (optional - disabled by default)
LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=pk-test-dev
LANGFUSE_SECRET_KEY=sk-test-dev
LANGFUSE_BASE_URL=http://localhost:3000

# LLM
OPENAI_API_KEY=your-api-key-here
```

## Architecture

### System Layers

```
┌─────────────────────────────────────────┐
│  Frontend (React + Next.js)              │
│  Port: 3001                              │
└─────────────────────────────────────────┘
           ↓ HTTP/REST
┌─────────────────────────────────────────┐
│  Backend API (Fastify)                  │
│  Port: 3000 | /health /api/agent/*     │
└─────────────────────────────────────────┘
           ↓ SQL
┌─────────────────────────────────────────┐
│  PostgreSQL Database                     │
│  Port: 5432 | boltalka_dev              │
└─────────────────────────────────────────┘
           ↓ Observability
┌─────────────────────────────────────────┐
│  Langfuse (optional)                     │
│  http://localhost:3000 (dev)            │
└─────────────────────────────────────────┘
```

## Test Coverage

### Backend Tests (129 total)

```
✓ app.config.test.ts       (7 tests)
✓ logger.test.ts            (6 tests)
✓ llm.test.ts               (14 tests)
✓ backend.config.test.ts    (18 tests)
✓ main.test.ts              (9 tests)
✓ fastify.test.ts           (8 tests)
✓ health.test.ts            (6 tests)
✓ langfuse.test.ts          (22 tests)
✓ agent.test.ts             (32 tests)
```

### Running Specific Tests

```bash
# Run backend tests
cd packages/backend
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- agent.test.ts

# Watch mode (re-run on changes)
npm run test -- --watch
```

## Troubleshooting

### Tests Failing

```bash
# Clean and rebuild
./run clean
npm install
./run test:backend
```

### Docker Not Starting

```bash
# Check Docker status
docker ps -a

# Check Docker logs
./run docker:logs

# Fresh rebuild
./run docker:fresh
```

### Port Conflicts

If ports 3000 or 5432 are in use:

```bash
# Find process using port 3000
lsof -i :3000

# Kill process (replace PID with actual process ID)
kill -9 PID

# Or let Docker handle it by restarting
./run docker:restart
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Reset database
docker-compose exec postgres psql -U boltalka -d boltalka_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Add project root to PATH
export PATH="$PATH:/var/www/html/Boltalka-Node"

# Quick aliases
alias run='./run'
alias test='./run test'
alias docker-up='./run docker:up'
alias docker-down='./run docker:down'
alias status='./run status'
alias monitor='./run monitor'
```

Then use:
```bash
run test           # instead of ./run test
run docker:fresh   # instead of ./run docker:fresh
```

## Project Structure

```
Boltalka-Node/
├── run                    ← Main CLI command
├── .env                   ← Environment variables
├── docker-compose.yml     ← Docker services
├── Dockerfile.*           ← Container definitions
├── package.json           ← Root package
├── tsconfig.json          ← TypeScript config
├── packages/
│   ├── backend/           ← API server (Fastify)
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   ├── frontend/          ← Web UI (Next.js)
│   │   ├── app/
│   │   ├── tests/
│   │   └── package.json
│   └── shared/            ← Shared types & utilities
├── docs/                  ← Documentation
├── DAY*_REPORT.md        ← Phase reports
└── README.md             ← Project overview
```

## Learn More

- **[DAY1_REPORT.md](../DAY1_REPORT.md)** - Monorepo setup
- **[DAY7_REPORT.md](../DAY7_REPORT.md)** - Complete system overview
- **[DOCKER.md](../DOCKER.md)** - Docker deployment guide
- **[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)** - Migration from old architecture

## Support

For issues or questions:

1. Check the logs: `./run docker:logs`
2. Run health check: `./run health`
3. Review documentation: `./run docs`
4. Check Git history: `./run git:log`

---

**Last Updated:** February 9, 2026  
**Status:** Production Ready ✓
