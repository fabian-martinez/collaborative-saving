/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  ValidationPipe,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { UpdateMemberHttpDto } from './update-member-http.dto';

describe('UpdateMemberHttpDto', () => {
  it('should validate successfully when identification_number is a valid string', async () => {
    // Arrange
    const plain = {
      identification_number: '123456789',
    };
    const dto = plainToInstance(UpdateMemberHttpDto, plain);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should validate successfully when identification_number is omitted (optional)', async () => {
    // Arrange
    const plain = {
      name: 'Jane Doe',
    };
    const dto = plainToInstance(UpdateMemberHttpDto, plain);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when identification_number is not a string', async () => {
    // Arrange
    const plain = {
      identification_number: 123456789 as unknown as string,
    };
    const dto = plainToInstance(UpdateMemberHttpDto, plain);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('identification_number');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  describe('with ValidationPipe (whitelist and forbidNonWhitelisted)', () => {
    let pipe: ValidationPipe;
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: UpdateMemberHttpDto,
    };

    beforeEach(() => {
      pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
    });

    it('should pass and retain identification_number', async () => {
      // Arrange
      const payload = {
        name: 'Carlos Ruiz',
        email: 'carlos@example.com',
        identification_number: '987654321',
        role: 'member',
        phone: '+573001234567',
        address: 'Calle 10 # 20-30',
        beneficiary: 'Ana Ruiz',
      };

      // Act
      const result = (await pipe.transform(
        payload,
        metadata,
      )) as UpdateMemberHttpDto;

      // Assert
      expect(result).toBeInstanceOf(UpdateMemberHttpDto);
      expect(result.identification_number).toBe('987654321');
      expect(result.name).toBe('Carlos Ruiz');
    });

    it('should throw BadRequestException when forbidden camelCase identificationNumber is sent', async () => {
      // Arrange
      const payload = {
        identificationNumber: '987654321',
      };

      // Act & Assert
      await expect(pipe.transform(payload, metadata)).rejects.toThrow(
        BadRequestException,
      );
      try {
        await pipe.transform(payload, metadata);
        fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(BadRequestException);
        if (error instanceof BadRequestException) {
          const response = error.getResponse() as { message: string[] };
          expect(response.message).toEqual(
            expect.arrayContaining([
              'property identificationNumber should not exist',
            ]),
          );
        }
      }
    });

    it('should accept payload with only identification_number', async () => {
      // Arrange
      const payload = {
        identification_number: '123456',
      };

      // Act
      const result = (await pipe.transform(
        payload,
        metadata,
      )) as UpdateMemberHttpDto;

      // Assert
      expect(result.identification_number).toBe('123456');
    });
  });
});
