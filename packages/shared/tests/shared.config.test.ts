import * as fs from 'fs';
import * as path from 'path';

describe('Shared Package Configuration', () => {
  const sharedDir = process.cwd();

  describe('Shared Directory Structure', () => {
    it('should have src directory', () => {
      const srcDir = path.join(sharedDir, 'src');
      expect(fs.existsSync(srcDir)).toBe(true);
    });
  });

  describe('Shared Configuration Files', () => {
    it('should have package.json', () => {
      const packageJsonFile = path.join(sharedDir, 'package.json');
      expect(fs.existsSync(packageJsonFile)).toBe(true);
    });

    it('should have valid package.json', () => {
      const packageJsonFile = path.join(sharedDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));
      expect(content.name).toBe('@boltalka/shared');
      expect(content.version).toBe('2.0.0');
      expect(content.private).toBe(true);
    });

    it('should have tsconfig.json', () => {
      const tsconfigFile = path.join(sharedDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigFile)).toBe(true);
    });

    it('should have index.ts', () => {
      const indexFile = path.join(sharedDir, 'src/index.ts');
      expect(fs.existsSync(indexFile)).toBe(true);
    });

    it('should export API_VERSION', () => {
      const indexFile = path.join(sharedDir, 'src/index.ts');
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('API_VERSION');
      expect(content).toContain('2.0.0');
    });

    it('should export type definitions', () => {
      const indexFile = path.join(sharedDir, 'src/index.ts');
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('interface Message');
      expect(content).toContain('interface Conversation');
    });
  });
});
