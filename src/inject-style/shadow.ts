export interface StyleSource {
  source: string
  media?: string
  moduleName?: string
  module?: { [key: string]: string }
  map?: any
}

export default function createInjector(context: any, shadowRoot: ShadowRoot) {
  return (id: string, style: StyleSource) => addStyle(style, shadowRoot)
}

export interface StyleElementContent {
  ids: Set<string>
  styles: string[]
  element?: HTMLStyleElement
}

function createStyleElement(shadowRoot: ShadowRoot) {
  var styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  shadowRoot.appendChild(styleElement)

  return styleElement
}

function addStyle(css: StyleSource, shadowRoot: ShadowRoot) {
  const styleElement = createStyleElement(shadowRoot)
  if (css.media) styleElement.setAttribute('media', css.media)

  if ('styleSheet' in styleElement) {
    ;(styleElement as any).styleSheet.cssText = css.source
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild)
    }
    styleElement.appendChild(document.createTextNode(css.source))
  }
}
