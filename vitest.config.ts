import {defineConfig} from 'vitest/config';

export default defineConfig({
  test:{
    // PostgreSQL integration suites share the same database and durable queues.
    fileParallelism:false,
  },
});
