/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/public.decorator';
import { CheckMemberActiveUseCase } from '@application/use-cases/members/check-member-active.use-case';
import { ValidateEmailHttpDto } from '../dto/validate-email-http.dto';
import { ValidateEmailResponseHttpDto } from '../dto/validate-email-response-http.dto';

@ApiTags('Auth V2')
@Controller('v2/auth')
export class AuthV2Controller {
  constructor(
    private readonly checkMemberActiveUseCase: CheckMemberActiveUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('validate-email')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Validar si un correo electrónico pertenece a un socio activo',
    description:
      'Comprueba la existencia y estado activo de un socio antes de emitir autenticación (Magic Link). Endpoint público protegido por limitación de tasa (rate limiting) para mitigar enumeración de correos.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado de la validación del socio',
    type: ValidateEmailResponseHttpDto,
  })
  @ApiBadRequestResponse({
    description: 'Formato de correo electrónico no válido o cuerpo mal formado',
  })
  @ApiTooManyRequestsResponse({
    description: 'Límite de solicitudes excedido por IP (Throttling)',
  })
  async validateEmail(
    @Body() dto: ValidateEmailHttpDto,
  ): Promise<ValidateEmailResponseHttpDto> {
    return this.checkMemberActiveUseCase.execute({ email: dto.email });
  }
}
