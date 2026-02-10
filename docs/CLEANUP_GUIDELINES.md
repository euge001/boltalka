# Code Cleanup & Maintenance Guidelines

## 📌 Current State (As of February 10, 2026)

**Canonical Stack Verification:**
- ✅ Monorepo: pnpm workspaces (3 packages: backend, frontend, optional shared)
- ✅ No redundant files: 16 root files (all essential, from original 23)
- ✅ No dead code: Auth system removed, duplicate endpoints cleaned
- ✅ 100% English: All documentation & code comments translated
- ✅ No hacks/workarounds: Clean environment variable handling
- ✅ Best practices: Organized infrastructure, tests in packages, docs organized

---

## 🧹 Cleanup Rules — Maintain This State

### **Rule 1: Root Directory is Sacred (Lean Only)**

**Before adding ANY file to root, ask:**

```
✓ Is it monorepo-essential?       pnpm-workspace.yaml, turbo.json, etc.
✓ Is it absolutely critical?      If no → move to packages/ or docs/
✓ Do all developers need it?      If no → move to specific package
✓ Is it a config or artifact?     Configs in ./ or infra/, artifacts in .gitignore
```

**If none of above:** Move to appropriate subdirectory instead.

### **Rule 2: Dead Code Removal Checklist**

Before comitting dead code:

```
□ Is this function used anywhere?           grep -r "functionName" packages/
□ Is this route actually called?            Check openapi spec or curl logs
□ Is this component imported?               Check app/ and pages/
□ Can this be tested?                       If test fails, it's dead
□ Was this added 2+ weeks ago unused?       Safe to remove
```

**If ANY box is unchecked:** Consider removing.

### **Rule 3: English-Only Documentation**

**Never commit:**
- ❌ Russian comments in code
- ❌ Mixed language documentation
- ❌ Language-specific UI text (except user-facing labels)

**Always have:**
- ✅ English code comments
- ✅ English documentation
- ✅ English function/variable names

### **Rule 4: Monorepo Structure Must Be Honored**

```
❌ DON'T:                          ✅ DO:
├── root/script.js               ├── packages/backend/scripts/
├── root/tests.js                ├── packages/backend/tests/
├── root/config.env              ├── packages/backend/.env.template
├── root/docs/old/               ├── docs/archived/
└── root/old_migration.sql       └── docs/archived/migrations/
```

### **Rule 5: No Package Lock Duplication**

```
❌ NEVER commit both:
   - package-lock.json (npm)
   - pnpm-lock.yaml (pnpm)

✅ Always use:
   - pnpm-lock.yaml ONLY
```

---

## 📋 Regular Maintenance Schedule

### **Weekly**
- [ ] Check for unused npm packages: `pnpm deps`
- [ ] Run tests: `pnpm test`
- [ ] Build verification: `pnpm build`

### **Monthly**
- [ ] Audit unused files: `find packages/ -type f -mtime +90`
- [ ] Check for console.log/debugger statements
- [ ] Review .gitignore for unnecessary ignores
- [ ] Verify all endpoints in OpenAPI spec

### **Quarterly**
- [ ] Remove deprecated functions/routes
- [ ] Clean up old feature branches
- [ ] Update legacy documentation
- [ ] Review and update ROOT_STRUCTURE.md

---

## 🚨 Anti-Patterns — Never Do This

### **❌ Anti-Pattern 1: Root-Level Clutter**
```bash
# Bad
root/
├── src/                          # Why here?
├── app.js, config.js, index.js   # Why not in packages/?
├── tests/                        # Why not in packages?
└── .env, .env.production         # Why live files?

# Good
root/packages/backend/src/
root/packages/*/tests/
```

### **❌ Anti-Pattern 2: Duplicate Functionality**
```typescript
// Bad - two health check endpoints
GET /api/llm/health
GET /api/agent/health          // Both do same thing

// Good - single source of truth
GET /api/health                // One endpoint
```

### **❌ Anti-Pattern 3: Unused Dependencies**
```json
// Bad
{
  "dependencies": {
    "@unused/library": "^1.0.0",
    "moment": "^2.29.0"         // Replaced by date-fns
  }
}

// Good
{
  "dependencies": {
    "date-fns": "^2.30.0"
  }
}
```

