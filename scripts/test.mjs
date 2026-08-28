import { spawnSync } from 'node:child_process';

const playwrightArgs = process.argv.slice(2);

for (const [command, args] of [
  ['cargo', ['fmt', '--check']],
  ['cargo', ['test', '--locked']],
  ['cargo', ['build', '--locked']],
  ['npm', ['run', 'build:site']],
  ['npx', ['playwright', 'test', ...playwrightArgs]]
]) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
