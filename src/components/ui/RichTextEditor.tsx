'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[150px] bg-secondary/30 border border-border/50 rounded-md animate-pulse" />
  ),
})

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link'],
    ['clean'],
  ],
}

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'indent',
  'link',
]

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  readOnly = false,
}: RichTextEditorProps) {
  const editorModules = useMemo(() => (readOnly ? { toolbar: false } : modules), [readOnly])

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={editorModules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  )
}

// Component for displaying rich text content (read-only)
export function RichTextDisplay({ content }: { content: string }) {
  if (!content || content === '<p><br></p>') {
    return <p className="text-sm text-muted-foreground italic">No description</p>
  }

  // Sanitize HTML to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })

  return (
    <div
      className="rich-text-content"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}
