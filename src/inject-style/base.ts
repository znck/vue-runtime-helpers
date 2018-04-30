export interface StyleSource {
  source: string
  media?: string
  moduleName?: string
  module?: { [key: string]: string }
  map?: any
}


export const hasProperty: (any: any, key: string) => boolean =
  Object.prototype.hasOwnProperty.call