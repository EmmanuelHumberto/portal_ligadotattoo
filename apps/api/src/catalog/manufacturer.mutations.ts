import type { Tx } from '../platform/transaction-manager';

export async function updateManufacturerStatus(
  tx: Tx, id: string, expectedVersion: number, status: 'ACTIVE'|'INACTIVE',
) {
  const r = await tx.query(
    `update catalog.manufacturer
        set status=$3, version=version+1, updated_at=now()
      where id=$1 and version=$2
      returning id,name,slug,official_website,country_code,status,version`,
    [id, expectedVersion, status],
  );
  if (!r.rowCount)
    throw Object.assign(new Error('Concurrent modification or manufacturer not found'), {
      name: 'ConcurrentModificationError',
    });
  return r.rows[0];
}
