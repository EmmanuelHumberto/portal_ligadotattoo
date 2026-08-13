import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC = 'portal:is-public';
export const Public = () => SetMetadata(IS_PUBLIC, true);
