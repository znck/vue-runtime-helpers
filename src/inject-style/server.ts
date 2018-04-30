import { StyleSource, hasProperty } from './base'

interface StyleElementContent {
  media?: string
  ids: Set<string>
  parts: string[]
}

interface StyleElements {
  [key: string]: StyleElementContent
}

interface SSRContext {
  styles: StyleElements
  _styles: StyleElements
  _renderStyles: (styles: StyleElements) => string
}

export default function createInjector(context: any) {
  if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
    context = __VUE_SSR_CONTEXT__
  }

  if (!context) return () => {}

  if (!hasProperty(context, 'styles')) {
    Object.defineProperty(context, 'styles', {
      enumerable: true,
      get: () => context._styles
    })
    context._renderStyles = renderStyles
  }

  return (id: string, style: StyleSource) => addStyle(id, style, context)
}

function addStyle(id: string, css: StyleSource, context: SSRContext) {
  const group: string =
    process.env.NODE_ENV === 'production' ? css.media || 'default' : id

  const style = context._styles[group]

  if (!style.ids.has(id)) {
    style.media = css.media
    style.ids.add(id)
    let code = css.source
    if (process.env.NODE_ENV !== 'production' && css.map) {
      // https://developer.chrome.com/devtools/docs/javascript-debugging
      // this makes source maps inside style tags work properly in Chrome
      code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'
      // http://stackoverflow.com/a/26603875
      code +=
        '\n/*# sourceMappingURL=data:application/json;base64,' +
        btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
        ' */'
    }
    style.parts.push(code)
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
      style.parts.join('\n') +
      '</style>'
  }

  return css
}
