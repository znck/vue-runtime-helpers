import createInjector from '../inject-style/client'
import createInjectorSSR from '../inject-style/server'

export default function normalizeComponent(
  template: any,
  script: any,
  style: any,
  isFunctionalTemplate: boolean,
  scopeId: string | undefined,
  moduleIdentifier: string | undefined /* server only */
) {
  const options = typeof script === 'function' ? script.options : script

  // render functions
  if (!options.render) {
    options.render = template.render
    options.staticRenderFns = template.staticRenderFns
    options._compiled = true

    // functional template
    if (isFunctionalTemplate) {
      options.functional = true
    }
  }

  // scopedId
  if (scopeId) {
    options._scopeId = 'data-v-' + scopeId
  }

  let hook: undefined | ((context: any) => void) = undefined
  if (moduleIdentifier) {
    // server build
    hook = function(context: any) {
      // 2.3 injection
      context =
        context || // cached call
        (this.$vnode && this.$vnode.ssrContext) || // stateful
        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
      // 2.2 with runInNewContext: true
      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__
      }
      // inject component styles
      if (style) {
        style.call(this, createInjectorSSR(context))
      }
      // register component module identifier for async chunk inferrence
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (style) {
    hook = function(context: any) {
      style.call(createInjector(context))
    }
  }

  if (hook != undefined) {
    if (options.functional) {
      // register for functional component in vue file
      const originalRender = options.render
      options.render = function renderWithStyleInjection(h: any, context: any) {
        ;(<any>hook).call(context)
        return originalRender(h, context)
      }
    } else {
      // inject component registration as beforeCreate hook
      const existing = options.beforeCreate
      options.beforeCreate = existing ? [].concat(existing, <any>hook) : [hook]
    }
  }

  return {
    exports: script,
    options: options
  }
}
