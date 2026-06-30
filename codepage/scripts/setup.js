const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const steps = [
  { cmd: 'npm install', cwd: path.join(root, 'server') },
  { cmd: 'npx prisma generate', cwd: path.join(root, 'server') },
  { cmd: 'npx prisma migrate deploy', cwd: path.join(root, 'server') },
  { cmd: 'npm install', cwd: path.join(root, 'client') },
];

for (const { cmd, cwd } of steps) {
  console.log(`\n> ${cmd} (in ${path.relative(root, cwd)})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}
