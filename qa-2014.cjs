const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const args = process.argv.slice(2);
assert(!args.some(arg=>arg==='--year'||arg.startsWith('--year=')), 'qa-2014.cjs always checks 2014');
execFileSync(process.execPath, ['qa-2016-2017.cjs','--year','2014',...args], {cwd:__dirname,stdio:'inherit'});
