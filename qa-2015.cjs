const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const args = process.argv.slice(2);
assert(!args.some(arg=>arg==='--year'||arg.startsWith('--year=')), 'qa-2015.cjs always checks 2015');
execFileSync(process.execPath, ['qa-2016-2017.cjs','--year','2015',...args], {cwd:__dirname,stdio:'inherit'});
