import * as fs from 'fs';
import * as path from 'path';

describe('Day 1: Monorepo Structure', () => {
  const rootDir = process.cwd();

  describe('Directory Structure', () => {
    it('should have packages directory', () => {
      const packagesDir = path.join(rootDir, 'packages');
      expect(fs.existsSync(packagesDir)).toBe(true);
    });

    it('should have backend package', () => {
      const backendDir = path.join(rootDir, 'packages/backend');
      expect(fs.existsSync(backendDir)).toBe(true);
    });

    it('should have frontend package', () => {
      const frontendDir = path.join(rootDir, 'packages/frontend');
      expect(fs.existsSync(frontendDir)).toBe(true);
    });

    it('should have shared package', () => {
      const sharedDir = path.join(rootDir, 'packages/shared');
      expect(fs.existsSync(sharedDir)).toBe(true);
    });

    it('should have infra directory', () => {
      const infraDir = path.join(rootDir, 'infra');
      expect(fs.existsSync(infraDir)).toBe(true);
    });

    it('should have .github/workflows directory', () => {
      const workflowsDir = path.join(rootDir, '.github/workflows');
      expect(fs.existsSync(workflowsDir)).toBe(true);
    });

    it('should have docs directory', () => {
      const docsDir = path.join(rootDir, 'docs');
      expect(fs.existsSync(docsDir)).toBe(true);
    });
  });

  describe('Root Configuration Files', () => {
    it('should have package.json', () => {
      const packageJson = path.join(rootDir, 'package.json');
      expect(fs.existsSync(packageJson)).toBe(true);
    });

    it('should have valid package.json', () => {
      const packageJson = path.join(rootDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      expect(content.name).toBe('boltalka-ai-native');
      expect(content.version).toBe('2.0.0');
      expect(content.private).toBe(true);
      expect(content.scripts).toBeDefined();
      expect(content.scripts.dev).toBe('turbo run dev');
      expect(content.scripts.build).toBe('turbo run build');
      expect(content.scripts.test).toBe('turbo run test');
      expect(content.scripts['test:root']).toBeDefined();
    });

    it('should have pnpm-workspace.yaml', () => {
      const workspaceFile = path.join(rootDir, 'pnpm-workspace.yaml');
      expect(fs.existsSync(workspaceFile)).toBe(true);
      const content = fs.readFileSync(workspaceFile, 'utf-8');
      expect(content).toContain('packages:');
      expect(content).toContain("- 'packages/**'");
    });

    it('should have tsconfig.json', () => {
      const tsconfigFile = path.join(rootDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigFile)).toBe(true);
    });

    it('should have valid tsconfig.json', () => {
      const tsconfigFile = path.join(rootDir, 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigFile, 'utf-8'));
      expect(content.compilerOptions).toBeDefined();
      expect(content.compilerOptions.target).toBe('ES2020');
      expect(content.compilerOptions.strict).toBe(true);
      expect(content.compilerOptions.module).toBe('ESNext');
    });

    it('should have .prettierrc.json', () => {
      const prettierFile = path.join(rootDir, '.prettierrc.json');
      expect(fs.existsSync(prettierFile)).toBe(true);
    });

    it('should have valid .prettierrc.json', () => {
      const prettierFile = path.join(rootDir, '.prettierrc.json');
      const content = JSON.parse(fs.readFileSync(prettierFile, 'utf-8'));
      expect(content.semi).toBe(true);
      expect(content.singleQuote).toBe(true);
      expect(content.tabWidth).toBe(2);
    });

    it('should have .prettierignore', () => {
      const prettierIgnoreFile = path.join(rootDir, '.prettierignore');
      expect(fs.existsSync(prettierIgnoreFile)).toBe(true);
      const content = fs.readFileSync(prettierIgnoreFile, 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('pnpm-lock.yaml');
    });

    it('should have .gitignore', () => {
      const gitignoreFile = path.join(rootDir, '.gitignore');
      expect(fs.existsSync(gitignoreFile)).toBe(true);
      const content = fs.readFileSync(gitignoreFile, 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('.env');
      expect(content).toContain('dist');
      expect(content).toContain('.turbo');
    });

    it('should have .env.example', () => {
      const envExampleFile = path.join(rootDir, '.env.example');
      expect(fs.existsSync(envExampleFile)).toBe(true);
      const content = fs.readFileSync(envExampleFile, 'utf-8');
      expect(content).toContain('OPENAI_API_KEY');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('REDIS_URL');
    });

    it('should have .env', () => {
      const envFile = path.join(rootDir, '.env');
      expect(fs.existsSync(envFile)).toBe(true);
    });
  });

  describe('Package.json Scripts', () => {
    let packageJson: any;

    beforeAll(() => {
      const packageJsonFile = path.join(rootDir, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));
    });

    it('should have dev script', () => {
      expect(packageJson.scripts.dev).toBeDefined();
    });

    it('should have build script', () => {
      expect(packageJson.scripts.build).toBeDefined();
    });

    it('should have test script', () => {
      expect(packageJson.scripts.test).toBeDefined();
    });

    it('should have lint script', () => {
      expect(packageJson.scripts.lint).toBeDefined();
    });

    it('should have format script', () => {
      expect(packageJson.scripts.format).toBeDefined();
    });

    it('should have clean script', () => {
      expect(packageJson.scripts.clean).toBeDefined();
    });
  });

  describe('Turbo and Dependencies', () => {
    let packageJson: any;

    beforeAll(() => {
      const packageJsonFile = path.join(rootDir, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));
    });

    it('should have turbo as devDependency', () => {
      expect(packageJson.devDependencies.turbo).toBeDefined();
    });

    it('should have prettier as devDependency', () => {
      expect(packageJson.devDependencies.prettier).toBeDefined();
    });

    it('should have typescript as devDependency', () => {
      expect(packageJson.devDependencies.typescript).toBeDefined();
    });

    it('should use pnpm as package manager', () => {
      expect(packageJson.packageManager).toBe('pnpm@8.15.4');
    });
  });

  describe('Environment Variables', () => {
    it('should have valid .env file with required vars', () => {
      const envFile = path.join(rootDir, '.env');
      const content = fs.readFileSync(envFile, 'utf-8');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('REDIS_URL');
      expect(content).toContain('NODE_ENV');
    });

    it('should have example .env.example', () => {
      const envExampleFile = path.join(rootDir, '.env.example');
      const content = fs.readFileSync(envExampleFile, 'utf-8');
      expect(content).toContain('sk-...');
      expect(content).toContain('NEXT_PUBLIC_API_URL');
    });
  });
});
