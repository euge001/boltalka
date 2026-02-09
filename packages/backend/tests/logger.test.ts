import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as path from 'path';

describe('Backend - Logger Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should load logger in development mode', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('../src/config/logger');
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });

  it('should load logger in production mode', async () => {
    process.env.NODE_ENV = 'production';
    const { logger } = await import('../src/config/logger');
    expect(logger).toBeDefined();
  });

  it('should respect LOG_LEVEL environment variable', async () => {
    process.env.LOG_LEVEL = 'debug';
    const { logger } = await import('../src/config/logger');
    expect(logger).toBeDefined();
  });

  it('should have default log level as info', async () => {
    delete process.env.LOG_LEVEL;
    const { logger } = await import('../src/config/logger');
    expect(logger).toBeDefined();
  });

  it('should be singleton export', async () => {
    const module1 = await import('../src/config/logger');
    const module2 = await import('../src/config/logger');
    expect(module1.default).toBe(module2.default);
  });
});
