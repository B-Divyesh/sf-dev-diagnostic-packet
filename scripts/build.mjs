import { cpSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('cargo', ['build', '--release', '--locked']);
run('npm', ['run', 'build:site']);
mkdirSync('dist', { recursive: true });
cpSync('target/release/diagnostic-packet', 'dist/diagnostic-packet');
console.log('Built dist/diagnostic-packet and dist/site/.');
