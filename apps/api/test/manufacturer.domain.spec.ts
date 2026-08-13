import { describe, expect, it } from 'vitest';
import { Manufacturer } from '../src/catalog/manufacturer.domain';

describe('Manufacturer', () => {
  it('creates a valid manufacturer', () => {
    const m = Manufacturer.create({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Example Machines',
      slug: 'example-machines',
      countryCode: 'br',
    });
    expect(m.name).toBe('Example Machines');
    expect(m.countryCode).toBe('BR');
    expect(m.version).toBe(1);
  });

  it('rejects invalid slug', () => {
    expect(() => Manufacturer.create({
      id: 'x', name: 'Example', slug: 'Invalid Slug',
    })).toThrow();
  });
});
