const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

async function main() {
    const root = path.resolve(__dirname, '../..');
    const bundled = await esbuild.build({
        entryPoints:[path.join(root,'src/mod/class/hs-modules/hs-heater/hs-heater-optimizer-runner.ts')],
        bundle:true,write:false,platform:'node',format:'cjs',
        plugins:[{name:'heater-runner-boundary',setup(build){
            const stubs={
                'hs-heater-worker-source':'export default "test worker";',
                'hs-logger':`export const HSLogger={info(){},warn(){},error(){},debug(message){
                    if(globalThis.runnerTest.debug)globalThis.runnerTest.logs.push(typeof message==='function'?message():message)
                }};`,
                'hs-heater-optimizer':'export const HSHeaterOptimizer={};export const takeHeaterOptimizerLogs=()=>[];',
            };
            build.onResolve({filter:/hs-[\w-]+$/},args=>{
                const name=args.path.split('/').pop();if(stubs[name])return{path:name,namespace:'test'};
            });
            build.onLoad({filter:/.*/,namespace:'test'},args=>({contents:stubs[args.path],loader:'ts'}));
        }}],
    });
    const input={heaterOptions:{oct:true,ambOct:true,hyperflux:true},runeSiExp:1,runeIaExp:1,
        runeIaBonusLevelsTotal:0,runeIaBonusLevelsTalisman:0,baseTalismanPower:1};
    const original={Worker:global.Worker,runnerTest:global.runnerTest};
    try {
        global.Worker=class {
            postMessage({id,input}) {
                const result=Object.fromEntries(Object.keys(input.heaterOptions).filter(key=>input.heaterOptions[key]).map(key=>[key,[[key]]]));
                queueMicrotask(()=>this.onmessage({data:global.runnerTest.error
                    ?{id,ok:false,error:'real calculation failure',logs:[]}
                    :{id,ok:true,result,logs:[],...global.runnerTest.diagnostics}}));
            }
            terminate() {}
        };
        for(const debug of [true,false])for(const diagnostics of [{},{stages:[{name:'oct-search',elapsedMs:100}]}]) {
            global.runnerTest={debug,diagnostics,logs:[]};
            const runtime=new Module(path.join(root,'heater-runner-runtime.cjs'),module);
            runtime.filename=path.join(root,'heater-runner-runtime.cjs');runtime.paths=module.paths;
            runtime._compile(bundled.outputFiles[0].text,runtime.filename);
            const result=await runtime.exports.HSHeaterOptimizerRunner.createResult(input,undefined,true);
            for(const key of ['oct','ambOct','hyperflux'])assert.deepEqual(result[key],[[key]],'valid results survive missing stage times');
            assert.equal(global.runnerTest.logs.some(line=>line.includes('oct-search')),debug&&Boolean(diagnostics.stages));
        }
        global.runnerTest={debug:true,error:true,logs:[]};
        const runtime=new Module(path.join(root,'heater-error-runtime.cjs'),module);
        runtime.filename=path.join(root,'heater-error-runtime.cjs');runtime.paths=module.paths;
        runtime._compile(bundled.outputFiles[0].text,runtime.filename);
        await assert.rejects(runtime.exports.HSHeaterOptimizerRunner.createResult(input),/real calculation failure/);
        console.log('Passed Heater runner checks: missing/current diagnostics, debug on/off, parallel results, and real failures.');
    } finally {
        for(const [key,value]of Object.entries(original)){if(value===undefined)delete global[key];else global[key]=value}
    }
}
main().catch(error=>{console.error(error);process.exitCode=1});
