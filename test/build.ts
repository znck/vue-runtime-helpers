import * as fs from 'fs'
import * as path from 'path'
import * as vm from 'vm'
import { rollup } from 'rollup'
import promised from '@znck/promised'
import {
  createDefaultCompiler,
  assemble,
  SFCCompiler
} from '@vue/component-compiler'
import { ModuleFormat } from 'rollup';

const pluginNodeResolve = require('rollup-plugin-node-resolve')
const pluginCommonJS = require('rollup-plugin-commonjs')

export function pluginCreateVueApp(filename: string, component: string, exportFn: boolean = false): any {
  return {
    name: 'Inline',
    resolveId(id) {
      if (id === filename) return filename
    },
    load(id) {
      if (id === filename)
        return `
    import Component from '${component}'

    Vue.config.productionTip = false
    Vue.config.devtools = false

    export default new Vue({
      el: '#app',
      render (h) {
        return h(Component, { props: { who: 'World' } })
      }
    })
  `
    }
  }
}

function pluginVue(target: string): any {
  const compiler = createDefaultCompiler({
    template: {
      compiler: require('vue-template-compiler'),
      compilerOptions: {},
      optimizeSSR: target === 'server',
      isProduction: true
    }
  })

  return {
    transform(content, id) {
      if (!id.endsWith('.vue')) return

      const result = compiler.compileToDescriptor(id, content)

      return assemble(compiler, id, result, {
        normalizer: '~' + require.resolve('../dist/normalize-component'),
        styleInjector: '~' + require.resolve('../dist/inject-style/browser'),
        styleInjectorSSR: '~' + require.resolve('../dist/inject-style/server')
      })
    }
  }
}

const cache = {}

export async function build(
  filename: string,
  target: string = 'browser',
  format: ModuleFormat = 'iife'
): Promise<string> {
  const cacheKey = JSON.stringify({ filename })
  if (cacheKey in cache) return cache[cacheKey]

  const input = filename + '__app.js'
  const bundle = await rollup({
    input,
    plugins: [
      pluginCreateVueApp(input, filename, format !== 'iife'),
      pluginNodeResolve(),
      pluginCommonJS(),
      pluginVue(target)
    ],
    external: ['vue']
  })

  const result = await bundle.generate({
    format,
    name: 'App',
    globals: {
      vue: 'Vue'
    }
  })

  cache[cacheKey] = result.output[0].code

  return cache[cacheKey]
}

export async function buildForServer(filename: string) {
  // Step 1: Create a Vue instance
  const name = path.basename(filename).replace(/\.vue$/, '')
  const code =
    `const Vue = require('vue');` +
    (await build(filename, 'server', 'cjs')).replace(`'use strict';`, ``)

  if (!Boolean(process.env.CI)) {
    const dir = path.join(__dirname, './output')

    if (!(await promised(fs).exists(dir))) await promised(fs).mkdir(dir)
    await promised(fs).writeFile(path.join(dir, name + '-ssr.js'), code)
  }

  // Step 2: Create a renderer
  const renderer = require('vue-server-renderer').createBundleRenderer(code, {
    // runInNewContext: false,
    template: `
    <!DOCTYPE html>
    <html lang="en">
      <head><title>${name}</title></head>
      <body>
        <!--vue-ssr-outlet-->
      </body>
    </html>
  `
  })

  const context: any = {}

  return await renderer.renderToString(context)
}
