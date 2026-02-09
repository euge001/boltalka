import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createApp } from '../src/config/fastify';
import { registerHealthCheck } from '../src/api/health';
import { AppConfig } from '../src/config/app';

describe('Backend - Health Check Endpoints', () => {
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
    const startTime = Date.now();
    await registerHealthCheck(app, startTime, '2.0.0', 'test');
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /health', () => {
    it('should return health check response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return correct health check structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('environment');
      expect(body).toHaveProperty('version');
    });

    it('should return status ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
    });

    it('should return correct environment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(body.environment).toBe('test');
    });

    it('should return correct version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(body.version).toBe('2.0.0');
    });

    it('should return valid timestamp', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(new Date(body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return uptime as number', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /readiness', () => {
    it('should return readiness check', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/readiness',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('ready');
      expect(body.ready).toBe(true);
    });
  });

  describe('GET /liveness', () => {
    it('should return liveness check', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/liveness',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('alive');
      expect(body.alive).toBe(true);
    });
  });
});
