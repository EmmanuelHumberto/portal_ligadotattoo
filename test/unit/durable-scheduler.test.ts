import {describe,expect,it} from 'vitest';
import {
 scheduleSeconds,workerRetentionDays,workerSchedulerIntervalMs,
} from '../../apps/worker/src/durable-scheduler';

describe('durable scheduler',()=>{
 it('maps the supported crawl frequencies',()=>{
  expect(['5m','15m','1h','6h','24h'].map(scheduleSeconds))
   .toEqual([300,900,3600,21600,86400]);
 });

 it('rejects unsupported frequencies',()=>{
  expect(()=>scheduleSeconds('1m')).toThrow('Unsupported schedule_key');
  expect(()=>scheduleSeconds('daily')).toThrow('Unsupported schedule_key');
 });

 it('bounds completed job retention',()=>{
  expect(workerRetentionDays(undefined)).toBe(7);
  expect(workerRetentionDays('30')).toBe(30);
  expect(()=>workerRetentionDays('0')).toThrow('WORKER_JOB_RETENTION_DAYS');
  expect(()=>workerRetentionDays('91')).toThrow('WORKER_JOB_RETENTION_DAYS');
 });

 it('bounds the scheduler polling interval',()=>{
  expect(workerSchedulerIntervalMs(undefined)).toBe(30000);
  expect(workerSchedulerIntervalMs('1000')).toBe(1000);
  expect(()=>workerSchedulerIntervalMs('999')).toThrow('WORKER_SCHEDULER_INTERVAL_MS');
  expect(()=>workerSchedulerIntervalMs('300001')).toThrow('WORKER_SCHEDULER_INTERVAL_MS');
 });
});
