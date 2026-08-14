import {describe,expect,it} from 'vitest';
import {classifyAdminStatus} from '../../apps/web/lib/admin-status';

describe('classifyAdminStatus',()=>{
  it('preserves known admin error statuses',()=>{
    expect(classifyAdminStatus(401)).toBe(401);
    expect(classifyAdminStatus(403)).toBe(403);
    expect(classifyAdminStatus(409)).toBe(409);
    expect(classifyAdminStatus(422)).toBe(422);
  });

  it('coalesces unexpected error statuses to 502',()=>{
    expect(classifyAdminStatus(400)).toBe(502);
    expect(classifyAdminStatus(404)).toBe(502);
    expect(classifyAdminStatus(500)).toBe(502);
    expect(classifyAdminStatus(503)).toBe(502);
  });
});
