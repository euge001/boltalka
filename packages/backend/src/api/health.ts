import { FastifyInstance } from 'fastify';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

export async function registerHealthCheck(
  app: FastifyInstance,
  startTime: number,
  version: string,
  environment: string,
) {
  app.get<{ Reply: HealthCheckResponse }>('/health', async (request, reply) => {
    const uptime = (Date.now() - startTime) / 1000;

    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime,
      environment,
      version,
    });
  });

  app.get('/readiness', async (request, reply) => {
    return reply.send({ ready: true });
  });

  app.get('/liveness', async (request, reply) => {
    return reply.send({ alive: true });
  });
}
