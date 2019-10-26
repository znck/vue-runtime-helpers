export interface CompiledTemplate {
  render: Function
  staticRenderFns: Function[]
}

export default function normalizeComponent(
  template: CompiledTemplate | undefined,
  style: ((context: any) => void) | undefined,
  script: any,
  scopeId: string | undefined,
  isFunctionalTemplate: boolean,
  moduleIdentifier: string | undefined /* server only */,
  shadowMode: boolean,
  createInjector: any,
  createInjectorSSR: any,
  createInjectorShadow: any
) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector
    createInjector = shadowMode
    shadowMode = false
  }
  // Vue.extend constructor export interop.
  const options = typeof script === 'function' ? script.options : script

  // render functions
  if (template && template.render) {
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
    options._scopeId = scopeId
  }

  let hook: any
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
      // register component module identifier for async chunk inference
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (style) {
    hook = shadowMode
      ? function(context: any) {
        style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot))
      }
      : function(context: any) {
          style.call(this, createInjector(context))
        }
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      const originalRender = options.render
      options.render = function renderWithStyleInjection(h: any, context: any) {
        hook.call(context)
        return originalRender(h, context)
      }
    } else {
      // inject component registration as beforeCreate hook
      const existing = options.beforeCreate
      options.beforeCreate = existing ? [].concat(existing, hook as any) : [hook]
    }
  }

  return script
}
