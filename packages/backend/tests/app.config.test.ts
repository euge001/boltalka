import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadConfig, validateConfig, AppConfig } from '../src/config/app';

describe('Backend - App Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    (process.env as any) = { ...originalEnv };
  });

  afterEach(() => {
    (process.env as any) = { ...originalEnv };
  });

  describe('loadConfig', () => {
    it('should load default configuration', () => {
      delete (process.env as any).HOST;
      delete (process.env as any).PORT;
      delete (process.env as any).NODE_ENV;
      delete (process.env as any).CORS_ORIGIN;
      delete (process.env as any).JWT_SECRET;
      delete (process.env as any).DATABASE_URL;
      delete (process.env as any).LOG_LEVEL;

      const config = loadConfig();

      expect(config).toMatchObject({
        host: '0.0.0.0',
        port: 3000,
        nodeEnv: 'development',
        corsOrigin: 'http://localhost:3001',
        jwtSecret: 'dev-secret-key-change-in-production',
        databaseUrl: 'postgresql://localhost/boltalka',
        logLevel: 'info',
      });
    });

    it('should load configuration from environment variables', () => {
      (process.env as any).HOST = '127.0.0.1';
      (process.env as any).PORT = '8080';
      (process.env as any).NODE_ENV = 'production';
      (process.env as any).CORS_ORIGIN = 'https://example.com';
      (process.env as any).JWT_SECRET = 'prod-secret';
      (process.env as any).DATABASE_URL = 'postgresql://user:pass@host/db';
      (process.env as any).LOG_LEVEL = 'debug';
      (process.env as any).OPENAI_API_KEY = 'sk-test';

      const config = loadConfig();

      expect(config).toMatchObject({
        host: '127.0.0.1',
        port: 8080,
        nodeEnv: 'production',
        corsOrigin: 'https://example.com',
        jwtSecret: 'prod-secret',
        databaseUrl: 'postgresql://user:pass@host/db',
        openaiApiKey: 'sk-test',
        logLevel: 'debug',
      });
    });

    it('should parse port as number', () => {
      (process.env as any).PORT = '5000';
      const config = loadConfig();
      expect(config.port).toBe(5000);
      expect(typeof config.port).toBe('number');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct development config', () => {
      const config: AppConfig = {
        host: 'localhost',
        port: 3000,
        nodeEnv: 'development',
        corsOrigin: 'http://localhost:3001',
        jwtSecret: 'dev-secret',
        databaseUrl: 'postgresql://localhost/boltalka',
        logLevel: 'info',
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should throw error if DATABASE_URL is missing', () => {
      const config: AppConfig = {
        host: 'localhost',
        port: 3000,
        nodeEnv: 'development',
        corsOrigin: 'http://localhost:3001',
        jwtSecret: 'dev-secret',
        databaseUrl: '',
        logLevel: 'info',
      };

      expect(() => validateConfig(config)).toThrow('DATABASE_URL');
    });

    it('should throw error if JWT_SECRET is missing', () => {
      const config: AppConfig = {
        host: 'localhost',
        port: 3000,
        nodeEnv: 'development',
        corsOrigin: 'http://localhost:3001',
        jwtSecret: '',
        databaseUrl: 'postgresql://localhost/boltalka',
        logLevel: 'info',
      };

      expect(() => validateConfig(config)).toThrow('JWT_SECRET');
    });

    it('should throw error if OPENAI_API_KEY is missing in production', () => {
      const config: AppConfig = {
        host: 'localhost',
        port: 3000,
        nodeEnv: 'production',
        corsOrigin: 'https://example.com',
        jwtSecret: 'prod-secret',
        databaseUrl: 'postgresql://localhost/boltalka',
        logLevel: 'info',
      };

      expect(() => validateConfig(config)).toThrow('OPENAI_API_KEY');
    });

    it('should throw error if JWT_SECRET is default in production', () => {
      const config: AppConfig = {
        host: 'localhost',
        port: 3000,
        nodeEnv: 'production',
        corsOrigin: 'https://example.com',
        jwtSecret: 'dev-secret-key-change-in-production',
        databaseUrl: 'postgresql://localhost/boltalka',
        openaiApiKey: 'sk-test',
        logLevel: 'info',
      };

      expect(() => validateConfig(config)).toThrow('JWT_SECRET must be changed');
    });

    it('should validate correct production config', () => {
      const config: AppConfig = {
        host: 'localhost',
        port: 3000,
        nodeEnv: 'production',
        corsOrigin: 'https://example.com',
        jwtSecret: 'prod-secret-key',
        databaseUrl: 'postgresql://user:pass@host/db',
        openaiApiKey: 'sk-test',
        logLevel: 'info',
      };

      expect(() => validateConfig(config)).not.toThrow();
    });
  });
});
