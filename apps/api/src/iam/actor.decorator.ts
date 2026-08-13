import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const Actor = createParamDecorator((_data, ctx: ExecutionContext) =>
  ctx.switchToHttp().getRequest().actor
);
