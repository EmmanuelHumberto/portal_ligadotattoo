import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest();
    const response = host.switchToHttp().getResponse();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : domainStatus(exception);

    const exceptionResponse=exception instanceof HttpException
      ? exception.getResponse():null;
    const payload=exceptionResponse&&typeof exceptionResponse==='object'
      ? exceptionResponse as Record<string,unknown>:null;
    const code=typeof payload?.code==='string'
      ? payload.code
      : exception instanceof Error&&exception.name
        ? exception.name.replace(/([a-z])([A-Z])/g,'$1_$2').toUpperCase()
        : 'INTERNAL_ERROR';
    const detail=status===500?undefined
      : typeof exceptionResponse==='string'?exceptionResponse
        : typeof payload?.message==='string'?payload.message
          : Array.isArray(payload?.message)?payload.message.join('; ')
            : exception instanceof Error?exception.message:undefined;
    const suppliedId=String(request.headers?.['x-request-id']??'');
    const correlationId=/^[A-Za-z0-9._:-]{1,100}$/.test(suppliedId)
      ? suppliedId:randomUUID();

    response.setHeader('X-Correlation-Id',correlationId);
    response.status(status).type('application/problem+json').send({
      type: `urn:portal-tattoo:error:${code.toLowerCase()}`,
      title: HttpStatus[status] ?? (status===500?'Internal Server Error':'Request failed'),
      status,
      code,
      correlationId,
      detail,
    });
  }
}

function domainStatus(exception:unknown):number{
  if(!(exception instanceof Error))return HttpStatus.INTERNAL_SERVER_ERROR;
  if(exception.name==='NotFoundError')return HttpStatus.NOT_FOUND;
  if(exception.name==='ConcurrentModificationError')return HttpStatus.CONFLICT;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}
