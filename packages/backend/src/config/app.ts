export interface AppConfig {
  host: string;
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  jwtSecret: string;
  databaseUrl: string;
  openaiApiKey?: string;
  logLevel: string;
}

export function loadConfig(): AppConfig {
  return {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost/boltalka',
    openaiApiKey: process.env.OPENAI_API_KEY,
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

export function validateConfig(config: AppConfig): void {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (config.nodeEnv === 'production') {
    if (!config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required in production');
    }
    if (config.jwtSecret === 'dev-secret-key-change-in-production') {
      throw new Error('JWT_SECRET must be changed from default in production');
    }
  }
}
