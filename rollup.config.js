import typescript from 'rollup-plugin-typescript2'
import babel from 'rollup-plugin-babel'

function config(filename) {
  return [
    {
      input: `src/${filename}`,
      plugins: [
        typescript({ typescript: require('typescript') }),
        babel({ presets: ['@babel/env'], extensions: ['.ts'] })
      ],
      output: [
        {
          file: `dist/${filename.replace(/\.ts$/, '.js')}`,
          format: 'cjs',
          sourcemap: true
        }
      ]
    },
    {
      input: `src/${filename}`,
      plugins: [
        typescript({ typescript: require('typescript') })
      ],
      output: [
        {
          file: `dist/${filename.replace(/\.ts$/, '.mjs')}`,
          format: 'es',
          sourcemap: true
        }
      ]
    }
  ]
}

export default [
  config('index.ts'),
  config('normalize-component.ts'),
  config('inject-style/browser.ts'),
  config('inject-style/server.ts'),
].flat(1)
