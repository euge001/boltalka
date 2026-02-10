import * as fs from 'fs';
import * as path from 'path';

describe('Docker Configuration', () => {
  const rootDir = path.join(__dirname, '..');

  describe('Docker Files', () => {
    it('should have Dockerfile.backend', () => {
      const path_file = path.join(rootDir, 'Dockerfile.backend');
      expect(fs.existsSync(path_file)).toBe(true);
    });

    it('should have Dockerfile.frontend', () => {
      const path_file = path.join(rootDir, 'Dockerfile.frontend');
      expect(fs.existsSync(path_file)).toBe(true);
    });

    it('should have docker-compose.yml', () => {
      const path_file = path.join(rootDir, 'docker-compose.yml');
      expect(fs.existsSync(path_file)).toBe(true);
    });

    it('should have .dockerignore', () => {
      const path_file = path.join(rootDir, '.dockerignore');
      expect(fs.existsSync(path_file)).toBe(true);
    });

    it('should have .env.docker', () => {
      const path_file = path.join(rootDir, '.env.docker');
      expect(fs.existsSync(path_file)).toBe(true);
    });
  });

  describe('Startup Scripts', () => {
    it('should have start.sh script', () => {
      const path_file = path.join(rootDir, 'start.sh');
      expect(fs.existsSync(path_file)).toBe(true);
    });

    it('should have quick-start.sh script', () => {
      const path_file = path.join(rootDir, 'quick-start.sh');
      expect(fs.existsSync(path_file)).toBe(true);
    });

    it('should have DOCKER.md documentation', () => {
      const path_file = path.join(rootDir, 'DOCKER.md');
      expect(fs.existsSync(path_file)).toBe(true);
    });
  });

  describe('Docker Compose Content', () => {
    it('should have valid docker-compose.yml', () => {
      const composePath = path.join(rootDir, 'docker-compose.yml');
      const content = fs.readFileSync(composePath, 'utf-8');
      expect(content).toContain('version');
      expect(content).toContain('services');
    });

    it('should have postgres service', () => {
      const composePath = path.join(rootDir, 'docker-compose.yml');
      const content = fs.readFileSync(composePath, 'utf-8');
      expect(content).toContain('postgres:');
    });

    it('should have backend service', () => {
      const composePath = path.join(rootDir, 'docker-compose.yml');
      const content = fs.readFileSync(composePath, 'utf-8');
      expect(content).toContain('backend:');
    });

    it('should have frontend service', () => {
      const composePath = path.join(rootDir, 'docker-compose.yml');
      const content = fs.readFileSync(composePath, 'utf-8');
      expect(content).toContain('frontend:');
    });

    it('should have networks defined', () => {
      const composePath = path.join(rootDir, 'docker-compose.yml');
      const content = fs.readFileSync(composePath, 'utf-8');
      expect(content).toContain('networks:');
      expect(content).toContain('boltalka-network:');
    });

    it('should have volumes defined', () => {
      const composePath = path.join(rootDir, 'docker-compose.yml');
      const content = fs.readFileSync(composePath, 'utf-8');
      expect(content).toContain('volumes:');
      expect(content).toContain('postgres_data:');
    });
  });

  describe('Dockerfile Content', () => {
    it('backend Dockerfile should have build and production stages', () => {
      const dockerfilePath = path.join(rootDir, 'Dockerfile.backend');
      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(content).toContain('FROM node:20-alpine AS builder');
      expect(content).toContain('FROM node:20-alpine');
      expect(content).toContain('pnpm install');
    });

    it('backend Dockerfile should have health check', () => {
      const dockerfilePath = path.join(rootDir, 'Dockerfile.backend');
      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(content).toContain('HEALTHCHECK');
    });

    it('frontend Dockerfile should have build and production stages', () => {
      const dockerfilePath = path.join(rootDir, 'Dockerfile.frontend');
      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(content).toContain('FROM node:20-alpine AS builder');
      expect(content).toContain('FROM node:20-alpine');
    });
  });

  describe('Environment Configuration', () => {
    it('.env.docker should have required variables', () => {
      const envPath = path.join(rootDir, '.env.docker');
      const content = fs.readFileSync(envPath, 'utf-8');
      expect(content).toContain('NODE_ENV');
      expect(content).toContain('DB_HOST');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('JWT_SECRET');
      expect(content).toContain('NEXT_PUBLIC_API_URL');
    });

    it('.dockerignore should exclude unnecessary files', () => {
      const dockerignorePath = path.join(rootDir, '.dockerignore');
      const content = fs.readFileSync(dockerignorePath, 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('dist');
      expect(content).toContain('.git');
    });
  });

  describe('Startup Scripts Content', () => {
    it('start.sh should check Docker installation', () => {
      const scriptPath = path.join(rootDir, 'start.sh');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('docker');
      expect(content).toContain('docker-compose');
    });

    it('start.sh should run migrations', () => {
      const scriptPath = path.join(rootDir, 'start.sh');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('prisma migrate');
    });

    it('quick-start.sh should be simpler', () => {
      const scriptPath = path.join(rootDir, 'quick-start.sh');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('docker-compose');
      expect(content).toContain('up');
    });
  });

  describe('Package.json Docker scripts', () => {
    it('should have docker scripts in package.json', () => {
      const packageJsonPath = path.join(rootDir, 'package.json');
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const json = JSON.parse(content);
      expect(json.scripts['docker:up']).toBeDefined();
      expect(json.scripts['docker:down']).toBeDefined();
      expect(json.scripts['start']).toBeDefined();
    });
  });
});
