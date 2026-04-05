import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { NotFoundError } from '@domain/errors/not-found.error';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

/**
 * Global Exception Filter
 *
 * Catches all exceptions and maps domain errors to appropriate HTTP status codes.
 * This filter ensures that domain errors are properly translated to HTTP responses
 * without coupling the domain or application layers to NestJS.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle NestJS HTTP exceptions (for backward compatibility)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        message =
          typeof responseObj.message === 'string'
            ? responseObj.message
            : Array.isArray(responseObj.message)
              ? responseObj.message.join(', ')
              : responseObj.error || exception.message;
      }
    }
    // Handle domain errors
    else if (exception instanceof NotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else if (exception instanceof BusinessRuleError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (exception instanceof InvalidRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    }
    // Handle generic Error instances
    else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
      message = 'Internal server error'; // Don't expose internal details
      // Default to 500 for unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    // Handle non-Error exceptions (strings, etc.)
    else {
      this.logger.error(
        `Unhandled exception of unknown type: ${String(exception)}`,
      );
      message = 'Internal server error'; // Don't expose internal details
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
