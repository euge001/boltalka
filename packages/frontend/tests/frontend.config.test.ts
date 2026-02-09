import * as fs from 'fs';
import * as path from 'path';

describe('Frontend Configuration (Day 1)', () => {
  const frontendDir = process.cwd();

  describe('Frontend Directory Structure', () => {
    it('should have app directory', () => {
      const appDir = path.join(frontendDir, 'app');
      expect(fs.existsSync(appDir)).toBe(true);
    });

    it('should have components directory', () => {
      const componentsDir = path.join(frontendDir, 'components');
      expect(fs.existsSync(componentsDir)).toBe(true);
    });

    it('should have hooks directory', () => {
      const hooksDir = path.join(frontendDir, 'hooks');
      expect(fs.existsSync(hooksDir)).toBe(true);
    });

    it('should have store directory', () => {
      const storeDir = path.join(frontendDir, 'store');
      expect(fs.existsSync(storeDir)).toBe(true);
    });

    it('should have services directory', () => {
      const servicesDir = path.join(frontendDir, 'services');
      expect(fs.existsSync(servicesDir)).toBe(true);
    });

    it('should have tests directory', () => {
      const testsDir = path.join(frontendDir, 'tests');
      expect(fs.existsSync(testsDir)).toBe(true);
    });

    it('should have public directory', () => {
      const publicDir = path.join(frontendDir, 'public');
      expect(fs.existsSync(publicDir)).toBe(true);
    });
  });

  describe('Frontend Configuration Files', () => {
    it('should have package.json', () => {
      const packageJsonFile = path.join(frontendDir, 'package.json');
      expect(fs.existsSync(packageJsonFile)).toBe(true);
    });

    it('should have valid package.json', () => {
      const packageJsonFile = path.join(frontendDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));
      expect(content.name).toBe('@boltalka/frontend');
      expect(content.version).toBe('2.0.0');
      expect(content.scripts.dev).toContain('next dev');
      expect(content.scripts.build).toBe('next build');
      expect(content.dependencies.next).toBeDefined();
      expect(content.dependencies.react).toBeDefined();
    });

    it('should have tsconfig.json', () => {
      const tsconfigFile = path.join(frontendDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigFile)).toBe(true);
    });

    it('should have next.config.js', () => {
      const nextConfigFile = path.join(frontendDir, 'next.config.js');
      expect(fs.existsSync(nextConfigFile)).toBe(true);
    });

    it('should have tailwind.config.ts', () => {
      const tailwindConfigFile = path.join(frontendDir, 'tailwind.config.ts');
      expect(fs.existsSync(tailwindConfigFile)).toBe(true);
    });

    it('should have postcss.config.js', () => {
      const postcssConfigFile = path.join(frontendDir, 'postcss.config.js');
      expect(fs.existsSync(postcssConfigFile)).toBe(true);
    });

    it('should have global styles', () => {
      const globalsFile = path.join(frontendDir, 'app/globals.css');
      expect(fs.existsSync(globalsFile)).toBe(true);
    });

    it('should have .env.local', () => {
      const envFile = path.join(frontendDir, '.env.local');
      expect(fs.existsSync(envFile)).toBe(true);
    });
  });

  describe('Frontend Dependencies', () => {
    let packageJson: any;

    beforeAll(() => {
      const packageJsonFile = path.join(frontendDir, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));
    });

    it('should have next dependency', () => {
      expect(packageJson.dependencies.next).toBeDefined();
    });

    it('should have react dependencies', () => {
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
    });

    it('should have zustand for state management', () => {
      expect(packageJson.dependencies.zustand).toBeDefined();
    });

    it('should have required devDependencies', () => {
      expect(packageJson.devDependencies.typescript).toBeDefined();
      expect(packageJson.devDependencies.tailwindcss).toBeDefined();
      expect(packageJson.devDependencies.vitest).toBeDefined();
    });
  });
});
