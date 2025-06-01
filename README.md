# EML to Markdown Converter

[![GitHub stars](https://img.shields.io/github/stars/alissonsleal/eml_to_markdown?style=social)](https://github.com/alissonsleal/eml_to_markdown)
[![Twitter Follow](https://img.shields.io/twitter/follow/alissonsleal?style=social)](https://twitter.com/alissonsleal)
[![GitHub license](https://img.shields.io/github/license/alissonsleal/eml_to_markdown)](https://github.com/alissonsleal/eml_to_markdown/blob/main/LICENSE)
[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-black)](https://nextjs.org/)

A modern, client-side web application for converting email files (.eml) to Markdown format. Built with Next.js, TypeScript, and Shadcn UI with full dark mode support.

## Features

- **Client-side Processing**: All conversions happen in your browser - no files are uploaded to any server
- **Batch Conversion**: Upload and convert multiple EML files simultaneously
- **Dark Mode**: Beautiful light/dark theme with system preference detection
- **Merge Option**: Combine multiple emails into a single Markdown file or download separately
- **Rich Metadata**: Preserves email headers, sender, recipient, date, and subject information
- **HTML to Markdown**: Converts HTML email content to clean, readable Markdown
- **Attachment Info**: Extracts and displays attachment information
- **Download Options**: Download individual files or bulk download as ZIP

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Theme**: next-themes for dark mode
- **Package Manager**: Bun
- **File Processing**: emailjs-mime-parser, JSZip, file-saver

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Modern web browser

### Installation

```sh
# Clone the repository
git clone https://github.com/alissonsleal/eml_to_markdown.git
cd eml_to_markdown

# Install dependencies
bun install

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```sh
# Build the application
bun run build

# Start production server
bun start
```

## Usage

1. **Upload Files**: Click the upload area or drag and drop your .eml files
2. **Choose Options**:
   - Check "Merge all files" to combine emails into one Markdown file
   - Leave unchecked to download files separately in a ZIP archive
3. **Convert**: Files are processed automatically after upload
4. **Download**: Use the download buttons to save your converted files

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles and CSS variables
├── components/
│   ├── theme-provider.tsx  # Theme context provider
│   ├── theme-toggle.tsx    # Dark/light mode toggle
│   └── ui/                 # Shadcn UI components
├── lib/
│   ├── eml-parser.ts       # EML parsing and conversion logic
│   └── utils.ts            # Utility functions
└── types/
    └── emailjs-mime-parser.d.ts  # Type definitions
```

## Key Features Explained

### Client-Side Processing

All email parsing and conversion happens entirely in your browser using the Web File API. No data is sent to external servers, ensuring complete privacy.

### EML Parsing

The application uses `emailjs-mime-parser` to parse EML files and extract:

- Email headers (From, To, CC, BCC, Subject, Date)
- Message body (both text and HTML)
- Attachment information
- MIME structure

### Markdown Conversion

HTML content is converted to clean Markdown using a custom parser that handles:

- Common HTML tags (headings, paragraphs, lists, links, images)
- Email-specific formatting
- Preservation of text structure

## Privacy & Security

- **No Server Uploads**: All processing happens locally in your browser
- **No Data Collection**: No analytics, tracking, or data storage
- **Client-Side Only**: Files never leave your device during conversion

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [emailjs-mime-parser](https://github.com/emailjs/emailjs-mime-parser) for EML parsing
- [Shadcn UI](https://ui.shadcn.com/) for beautiful UI components
- [Lucide](https://lucide.dev/) for consistent icons
- [Next.js](https://nextjs.org/) for the amazing React framework
