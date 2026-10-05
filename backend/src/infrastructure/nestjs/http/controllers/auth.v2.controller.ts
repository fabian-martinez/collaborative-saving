/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUserDto } from '@application/queries/auth/get-authenticated-user.query';
import { CheckMemberActiveUseCase } from '@application/use-cases/members/check-member-active.use-case';
import { GetAuthenticatedMemberQueryHandler } from '@application/queries/auth/get-authenticated-member.query-handler';
import { ValidateEmailHttpDto } from '../dto/validate-email-http.dto';
import { ValidateEmailResponseHttpDto } from '../dto/validate-email-response-http.dto';
import { MemberResponseHttpDto } from '../dto/member-response-http.dto';

@ApiTags('Auth V2')
@Controller('v2/auth')
export class AuthV2Controller {
  constructor(
    private readonly checkMemberActiveUseCase: CheckMemberActiveUseCase,
    private readonly getAuthenticatedMemberQuery: GetAuthenticatedMemberQueryHandler,
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

  @ApiBearerAuth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener el perfil del socio autenticado',
    description:
      'Retorna el perfil completo del socio autenticado a partir del token Bearer de Firebase.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil completo del socio autenticado',
    type: MemberResponseHttpDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Token de autenticación no válido, faltante o socio no activo',
  })
  async getMe(
    @CurrentUser() currentUser?: AuthenticatedUserDto,
  ): Promise<MemberResponseHttpDto> {
    if (!currentUser?.email) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    try {
      const member = await this.getAuthenticatedMemberQuery.execute({
        email: currentUser.email,
      });

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
        identification_number: member.identificationNumber,
        phone: member.phone,
        address: member.address,
        beneficiary: member.beneficiary,
        registration_date: member.registrationDate,
        created_at: member.createdAt,
      };
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Socio no autorizado',
      );
    }
  }
}
