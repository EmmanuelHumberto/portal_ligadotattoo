import { describe, expect, it, vi } from 'vitest';
import type { AiProvider } from '../../apps/api/src/ai/ai-provider.port';
import { AiProviderRegistry } from '../../apps/api/src/ai/provider-registry';
import { AiRouterService } from '../../apps/api/src/ai/ai-router.service';

const request = { workload: 'summary', prompt: 'Summarize this' };

function provider(key: string, execute: AiProvider['execute']): AiProvider {
  return { key, execute };
}

function result(providerKey: string) {
  return {
    provider: providerKey,
    model: 'test-model',
    text: 'ok',
    latencyMs: 1,
  };
}

describe('AiRouterService', () => {
  it('returns the primary provider result', async () => {
    const execute = vi.fn(async () => result('primary'));
    const registry = new AiProviderRegistry().register(provider('primary', execute));
    const router = new AiRouterService(registry, { primary: 'primary', fallback: [] });

    await expect(router.execute(request)).resolves.toEqual(result('primary'));
    expect(execute).toHaveBeenCalledOnce();
  });

  it('uses a fallback after the primary provider fails', async () => {
    const fallback = vi.fn(async () => result('fallback'));
    const registry = new AiProviderRegistry()
      .register(provider('primary', async () => { throw new Error('provider unavailable'); }))
      .register(provider('fallback', fallback));
    const router = new AiRouterService(registry, {
      primary: 'primary',
      fallback: ['fallback'],
    });

    await expect(router.execute(request)).resolves.toEqual(result('fallback'));
    expect(fallback).toHaveBeenCalledOnce();
  });

  it('deduplicates fallback providers and skips unconfigured providers', async () => {
    const execute = vi.fn(async () => result('available'));
    const registry = new AiProviderRegistry().register(provider('available', execute));
    const router = new AiRouterService(registry, {
      primary: 'missing',
      fallback: ['available', 'available', 'also-missing'],
    });

    await expect(router.execute(request)).resolves.toEqual(result('available'));
    expect(execute).toHaveBeenCalledOnce();
  });

  it('returns a deterministic error without leaking provider credentials', async () => {
    const secret = 'sk-secret-value';
    const registry = new AiProviderRegistry().register(
      provider('primary', async () => { throw new Error(`upstream rejected ${secret}`); }),
    );
    const router = new AiRouterService(registry, { primary: 'primary', fallback: [] });

    const error = await router.execute(request).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('AI_ALL_PROVIDERS_FAILED:primary');
    expect((error as Error).message).not.toContain(secret);
  });
});
