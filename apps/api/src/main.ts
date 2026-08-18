import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {validateRuntimeConfig} from './platform/runtime-config';
import {configureHttpSecurity} from './security/http-security';
import {ProblemDetailsFilter} from './platform/problem-details.filter';

async function main(){
 const cfg=validateRuntimeConfig(process.env);
 const app=await NestFactory.create(AppModule);
 app.useGlobalFilters(new ProblemDetailsFilter());
 configureHttpSecurity(app,cfg.allowedBrowserOrigins,cfg.trustProxyHops);
 app.enableShutdownHooks();
 await app.listen(cfg.port,'0.0.0.0');
}
main();
