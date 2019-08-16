export interface StyleSource {
  source: string
  media?: string
  moduleName?: string
  module?: { [key: string]: string }
  map?: any
}

interface StyleElementContent {
  media?: string
  ids: Array<string>
  css: string
}

interface StyleElements {
  [key: string]: StyleElementContent
}

interface SSRContext {
  styles: string
  _styles: StyleElements
  _renderStyles: (styles: StyleElements) => string
}

export default function createInjectorSSR(context: any) {
  if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
    context = __VUE_SSR_CONTEXT__
  }

  if (!context) return () => {}

  if (!('styles' in context)) {
    context._styles = context._styles || {}
    Object.defineProperty(context, 'styles', {
      enumerable: true,
      get: () => context._renderStyles(context._styles)
    })
    context._renderStyles = context._renderStyles || renderStyles
  }

  return (id: string, style: StyleSource) => addStyle(id, style, context)
}

function addStyle(id: string, css: StyleSource, context: SSRContext) {
  const group: string =
    process.env.NODE_ENV === 'production' ? css.media || 'default' : id

  const style = context._styles[group] || (context._styles[group] = { ids: [], css: '' })

  if (!style.ids.includes(id)) {
    style.media = css.media
    style.ids.push(id)
    let code = css.source
    if (process.env.NODE_ENV !== 'production' && css.map) {
      // https://developer.chrome.com/devtools/docs/javascript-debugging
      // this makes source maps inside style tags work properly in Chrome
      code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'
      // http://stackoverflow.com/a/26603875
      code +=
        '\n/*# sourceMappingURL=data:application/json;base64,' +
        Buffer.from(unescape(encodeURIComponent(JSON.stringify(css.map)))).toString('base64') +
        ' */'
    }
    style.css += code + '\n'
  }
}
function renderStyles(styles: StyleElements): string {
  let css = ''
  for (const key in styles) {
    const style = styles[key]
    css +=
      '<style data-vue-ssr-id="' +
      Array.from(style.ids).join(' ') +
      '"' +
      (style.media ? ' media="' + style.media + '"' : '') +
      '>' +
      style.css +
      '</style>'
  }

  return css
}
