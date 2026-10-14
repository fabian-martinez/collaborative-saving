import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './infrastructure/nestjs/auth/decorators/public.decorator';

export interface HealthResponseDto {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Default root greeting' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service greeting' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary:
      'Lightweight health check for keep-alive monitoring and uptime probes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        uptime: { type: 'number', example: 123.45 },
        timestamp: { type: 'string', example: '2026-09-19T19:00:00.000Z' },
      },
    },
  })
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime() * 100) / 100,
      timestamp: new Date().toISOString(),
    };
  }
}
