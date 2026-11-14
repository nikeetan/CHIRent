import { execFileSync } from 'node:child_process';
const run = (command, args) => execFileSync(command, args, { stdio: 'inherit' });
const changes = execFileSync('git', ['status', '--porcelain', '--', 'public'], { encoding: 'utf8' }).trim();
if (changes) {
  console.error('Commit the public/ changes before publishing so the deployed assets match the source commit.');
  process.exit(1);
}
run('npm', ['test']);
run('npm', ['run', 'build']);
// The production build copies public/ unchanged. Split its committed history into
// a static publishing branch. A normal push preserves history and rejects conflicts.
const sha = execFileSync('git', ['subtree', 'split', '--prefix=public', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
run('git', ['push', 'origin', `${sha}:refs/heads/gh-pages`]);
console.log('Published static source to gh-pages. GitHub Pages builds and serves that branch.');
