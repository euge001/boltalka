import { loadConfig, validateConfig } from './config/app';
import { createApp } from './config/fastify';
import { registerHealthCheck } from './api/health';
import { registerLLMRoutes } from './api/rest/routes/llm.routes';
import { registerAgentRoutes } from './api/rest/routes/agent.routes';
import { LLMChainFactory } from './core/llm';
import logger from './config/logger';

const VERSION = '2.0.0';
const START_TIME = Date.now();

async function bootstrap() {
  try {
    // Load and validate configuration
    const config = loadConfig();
    validateConfig(config);

    logger.info('Configuration loaded', {
      environment: config.nodeEnv,
      port: config.port,
      host: config.host,
    });

    // Create Fastify app
    const app = await createApp(config);

    // Initialize LLM chains
    logger.info('Initializing LLM chains...');
    const llmInit = LLMChainFactory.initialize();
    if (!llmInit.success) {
      logger.warn('LLM initialization warning', llmInit);
    } else {
      logger.info(llmInit.message);
    }

    // Register routes
    await registerHealthCheck(app, START_TIME, VERSION, config.nodeEnv);
    await registerLLMRoutes(app);
    await registerAgentRoutes(app);

    // Root endpoint
    app.get('/', async (request, reply) => {
      return reply.send({
        message: 'Boltalka API v2.0.0',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    });

    // Start server
    const address = await app.listen({ host: config.host, port: config.port });
    logger.info(`Server running at ${address}`, { version: VERSION });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
