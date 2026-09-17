import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  details: unknown;
};

type HasZodError = {
  getZodError(): { issues: unknown };
};

function hasZodError(exception: unknown): exception is HasZodError {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    'getZodError' in exception
  );
}

const INTERNAL_ERROR: ApiErrorBody = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
  details: {},
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const body = this.toBody(exception);
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (hasZodError(exception)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: exception.getZodError().issues,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (
        typeof res === 'object' &&
        res !== null &&
        'code' in res &&
        'message' in res
      ) {
        return res as unknown as ApiErrorBody;
      }

      return {
        statusCode,
        code: 'HTTP_ERROR',
        message: typeof res === 'string' ? res : JSON.stringify(res),
        details: typeof res === 'object' ? res : {},
      };
    }

    return INTERNAL_ERROR;
  }
}
