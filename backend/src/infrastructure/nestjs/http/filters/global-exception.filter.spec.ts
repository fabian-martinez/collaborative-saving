import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { Response, Request } from 'express';
import { NotFoundError } from '@domain/errors/not-found.error';

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

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    } as unknown as Response;
    mockRequest = {
      url: '/test-url',
    } as unknown as Request;

    mockGetResponse = jest.fn().mockReturnValue(mockResponse);
    mockGetRequest = jest.fn().mockReturnValue(mockRequest);
    mockSwitchToHttp = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });
    mockArgumentsHost = {
      switchToHttp: mockSwitchToHttp,
    };
  });

  it('should sanitize generic Error messages', () => {
    const error = new Error('Sensitive database info');
    filter.catch(error, mockArgumentsHost as ArgumentsHost);

    // This assertion expects the fix to be implemented.
    // Before the fix, this test will fail because it will be called with 'Sensitive database info'.
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });

  it('should pass through domain errors like NotFoundError', () => {
    const error = new NotFoundError('User', '123');
    filter.catch(error, mockArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User with ID 123 not found',
      }),
    );
  });
});
