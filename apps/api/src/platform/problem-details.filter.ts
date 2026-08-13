import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const code = exception instanceof Error && exception.name
      ? exception.name.toUpperCase()
      : 'INTERNAL_ERROR';

    response.status(status).type('application/problem+json').send({
      type: `urn:portal-tattoo:error:${code.toLowerCase()}`,
      title: status === 500 ? 'Internal Server Error' : 'Request failed',
      status,
      code,
      correlationId: randomUUID(),
      detail: status === 500 ? undefined : (exception as Error)?.message,
    });
  }
}
