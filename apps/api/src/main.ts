import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {validateRuntimeConfig} from './platform/runtime-config';

async function main(){
 const cfg=validateRuntimeConfig(process.env);
 const app=await NestFactory.create(AppModule);
 app.enableShutdownHooks();
 await app.listen(cfg.port,'0.0.0.0');
}
main();
