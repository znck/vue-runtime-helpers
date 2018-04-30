interface Env {
  [key: string]: string | undefined
}

declare var process: { env: Env }
declare var __VUE_SSR_CONTEXT__: any

