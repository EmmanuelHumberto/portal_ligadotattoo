import {loadEnvFile} from 'node:process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const scriptDirectory=dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(scriptDirectory,'../.env'));

// The Next CLI reads arguments after argv[1]. Keep its expected executable
// placeholder while avoiding --env-file in execArgv/NODE_OPTIONS.
process.argv=[process.argv[0],'next',...process.argv.slice(2)];
await import('../node_modules/next/dist/bin/next');
