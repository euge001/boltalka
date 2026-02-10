# Root Directory Structure — Project Organization

## 🎯 Overview

This is a **pnpm monorepo** with clean separation of concerns following modern best practices.

---

## 📋 Root Files — Essential Only

### **Monorepo Configuration**
```
pnpm-workspace.yaml       # pnpm workspaces definition
package.json             # Root workspace package config
pnpm-lock.yaml          # Dependency lock file (pnpm)
turbo.json              # Turborepo build orchestration
```

### **TypeScript & Code Style**
```
tsconfig.json           # Root TypeScript configuration
.prettierrc.json        # Code formatter config
.prettierignore         # Files to skip formatting
```

### **Docker & Deployment**
```
docker-compose.yml      # Local development environment (pnpm native)
Dockerfile.backend      # Backend container image
Dockerfile.frontend     # Frontend container image
.dockerignore          # Optimize docker builds
```

### **Git Configuration**
```
.gitignore             # Git ignore rules
```

### **Documentation & Startup**
```
README.md              # Project overview
start-all.sh           # Development startup script (use this)
run                    # Unified CLI for advanced operations
```

### **Template**
```
.env.example           # Environment variables template (copy to packages/)
```

---

## ✅ What's NOT in Root (and Why)

### **❌ Removed Files**

| File | Reason | Alternative |
|------|--------|-------------|
| `start.sh` | Old Docker-based startup | Use `start-all.sh` (native) |
| `quick-start.sh` | Duplicate Docker quick start | Use `start-all.sh` |
| `package-lock.json` | npm lock file | Using pnpm (pnpm-lock.yaml) |
| `jest.config.js` | Root test config | Tests in `packages/*/tests/` |
| `.env` | Live env file exposed to git | Use `.env.example` only |
| `manifest.webmanifest` | Legacy PWA manifest | Not used in current build |

### **📁 Moved Directories**

| Directory | Moved To | Reason |
|-----------|----------|--------|
| `tests/` | `docs/archived/legacy_tests/` | Old root tests, real ones in `packages/` |
| `coverage/` | `.gitignore_artifacts/` | Build artifacts, should not commit |
| `.env.docker` | `infra/.env.docker` | Docker-specific config belongs in infra/ |

---

## 📦 Active Subdirectories

### **`packages/`** — Monorepo Workspaces
```
packages/
├── backend/        # Fastify + TypeScript server
├── frontend/       # Next.js + React UI
└── shared/         # Shared types & utilities (if needed)
```

Each package has:
- Own `package.json`
- Own `tsconfig.json`
- Own test suite in `src/__tests__/` or `tests/`
- Compiled output in `dist/`

### **`docs/`** — All Documentation
```
docs/
├── architecture/   # System design docs
├── guides/        # User guides & quickstarts
├── plans/         # Development roadmaps
├── reports/       # Session/day reports
└── archived/      # Old docs & legacy tests
```

### **`infra/`** — Infrastructure & DevOps
```
infra/
├── .env.docker    # Docker environment variables
├── prometheus.yml # Monitoring config
├── kubernetes/    # K8s manifests (future)
└── scripts/       # DevOps automation scripts
```

### **`legacy/`** — Old PHP/JS Code
```
legacy/
├── app.js, coder.js, chat.php, config.php, etc.
└── All old reference code (read-only)
```

### **`legacy_root_archived/`** — Old Root-Level Files
```
legacy_root_archived/
└── Old .html, .js, .php files from root
```

---

## 🚀 Development Workflow

### **Quick Start**
```bash
cd /var/www/html/Boltalka-Node
BACKEND_PORT=3002 FRONTEND_PORT=3005 bash start-all.sh
```

### **What `start-all.sh` Does**
1. Kills any existing processes on ports 3002/3005
2. Starts backend: `cd packages/backend && PORT=3002 node dist/main.js`
3. Starts frontend: `cd packages/frontend && PORT=3005 npm run dev`
4. Shows URLs for access

### **Build All Packages**
```bash
pnpm build
```

### **Run Tests**
```bash
pnpm test
```

### **Using Advanced CLI**
```bash
./run help              # Show available commands
./run start             # Start services
./run test              # Run tests
./run build             # Build all packages
```

---

## 🔧 Adding New Files to Root

**Before adding files to root, ask:**

1. **Is it monorepo-essential?** (workspace config, build orchestration)
   - ✅ YES → Add to root
   
2. **Is it for a specific package?** (tests, env, config)
   - ❌ NO → Move to `packages/*/`
   
3. **Is it documentation?**
   - ❌ NO → Move to `docs/`
   
4. **Is it DevOps?** (Docker configs, K8s manifests)
   - ❌ NO → Move to `infra/`
   
5. **Is it a build artifact?** (coverage, dist, node_modules)
   - ❌ NO → Add to `.gitignore`, never commit

---

## 📊 Root File Summary

| File Type | Count | Status |
|-----------|-------|--------|
| Monorepo Config | 4 | ✅ Essential |
| Docker Config | 4 | ✅ Essential |
| TypeScript/Style | 3 | ✅ Essential |
| Documentation | 3 | ✅ Keep |
| Scripts | 2 | ✅ Keep |
| **Total** | **16** | ✅ Lean & Clean |

---

## ⚡ Best Practices Applied

✅ **Monorepo Organization**
- Clear package separation
- Shared workspace config
- pnpm for efficient dependency management

✅ **No Root Noise**
- Tests in packages only
- Configs in appropriate folders
- Artifacts in .gitignore

✅ **Clear Startup**
- Single command: `start-all.sh`
- No multiple competing scripts
- Environment variables via ENV

✅ **Documentation-Driven**
- All docs in `docs/`
- Old code in `legacy/`
- README.md at root level

✅ **Infrastructure Organized**
- Docker configs in `infra/`
- DevOps scripts separated
- Easy to find deployment stuff

---

## 📝 Last Updated

**February 10, 2026** — Post-cleanup verification  
**Status:** Production-ready root structure
