import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { Response, Request } from 'express';
import { NotFoundError } from '@domain/errors/not-found.error';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockArgumentsHost: Partial<ArgumentsHost>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockSwitchToHttp: jest.Mock;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    mockRequest = {
      method: 'GET',
      url: '/test-url',
    };

    mockGetResponse = jest.fn().mockReturnValue(mockResponse);
    mockGetRequest = jest.fn().mockReturnValue(mockRequest);
    mockSwitchToHttp = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });
    mockArgumentsHost = {
      switchToHttp: mockSwitchToHttp,
    };

    const filterWithLogger = filter as unknown as { logger: Logger };
    warnSpy = jest.spyOn(filterWithLogger.logger, 'warn').mockImplementation();
    errorSpy = jest
      .spyOn(filterWithLogger.logger, 'error')
      .mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Domain Errors', () => {
    it('should log warn and return 404 for NotFoundError', () => {
      // Arrange
      const error = new NotFoundError('User', '123');

      // Act
      filter.catch(error, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User with ID 123 not found',
          path: '/test-url',
        }),
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[GET] /test-url - Status 404: User with ID 123 not found',
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should log warn and return 400 for BusinessRuleError', () => {
      // Arrange
      const error = new BusinessRuleError('Cannot cancel closed meeting');
      mockRequest.method = 'POST';
      mockRequest.url = '/meetings/1/cancel';

      // Act
      filter.catch(error, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Cannot cancel closed meeting',
          path: '/meetings/1/cancel',
        }),
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[POST] /meetings/1/cancel - Status 400: Cannot cancel closed meeting',
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should log warn and return 400 for InvalidRequestError', () => {
      // Arrange
      const error = new InvalidRequestError('Amount must be positive');
      mockRequest.method = 'POST';
      mockRequest.url = '/loans';

      // Act
      filter.catch(error, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Amount must be positive',
          path: '/loans',
        }),
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[POST] /loans - Status 400: Amount must be positive',
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('HttpException', () => {
    it('should log warn and return client error when status < 500 (string response)', () => {
      // Arrange
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      mockRequest.method = 'DELETE';
      mockRequest.url = '/members/1';

      // Act
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Forbidden',
          path: '/members/1',
        }),
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[DELETE] /members/1 - Status 403: Forbidden',
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should handle HttpException with object response and string message', () => {
      // Arrange
      const exception = new HttpException(
        { message: 'Invalid credentials' },
        HttpStatus.UNAUTHORIZED,
      );
      mockRequest.method = 'POST';
      mockRequest.url = '/auth/login';

      // Act
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid credentials',
          path: '/auth/login',
        }),
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[POST] /auth/login - Status 401: Invalid credentials',
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should handle HttpException with array of messages', () => {
      // Arrange
      const exception = new HttpException(
        { message: ['name is required', 'email must be valid'] },
        HttpStatus.BAD_REQUEST,
      );
      mockRequest.method = 'POST';
      mockRequest.url = '/members';

      // Act
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'name is required, email must be valid',
          path: '/members',
        }),
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[POST] /members - Status 400: name is required, email must be valid',
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should handle HttpException with error field when message is absent', () => {
      // Arrange
      const exception = new HttpException(
        { error: 'Bad Request Error' },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request Error',
          path: '/test-url',
        }),
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[GET] /test-url - Status 400: Bad Request Error',
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should handle HttpException with empty object response falling back to exception.message', () => {
      // Arrange
      const exception = new HttpException({}, HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: exception.message,
          path: '/test-url',
        }),
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        `[GET] /test-url - Status 400: ${exception.message}`,
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should log error with stack when HttpException has status >= 500', () => {
      // Arrange
      const exception = new HttpException(
        'Database connection failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      mockRequest.method = 'GET';
      mockRequest.url = '/reports';

      // Act
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database connection failed',
          path: '/reports',
        }),
      );
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        '[GET] /reports - Status 500: Database connection failed',
        exception.stack,
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Unhandled Errors and Unknown Exceptions', () => {
    it('should sanitize generic Error messages, log error with method, path and stack trace', () => {
      // Arrange
      const error = new Error('Sensitive database info');
      mockRequest.method = 'GET';
      mockRequest.url = '/test-url';

      // Act
      filter.catch(error, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          path: '/test-url',
        }),
      );
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        '[GET] /test-url - Unhandled error: Sensitive database info',
        error.stack,
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions and log error with method and path', () => {
      // Arrange
      const stringError = 'Unexpected string exception';
      mockRequest.method = 'POST';
      mockRequest.url = '/test-url';

      // Act
      filter.catch(stringError, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          path: '/test-url',
        }),
      );
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        '[POST] /test-url - Unhandled exception of unknown type: Unexpected string exception',
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should handle missing request method or url gracefully', () => {
      // Arrange
      mockGetRequest.mockReturnValue(undefined);
      const error = new Error('Something broke');

      // Act
      filter.catch(error, mockArgumentsHost as ArgumentsHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        '[UNKNOWN]  - Unhandled error: Something broke',
        error.stack,
      );
    });
  });
});
