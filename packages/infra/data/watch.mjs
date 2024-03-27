import * as esbuild from 'esbuild'

const entryPoints = [
  './src/modules/stream/lambda-streams-to-firehose/handler.js',
]

// ref: https://middy.js.org/docs/best-practices/bundling/#esbuild
// ref: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build-typescript.html
let ctx = await esbuild.context({
  entryPoints,
  bundle: true,
  write: true,
  outdir: '.build',
  target: 'node20',
  sourcemap: true,
  format: 'esm',
  minify: false,
  platform: 'node',
  // --banner:js hack from https://github.com/evanw/esbuild/pull/2067
  banner: {
    js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
  },
})

await ctx.watch()
console.log('esbuild watching...')