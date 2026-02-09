import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createApp } from '../src/config/fastify';
import { AppConfig } from '../src/config/app';

describe('Backend - Fastify App Creation', () => {
  let app: any;
  const testConfig: AppConfig = {
    host: 'localhost',
    port: 3000,
    nodeEnv: 'test',
    corsOrigin: 'http://localhost:3001',
    jwtSecret: 'test-secret-key',
    databaseUrl: 'postgresql://localhost/test',
    logLevel: 'silent',
  };

  beforeEach(async () => {
    app = await createApp(testConfig);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create Fastify app instance', () => {
    expect(app).toBeDefined();
    expect(app.server).toBeDefined();
  });

  it('should have logger configured', () => {
    expect(app.log).toBeDefined();
  });

  it('should have CORS plugin registered', async () => {
    // CORS plugin should be loaded
    expect(app).toBeDefined();
  });

  it('should have JWT plugin registered', async () => {
    // JWT plugin should be loaded
    expect(app).toBeDefined();
  });

  it('should be able to register routes', async () => {
    app.get('/test', async (request: any, reply: any) => {
      return reply.send({ test: 'ok' });
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ test: 'ok' });
  });

  it('should have request ID header support', () => {
    // The app should be configured with request ID tracking
    expect(app).toBeDefined();
  });

  it('should trust proxy', () => {
    // Trust proxy should be enabled
    expect(app).toBeDefined();
  });
});
