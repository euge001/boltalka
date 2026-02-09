import * as fs from 'fs';
import * as path from 'path';

describe('Backend Configuration (Day 1)', () => {
  const backendDir = process.cwd();

  describe('Backend Directory Structure', () => {
    it('should have src directory', () => {
      const srcDir = path.join(backendDir, 'src');
      expect(fs.existsSync(srcDir)).toBe(true);
    });

    it('should have core subdirectory', () => {
      const coreDir = path.join(backendDir, 'src/core');
      expect(fs.existsSync(coreDir)).toBe(true);
    });

    it('should have api subdirectory', () => {
      const apiDir = path.join(backendDir, 'src/api');
      expect(fs.existsSync(apiDir)).toBe(true);
    });

    it('should have services subdirectory', () => {
      const servicesDir = path.join(backendDir, 'src/services');
      expect(fs.existsSync(servicesDir)).toBe(true);
    });

    it('should have utils subdirectory', () => {
      const utilsDir = path.join(backendDir, 'src/utils');
      expect(fs.existsSync(utilsDir)).toBe(true);
    });

    it('should have tests directory', () => {
      const testsDir = path.join(backendDir, 'tests');
      expect(fs.existsSync(testsDir)).toBe(true);
    });

    it('should have prisma directory', () => {
      const prismaDir = path.join(backendDir, 'prisma');
      expect(fs.existsSync(prismaDir)).toBe(true);
    });
  });

  describe('Backend Configuration Files', () => {
    it('should have package.json', () => {
      const packageJsonFile = path.join(backendDir, 'package.json');
      expect(fs.existsSync(packageJsonFile)).toBe(true);
    });

    it('should have valid package.json', () => {
      const packageJsonFile = path.join(backendDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));
      expect(content.name).toBe('@boltalka/backend');
      expect(content.version).toBe('2.0.0');
      expect(content.scripts.dev).toBe('ts-node --esm src/main.ts');
      expect(content.scripts.build).toBe('tsc');
      expect(content.dependencies.fastify).toBeDefined();
    });

    it('should have tsconfig.json', () => {
      const tsconfigFile = path.join(backendDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigFile)).toBe(true);
    });

    it('should have valid tsconfig.json', () => {
      const tsconfigFile = path.join(backendDir, 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigFile, 'utf-8'));
      expect(content.compilerOptions.target).toBe('ES2020');
      expect(content.compilerOptions.module).toBe('ES2020');
      expect(content.compilerOptions.strict).toBe(true);
      expect(content.compilerOptions.outDir).toBe('./dist');
    });

    it('should have jest config', () => {
      const jestConfigFile = path.join(backendDir, 'jest.config.cjs');
      expect(fs.existsSync(jestConfigFile)).toBe(true);
    });

    it('should have .env.example', () => {
      const envExampleFile = path.join(backendDir, '.env.example');
      expect(fs.existsSync(envExampleFile)).toBe(true);
      const content = fs.readFileSync(envExampleFile, 'utf-8');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('OPENAI_API_KEY');
    });

    it('should have .env', () => {
      const envFile = path.join(backendDir, '.env');
      expect(fs.existsSync(envFile)).toBe(true);
    });
  });

  describe('Backend Dependencies', () => {
    let packageJson: any;

    beforeAll(() => {
      const packageJsonFile = path.join(backendDir, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));
    });

    it('should have fastify dependency', () => {
      expect(packageJson.dependencies.fastify).toBeDefined();
    });

    it('should have required devDependencies', () => {
      expect(packageJson.devDependencies.typescript).toBeDefined();
      expect(packageJson.devDependencies.jest).toBeDefined();
      expect(packageJson.devDependencies['ts-jest']).toBeDefined();
    });
  });
});
