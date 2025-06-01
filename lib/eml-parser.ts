import * as iconv from 'iconv-lite'

interface EmailData {
  headers: Record<string, string>
  subject: string
  from: string
  to: string
  date: string
  body: string
  attachments: Array<{
    filename: string
    contentType: string
    size: number
  }>
}

interface MimePart {
  headers: Record<string, string>
  body: string
  contentType?: string
  encoding?: string
  boundary?: string
  parts?: MimePart[]
}

function decodeQuotedPrintable(input: string, charset = 'utf-8'): string {
  const withoutSoftBreaks = input.replace(/=\r?\n/g, '')

  const bytes: number[] = []
  let i = 0

  while (i < withoutSoftBreaks.length) {
    if (withoutSoftBreaks[i] === '=' && i + 2 < withoutSoftBreaks.length) {
      const hex = withoutSoftBreaks.substr(i + 1, 2)
      if (/^[0-9A-F]{2}$/i.test(hex)) {
        bytes.push(parseInt(hex, 16))
        i += 3
      } else {
        bytes.push(withoutSoftBreaks.charCodeAt(i))
        i++
      }
    } else {
      bytes.push(withoutSoftBreaks.charCodeAt(i))
      i++
    }
  }

  const buffer = Buffer.from(bytes)
  return iconv.decode(buffer, charset)
}

function decodeBase64(input: string, charset = 'utf-8'): string {
  try {
    const buffer = Buffer.from(input, 'base64')
    return iconv.decode(buffer, charset)
  } catch {
    return input
  }
}

function decodeHeaderValue(headerValue: string): string {
  // Decode RFC 2047 encoded headers like =?UTF-8?Q?encoded_text?=
  return headerValue.replace(
    /=\?([^?]+)\?([QqBb])\?([^?]*)\?=/g,
    (match, charset, encoding, encoded) => {
      try {
        if (encoding.toUpperCase() === 'Q') {
          // Quoted-printable with underscore as space
          const withSpaces = encoded.replace(/_/g, ' ')
          return decodeQuotedPrintable(withSpaces, charset)
        } else if (encoding.toUpperCase() === 'B') {
          // Base64
          return decodeBase64(encoded, charset)
        }
      } catch {
        return match
      }
      return match
    }
  )
}

function detectAndDecodeText(
  text: string,
  contentType?: string,
  encoding?: string
): string {
  if (!text) return ''

  const charsetMatch = contentType?.match(/charset=["']?([^;"'\s]+)/i)
  const charset = charsetMatch?.[1]?.toLowerCase() || 'utf-8'

  switch (encoding?.toLowerCase()) {
    case 'quoted-printable':
      return decodeQuotedPrintable(text, charset)
    case 'base64':
      return decodeBase64(text, charset)
    default:
      if (charset !== 'utf-8' && iconv.encodingExists(charset)) {
        try {
          const buffer = Buffer.from(text, 'binary')
          return iconv.decode(buffer, charset)
        } catch {
          return text
        }
      }
      return text
  }
}

function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') return ''

  return (
    html
      // Remove doctype and html structure tags
      .replace(/<!doctype[^>]*>/gi, '')
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<\/?head[^>]*>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '')
      .replace(/<title[^>]*>.*?<\/title>/gis, '')
      .replace(/<meta[^>]*>/gi, '')

      // Remove script and style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

      // Convert headers
      .replace(
        /<h([1-6])[^>]*>(.*?)<\/h\1>/gi,
        (_, level, content) =>
          '\n' + '#'.repeat(parseInt(level)) + ' ' + content.trim() + '\n\n'
      )

      // Convert tables with proper spacing
      .replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
        const rows: string[] =
          tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || []
        let markdownTable = '\n\n'

        rows.forEach((row, index) => {
          const cells = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || []
          const cellContents = cells.map((cell) =>
            cell
              .replace(/<[^>]*>/g, '')
              .replace(/\s+/g, ' ')
              .trim()
          )

          if (cellContents.length > 0) {
            markdownTable += '| ' + cellContents.join(' | ') + ' |\n'

            if (index === 0) {
              markdownTable +=
                '| ' + cellContents.map(() => '---').join(' | ') + ' |\n'
            }
          }
        })

        return markdownTable + '\n\n'
      })

      // Convert emphasis
      .replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**')
      .replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '_$2_')

      // Convert links
      .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')

      // Convert images
      .replace(
        /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi,
        '![$2]($1)'
      )
      .replace(/<img[^>]*src=["']([^"']*)["'][^>]*\/?>/gi, '![]($1)')

      // Convert preformatted text
      .replace(/<pre[^>]*>(.*?)<\/pre>/gis, (_, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim()
        return '\n\n```\n' + cleanContent + '\n```\n\n'
      })

      // Convert divs to line breaks
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '\n')

      // Convert paragraphs and line breaks
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')

      // Convert lists
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')

      // Convert blockquotes
      .replace(
        /<blockquote[^>]*>(.*?)<\/blockquote>/gis,
        (_, content) =>
          '\n' +
          content
            .split('\n')
            .map((line: string) => `> ${line.trim()}`)
            .join('\n') +
          '\n\n'
      )

      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, '')

      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')

      // Clean up whitespace
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim()
  )
}

