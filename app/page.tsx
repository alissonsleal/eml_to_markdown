'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { parseEmlToMarkdown } from '@/lib/eml-parser'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { Download, Github, RotateCcw, Twitter, Upload } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface ConvertedFile {
  name: string
  content: string
  originalName: string
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([])
  const [shouldMergeFiles, setShouldMergeFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (files.length === 0) return

      setIsProcessing(true)
      setConvertedFiles([])

      try {
        const converted: ConvertedFile[] = []

        for (const file of files) {
          if (file.name.toLowerCase().endsWith('.eml')) {
            const fileContent = await file.text()
            const markdown = parseEmlToMarkdown(fileContent, file.name)

            converted.push({
              name: file.name.replace(/\.eml$/i, '.md'),
              content: markdown,
              originalName: file.name,
            })
          }
        }

        setConvertedFiles(converted)
      } catch (error) {
        console.error('Error processing files:', error)
        alert('Error processing files. Please check the console for details.')
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const downloadSingle = useCallback((file: ConvertedFile) => {
    const blob = new Blob([file.content], { type: 'text/markdown' })
    saveAs(blob, file.name)
  }, [])

  const downloadAll = useCallback(async () => {
    if (convertedFiles.length === 0) return

    if (shouldMergeFiles) {
      const mergedContent = convertedFiles
        .map((file) => `# ${file.originalName}\n\n${file.content}\n\n---\n\n`)
        .join('')

      const blob = new Blob([mergedContent], { type: 'text/markdown' })
      saveAs(blob, 'merged-emails.md')
    } else {
      const zip = new JSZip()

      convertedFiles.forEach((file) => {
        zip.file(file.name, file.content)
      })

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'converted-emails.zip')
    }
  }, [convertedFiles, shouldMergeFiles])

  const resetFiles = useCallback(() => {
    setConvertedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const hasConvertedFiles = convertedFiles.length > 0

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-muted/50 p-4'>
      <div className='max-w-4xl mx-auto py-8'>
        <div className='flex items-center justify-between mb-8'>
          <div className='text-center flex-1'>
            <h1 className='text-4xl font-bold mb-4'>
              EML to Markdown Converter
            </h1>
            <p className='text-lg text-muted-foreground'>
              Convert your email files (.eml) to Markdown format - All
              processing happens in your browser
            </p>
          </div>
          <div className='ml-4'>
            <ThemeToggle />
          </div>
        </div>

        <Card className='mb-6 border-2'>
          <CardContent className='p-6'>
            <div className='border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/40 transition-colors'>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept='.eml'
                onChange={handleFileUpload}
                className='hidden'
                id='file-upload'
                disabled={isProcessing}
              />

              <label
                htmlFor='file-upload'
                className={`cursor-pointer ${
                  isProcessing ? 'opacity-50' : 'hover:bg-muted/50'
                } inline-flex flex-col items-center justify-center w-full transition-colors rounded-lg p-4`}
              >
                <Upload className='w-12 h-12 text-muted-foreground mb-4' />
                <p className='text-lg font-medium mb-2'>
                  {isProcessing
                    ? 'Processing files...'
                    : 'Click to upload EML files'}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Select multiple .eml files to convert to Markdown
                </p>
              </label>
            </div>

            <div className='mt-4 flex items-center justify-center'>
              <label className='flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer'>
                <input
                  type='checkbox'
                  checked={shouldMergeFiles}
                  onChange={(e) => setShouldMergeFiles(e.target.checked)}
                  className='rounded border-input accent-primary'
                />
                <span>Merge all files into a single Markdown file</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {hasConvertedFiles && (
          <Card className='border-2'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>
                    Converted Files ({convertedFiles.length})
                  </CardTitle>
                  <CardDescription>Ready to download</CardDescription>
                </div>
                <div className='space-x-2'>
                  <Button onClick={downloadAll} className='gap-2'>
                    <Download className='w-4 h-4' />
                    {shouldMergeFiles
                      ? 'Download Merged File'
                      : 'Download All (ZIP)'}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={resetFiles}
                    className='gap-2'
                  >
                    <RotateCcw className='w-4 h-4' />
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3 max-h-96 overflow-y-auto'>
                {convertedFiles.map((file, index) => (
                  <div
                    key={`${file.originalName}-${index}`}
                    className='flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>
                        {file.name}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Original: {file.originalName}
                      </p>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => downloadSingle(file)}
                      className='ml-4 gap-2'
                    >
                      <Download className='w-3 h-3' />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isProcessing && (
          <div className='fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='border-2'>
              <CardContent className='p-6 flex items-center space-x-4'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                <span>Processing EML files...</span>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className='mt-8 bg-primary/5 border-primary/20'>
          <CardHeader>
            <CardTitle className='text-primary'>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='text-sm space-y-1 text-muted-foreground'>
              <li>
                • All processing happens in your browser - no files are uploaded
                to any server
              </li>
              <li>
                • Extracts email headers, body content, and attachments
                information
              </li>
              <li>• Converts HTML content to readable Markdown format</li>
              <li>
                • Option to merge multiple emails into a single file or download
                separately
              </li>
              <li>
                • Preserves email metadata like sender, recipient, date, and
                subject
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer with social links */}
        <footer className='mt-12 pt-8 border-t border-border/50'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
            <div className='text-sm text-muted-foreground'>
              Built with ❤️ using Next.js, TypeScript & Shadcn UI
            </div>
            <div className='flex items-center gap-3'>
              <Button
                variant='ghost'
                size='sm'
                className='gap-2 text-muted-foreground hover:text-foreground'
                asChild
              >
                <a
                  href='https://github.com/alissonsleal/eml_to_markdown'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='View source on GitHub'
                >
                  <Github className='w-4 h-4' />
                  Star on GitHub
                </a>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='gap-2 text-muted-foreground hover:text-foreground'
                asChild
              >
                <a
                  href='https://twitter.com/alissonsleal'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Follow on Twitter'
                >
                  <Twitter className='w-4 h-4' />
                  Follow @alissonsleal
                </a>
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
