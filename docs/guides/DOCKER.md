# 🐳 Docker Setup - Boltalka

## Quick Start

### One-Command Startup (with migrations)

```bash
bash ./start.sh
```

This script will:
1. Check Docker/Docker Compose installation
2. Start PostgreSQL, Backend, and Frontend containers
3. Wait for database readiness
4. Run Prisma migrations
5. Display service URLs and logs

### Quick Start (without migrations)

```bash
bash ./quick-start.sh
# or
npm run quick-start
```

## Individual Commands

### Start all services
```bash
docker-compose up -d
# or
npm run docker:up
```

### Stop all services
```bash
docker-compose down
# or
npm run docker:down
```

### View logs
```bash
docker-compose logs -f
# or
npm run docker:logs
```

### View service status
```bash
docker-compose ps
# or
npm run docker:ps
```

### Rebuild containers
```bash
docker-compose up -d --build
# or
npm run docker:build
```

## Service URLs

Once running:

- **Frontend (Next.js)**: http://localhost:3001
- **Backend API (Fastify)**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Database**: `postgres://postgres:postgres@localhost:5432/boltalka`

## Environment Configuration

### Production (.env.docker)

```env
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=boltalka
BACKEND_PORT=3000
FRONTEND_PORT=3001
JWT_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Custom Configuration

Edit `.env.docker` before running to customize:
- Database credentials
- API ports
- JWT secret
- OpenAI API key
- CORS origin

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Docker Compose Setup                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Frontend    │  │   Backend    │  │ PostgreSQL   │  │
│  │ (Next.js)    │  │  (Fastify)   │  │  Database    │  │
│  │ :3001        │  │  :3000       │  │  :5432       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│        (boltalka-network)                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Services

### PostgreSQL
- **Image**: `postgres:16-alpine`
- **Port**: 5432 (configurable)
- **Credentials**: postgres/postgres (configurable)
- **Volume**: `postgres_data` (persistent storage)
- **Healthcheck**: Every 10 seconds

### Backend (Fastify)
- **Build**: Multi-stage build for production
- **Port**: 3000 (configurable)
- **Dependencies**: PostgreSQL (waits for healthy)
- **Features**: JWT auth, Pino logging, CORS
- **Healthcheck**: HTTP GET /health every 30 seconds
- **Entrypoint**: `node dist/main.js`

### Frontend (Next.js)
- **Build**: Multi-stage build for production
- **Port**: 3001 (configurable)
- **Dependencies**: Backend (waits for startup)
- **Features**: Client-side routing, Zustand state, Tailwind CSS
- **Healthcheck**: HTTP GET / every 30 seconds
- **Entrypoint**: `pnpm start`

## Database Management

### Running Migrations

Migrations run automatically during `start.sh` execution:

```bash
# Manual migration (inside container)
docker-compose exec backend pnpm exec prisma migrate deploy

# Generate new migration
docker-compose exec backend pnpm exec prisma migrate dev --name <migration_name>

# View database
docker-compose exec postgres psql -U postgres -d boltalka
```

### Database Backup

```bash
docker-compose exec postgres pg_dump -U postgres boltalka > backup.sql
```

### Database Restore

```bash
docker-compose exec -T postgres psql -U postgres boltalka < backup.sql
```

## Troubleshooting

### Services won't start

Check logs:
```bash
docker-compose logs
```

### Database connection error

Ensure database is healthy:
```bash
docker-compose logs postgres
docker-compose exec postgres pg_isready -U postgres
```

### Port already in use

Change ports in `.env.docker`:
```env
BACKEND_PORT=3000
FRONTEND_PORT=3001
DB_PORT=5432
```

### Permission denied on scripts

Make scripts executable:
```bash
chmod +x start.sh quick-start.sh
```

### Rebuild from scratch

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Development vs Production

### Development (local)
```bash
npm run dev  # Runs all services in dev mode
```

### Production (Docker)
```bash
npm start    # Runs with migrations and healthchecks
# or
bash ./start.sh
```

## Performance Tips

### Build optimization
- Multi-stage builds reduce image size
- Only production dependencies in final image
- Alpine Linux base for minimal footprint

### Caching
- Docker layer caching for faster rebuilds
- Separate `pnpm install` from `pnpm build`

### Resource limits (optional)

Edit `docker-compose.yml` to add:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## CI/CD Integration

For GitHub Actions or other CI/CD:

```bash
# Build images
docker-compose build

# Run tests
docker-compose exec backend npm test
docker-compose exec frontend npm test

# Deploy
docker-compose up -d
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Next.js Production](https://nextjs.org/docs/going-to-production)
- [Fastify Deployment](https://www.fastify.io/docs/latest/Guides/Deployment/)
