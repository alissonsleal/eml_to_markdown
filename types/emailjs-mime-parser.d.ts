declare module 'emailjs-mime-parser' {
  interface ContentType {
    value: string
    params?: Record<string, string>
  }

  interface Disposition {
    value: string
    params?: Record<string, string>
  }

  interface ParsedNode {
    headers: Map<string, string | string[]>
    contentType?: ContentType
    disposition?: Disposition
    content?: string | Uint8Array
    childNodes?: ParsedNode[]
  }

  class MimeParser {
    parse(input: string | Uint8Array): ParsedNode
  }

  export default MimeParser
}
