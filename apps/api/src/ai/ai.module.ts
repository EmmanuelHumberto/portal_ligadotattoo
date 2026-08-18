import { Global,Module } from '@nestjs/common';
import { AI_PROVIDER_HUB } from './provider-hub.port';
import { AI_ADAPTERS,AIProviderHubService } from './provider-hub.service';
import { AIRegistryRepository } from './ai-registry.repository';
import {
  EnvironmentSecretResolver,SECRET_RESOLVER,
} from './secret-resolver';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { DeepSeekAdapter } from './adapters/deepseek.adapter';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { AIAdminController } from './ai-admin.controller';
import {AIExecutionLedgerRepository} from './ai-execution-ledger.repository';

@Global()
@Module({
  controllers:[AIAdminController],
  providers:[
    AIRegistryRepository,
    AIExecutionLedgerRepository,
    OpenAIAdapter,AnthropicAdapter,DeepSeekAdapter,OllamaAdapter,
    {provide:SECRET_RESOLVER,useClass:EnvironmentSecretResolver},
    {
      provide:AI_ADAPTERS,
      inject:[OpenAIAdapter,AnthropicAdapter,DeepSeekAdapter,OllamaAdapter],
      useFactory:(...adapters:any[])=>adapters,
    },
    AIProviderHubService,
    {provide:AI_PROVIDER_HUB,useExisting:AIProviderHubService},
  ],
  exports:[AI_PROVIDER_HUB],
})
export class AIModule {}