function parseMimeHeaders(headerSection: string): Record<string, string> {
  const headers: Record<string, string> = {}
  const lines = headerSection.split(/\r?\n/)
  let currentHeader = ''

  for (const line of lines) {
    if (line.match(/^\s/) && currentHeader) {
      headers[currentHeader] += ' ' + line.trim()
    } else {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        currentHeader = line.substring(0, colonIndex).toLowerCase().trim()
        headers[currentHeader] = line.substring(colonIndex + 1).trim()
      }
    }
  }

  return headers
}

function parseMimePart(content: string): MimePart {
  const emptyLineIndex = content.indexOf('\n\n')
  if (emptyLineIndex === -1) {
    return { headers: {}, body: content }
  }

  const headerSection = content.substring(0, emptyLineIndex)
  const body = content.substring(emptyLineIndex + 2)
  const headers = parseMimeHeaders(headerSection)

  const contentType = headers['content-type']
  const encoding = headers['content-transfer-encoding']

  return {
    headers,
    body,
    contentType,
    encoding,
  }
}

function parseMultipartContent(content: string, boundary: string): MimePart[] {
  const parts: MimePart[] = []
  const boundaryPattern = new RegExp(
    `--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'g'
  )
  const sections = content.split(boundaryPattern)

  for (let i = 1; i < sections.length - 1; i++) {
    const section = sections[i].trim()
    if (section) {
      parts.push(parseMimePart(section))
    }
  }

  return parts
}

function extractBestContent(parts: MimePart[]): string {
  // Prioritize text/html over text/plain for better formatting
  const htmlPart = parts.find((part) => part.contentType?.includes('text/html'))
  const textPart = parts.find((part) =>
    part.contentType?.includes('text/plain')
  )

  if (htmlPart) {
    const decoded = detectAndDecodeText(
      htmlPart.body,
      htmlPart.contentType,
      htmlPart.encoding
    )
    return htmlToMarkdown(decoded)
  }

  if (textPart) {
    return detectAndDecodeText(
      textPart.body,
      textPart.contentType,
      textPart.encoding
    )
  }

  return ''
}

function parseEmlManually(emlContent: string): EmailData {
  const lines = emlContent.split(/\r?\n/)
  const headers: Record<string, string> = {}
  let bodyStartIndex = 0
  let currentHeader = ''

  // Parse headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.trim() === '') {
      bodyStartIndex = i + 1
      break
    }

    if ((line.startsWith(' ') || line.startsWith('\t')) && currentHeader) {
      headers[currentHeader] += ' ' + line.trim()
      continue
    }

    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      currentHeader = line.substring(0, colonIndex).toLowerCase().trim()
      headers[currentHeader] = line.substring(colonIndex + 1).trim()
    }
  }

  // Decode headers
  for (const [key, value] of Object.entries(headers)) {
    headers[key] = decodeHeaderValue(value)
  }

  // Extract body
  const bodyLines = lines.slice(bodyStartIndex)
  let body = bodyLines.join('\n').trim()

  const contentType = headers['content-type']
  const encoding = headers['content-transfer-encoding']

  // Handle multipart messages
  const boundaryMatch = contentType?.match(/boundary=["']?([^;"'\s]+)/i)
  if (boundaryMatch) {
    const boundary = boundaryMatch[1]
    const parts = parseMultipartContent(body, boundary)
    body = extractBestContent(parts)
  } else {
    // Single part message
    body = detectAndDecodeText(body, contentType, encoding)

    if (contentType?.includes('text/html')) {
      body = htmlToMarkdown(body)
    }
  }

  return {
    headers,
    subject: headers.subject || 'No Subject',
    from: headers.from || 'Unknown Sender',
    to: headers.to || 'Unknown Recipient',
    date: headers.date || 'Unknown Date',
    body: body || 'No message content found',
    attachments: [],
  }
}

function createMarkdownFromEmailData(
  emailData: EmailData,
  filename: string
): string {
  let markdown = `# ${emailData.subject}\n\n`
  markdown += `**From:** ${emailData.from}\n`
  markdown += `**To:** ${emailData.to}\n`
  markdown += `**Date:** ${emailData.date}\n`
  markdown += `**Original File:** ${filename}\n\n`
  markdown += '---\n\n'
  markdown += '## Message\n\n'
  markdown += emailData.body + '\n\n'

  if (emailData.attachments.length > 0) {
    markdown += '## Attachments\n\n'
    emailData.attachments.forEach((attachment) => {
      const sizeKB = Math.round(attachment.size / 1024)
      markdown += `- **${attachment.filename}** (${attachment.contentType}, ${sizeKB} KB)\n`
    })
    markdown += '\n'
  }

  return markdown
}

export function parseEmlToMarkdown(
  emlContent: string,
  filename: string
): string {
  try {
    // Validate input
    if (!emlContent || typeof emlContent !== 'string') {
      throw new Error('Invalid EML content')
    }

    const cleanedContent = emlContent.trim()
    if (cleanedContent.length === 0) {
      throw new Error('EML file is empty')
    }

    // Parse manually for better reliability
    const emailData = parseEmlManually(cleanedContent)
    return createMarkdownFromEmailData(emailData, filename)
  } catch (error) {
    console.error('Error parsing EML file:', error)
    throw new Error(
      `Failed to parse EML file "${filename}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}
