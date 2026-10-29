const {execFileSync} = require('node:child_process');
for (const paper of [1, 2]) {
  execFileSync(process.execPath, [`verify-2015-paper${paper}.cjs`], {cwd:__dirname,stdio:'inherit'});
}