### **❌ Anti-Pattern 4: Dead Code**
```typescript
// Bad
export const OLD_FUNCTION = () => {
  // This was used in 2024, keeping "just in case"
  return "deprecated";
};

// Good - remove entirely
// Or: Move to docs/archived/ with comment about why it existed
```

### **❌ Anti-Pattern 5: Mixed Language**
```typescript
// Bad
const languageInstructions = {
  en: 'You are helpful.',
  ru: 'Вы полезный ассистент.',    // Cyrillic in code
};

// Good
const languageInstructions = {
  en: 'You are helpful.',
  ru: 'You are a helpful assistant.',  // Translate not transliterate
};
```

---

## 🔧 Cleanup Command Reference

### **Find Dead Code**
```bash
# Unused imports
grep -r "^import\|^require" packages/ --include="*.ts" | while read imp; do
  name=$(echo "$imp" | sed "s/.*from '//;s/'.*//" | awk '{print $NF}')
  if ! grep -q "$name" "${imp%:*}"; then
    echo "Potentially unused: $imp"
  fi
done

# Unused files
find packages/ -name "*.ts" -type f -exec grep -l "{}" \; | wc -l
```

### **Find Russian Text**
```bash
# In docs
find docs -name "*.md" -exec grep -l "[А-Яа-яЁё]" {} \;

# In code
grep -r "[А-Яа-яЁё]" packages --include="*.ts" --include="*.tsx"
```

### **Find Duplicate Functions**
```bash
# Look for similar function names
grep -r "function.*health\|health.*function" packages/
grep -r "GET.*health" packages/
```

### **Validate After Deletion**
```bash
pnpm build      # Does it compile?
pnpm test       # Do tests pass?
pnpm lint       # Any style issues?
```

---

## 📚 Documentation Standards

### **Every new feature needs:**
- [ ] README or guide in `docs/guides/`
- [ ] Inline code comments (English only)
- [ ] Updated `ROOT_STRUCTURE.md` if structure changed
- [ ] Entry in CHANGELOG.md (if one exists)

### **When archiving code:**
- [ ] Move to `docs/archived/[feature_name]/`
- [ ] Create summary: "Why this was removed"
- [ ] Reference date and reason in doc header
- [ ] Link from main docs for historical context

### **Error Messages & Comments**
```typescript
// Bad
// Check the user status
if (!user) throw new Error("error");

// Good
// Verify user is authenticated before proceeding with chat initialization
// Return 401 if token expired or invalid per OpenAI requirements
if (!user) throw new Error("Unauthorized: User not authenticated");
```

---

## ✅ Pre-Commit Checklist

Before pushing code:

```
□ No Russian text (grep -r "[А-Яа-яЁё]" .)
□ No console.log/debugger left
□ No commented-out code (or document why it's there)
□ Tests pass (pnpm test)
□ Builds successfully (pnpm build)
□ No .env files committed (only .env.example)
□ No node_modules in commit
□ No duplicate functions/endpoints
□ English comments and documentation
□ .gitignore up to date
```

---

## 🎯 How to Request Cleanup

If you find issues post-cleanup, create an issue with:

```markdown
## Cleanup Issue

**Problem:** [Brief description]

**Location:** [file path or directory]

**Impact:** [Does it break anything?]

**Solution:** [Proposed fix]

**PR:** [Link to fix PR]
```

Example:
```markdown
## Cleanup Issue: Duplicate Endpoint

**Problem:** Both `/api/health` and `/api/status` return identical data

**Location:** packages/backend/src/api/

**Impact:** Confuses API consumers, should document which is canonical

**Solution:** Remove `/api/status`, keep `/api/health` only
```

---

## 📞 Quick Reference

**Canonical Stack Elements:**
- Backend: Fastify 4.25 + Node.js 20 + TypeScript
- Frontend: Next.js 14.2 + React + Tailwind
- Database: PostgreSQL 16 + Prisma 5.7
- LLM: OpenAI Realtime API (gpt-4o models)
- Package Manager: pnpm (NOT npm)
- Build: Turbo + tsc
- Testing: Jest + Vitest
- Language: 100% English

**Status: PRODUCTION READY ✅**

Last verified: February 10, 2026
