import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV ?? 'development',
      version: process.env.npm_package_version ?? '1.0.0',
      service: 'koepon-api',
    };
  }

  @Get('ready')
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        server: 'ok',
        // TODO: Add database check
        // TODO: Add redis check
      },
    };
  }
}
