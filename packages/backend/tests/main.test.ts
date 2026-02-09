import { describe, it, expect } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs';

describe('Backend - Main Entry Point', () => {
  it('should have main.ts file', () => {
    const mainPath = path.join(__dirname, '../src/main.ts');
    expect(fs.existsSync(mainPath)).toBe(true);
  });

  it('should have logger configuration file', () => {
    const loggerPath = path.join(__dirname, '../src/config/logger.ts');
    expect(fs.existsSync(loggerPath)).toBe(true);
  });

  it('should have app configuration file', () => {
    const appConfigPath = path.join(__dirname, '../src/config/app.ts');
    expect(fs.existsSync(appConfigPath)).toBe(true);
  });

  it('should have fastify configuration file', () => {
    const fastifyConfigPath = path.join(__dirname, '../src/config/fastify.ts');
    expect(fs.existsSync(fastifyConfigPath)).toBe(true);
  });

  it('should have health check API', () => {
    const healthPath = path.join(__dirname, '../src/api/health.ts');
    expect(fs.existsSync(healthPath)).toBe(true);
  });

  it('should have .env file with configuration', () => {
    const envPath = path.join(__dirname, '../../backend/.env');
    expect(fs.existsSync(envPath)).toBe(true);
    
    const envContent = fs.readFileSync(envPath, 'utf-8');
    expect(envContent).toContain('DATABASE_URL');
    expect(envContent).toContain('JWT_SECRET');
    expect(envContent).toContain('CORS_ORIGIN');
  });

  it('should have Prisma schema file', () => {
    const prismaPath = path.join(__dirname, '../../backend/prisma/schema.prisma');
    expect(fs.existsSync(prismaPath)).toBe(true);
  });

  it('should have correct Prisma database provider', () => {
    const prismaPath = path.join(__dirname, '../../backend/prisma/schema.prisma');
    const schemaContent = fs.readFileSync(prismaPath, 'utf-8');
    expect(schemaContent).toContain('provider = "postgresql"');
  });

  it('should have User model in Prisma schema', () => {
    const prismaPath = path.join(__dirname, '../../backend/prisma/schema.prisma');
    const schemaContent = fs.readFileSync(prismaPath, 'utf-8');
    expect(schemaContent).toContain('model User');
  });

  it('should have Conversation model in Prisma schema', () => {
    const prismaPath = path.join(__dirname, '../../backend/prisma/schema.prisma');
    const schemaContent = fs.readFileSync(prismaPath, 'utf-8');
    expect(schemaContent).toContain('model Conversation');
  });

  it('should have Message model in Prisma schema', () => {
    const prismaPath = path.join(__dirname, '../../backend/prisma/schema.prisma');
    const schemaContent = fs.readFileSync(prismaPath, 'utf-8');
    expect(schemaContent).toContain('model Message');
  });

  it('should export logger as default', async () => {
    const logger = await import('../src/config/logger');
    expect(logger.default).toBeDefined();
    expect(logger.logger).toBeDefined();
  });

  it('should export AppConfig interface', async () => {
    const appConfig = await import('../src/config/app');
    expect(appConfig.loadConfig).toBeDefined();
    expect(appConfig.validateConfig).toBeDefined();
  });

  it('should export createApp function', async () => {
    const fastifyConfig = await import('../src/config/fastify');
    expect(fastifyConfig.createApp).toBeDefined();
  });

  it('should export health check registration', async () => {
    const health = await import('../src/api/health');
    expect(health.registerHealthCheck).toBeDefined();
  });
});
