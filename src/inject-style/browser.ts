export interface StyleSource {
  source: string
  media?: string
  moduleName?: string
  module?: { [key: string]: string }
  map?: any
}


let isOldIE: boolean | undefined

export default function createInjector(context: any) {
  return (id: string, style: StyleSource) => addStyle(id, style)
}

export interface StyleElementContent {
  ids: Set<string>
  styles: string[]
  element?: HTMLStyleElement
}

let HEAD: HTMLElement | undefined
const styles: { [key: string]: StyleElementContent } = {}
function addStyle(id: string, css: StyleSource) {
  if (isOldIE === undefined) {
    isOldIE =
        typeof navigator !== 'undefined' &&
        /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase())
  }

  const group = isOldIE ? css.media || 'default' : id
  const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] })

  if (!style.ids.has(id)) {
    style.ids.add(id)
    let code = css.source
    if (css.map) {
      // https://developer.chrome.com/devtools/docs/javascript-debugging
      // this makes source maps inside style tags work properly in Chrome
      code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'
      // http://stackoverflow.com/a/26603875
      code +=
        '\n/*# sourceMappingURL=data:application/json;base64,' +
        btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
        ' */'
    }

    if (!style.element) {
      style.element = document.createElement('style')
      style.element.type = 'text/css'
      if (css.media) style.element.setAttribute('media', css.media)
      if (HEAD === undefined) {
        HEAD = document.head || document.getElementsByTagName('head')[0]
      }
      HEAD.appendChild(style.element)
    }

    if ('styleSheet' in style.element) {
      style.styles.push(code)
      ;(<any>style.element).styleSheet.cssText = style.styles
        .filter(Boolean)
        .join('\n')
    } else {
      const index = style.ids.size - 1
      const textNode = document.createTextNode(code)
      const nodes = style.element.childNodes
      if (nodes[index]) style.element.removeChild(nodes[index])
      if (nodes.length) style.element.insertBefore(textNode, nodes[index])
      else style.element.appendChild(textNode)
    }
  }
}
