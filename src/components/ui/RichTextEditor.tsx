'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[150px] bg-[#1f1f23] border border-[#27272a] rounded-md animate-pulse" />
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
      <style jsx global>{`
        .rich-text-editor .ql-container {
          background: #1f1f23;
          border: 1px solid #27272a;
          border-top: none;
          border-radius: 0 0 6px 6px;
          color: white;
          font-size: 14px;
          min-height: 120px;
        }
        .rich-text-editor .ql-editor {
          min-height: 120px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #6b7280;
          font-style: normal;
        }
        .rich-text-editor .ql-toolbar {
          background: #27272a;
          border: 1px solid #27272a;
          border-radius: 6px 6px 0 0;
        }
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #9ca3af;
        }
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #9ca3af;
        }
        .rich-text-editor .ql-toolbar .ql-picker {
          color: #9ca3af;
        }
        .rich-text-editor .ql-toolbar .ql-picker-options {
          background: #27272a;
          border-color: #3f3f46;
        }
        .rich-text-editor .ql-toolbar .ql-picker-item:hover {
          color: white;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: white;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: white;
        }
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button.ql-active {
          color: white;
        }
        .rich-text-editor .ql-editor a {
          color: #818cf8;
        }
        .rich-text-editor .ql-editor h1 {
          font-size: 1.5em;
          font-weight: 600;
        }
        .rich-text-editor .ql-editor h2 {
          font-size: 1.25em;
          font-weight: 600;
        }
        .rich-text-editor .ql-editor h3 {
          font-size: 1.1em;
          font-weight: 600;
        }
        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5em;
        }
        /* Read-only styles */
        .rich-text-editor .ql-container.ql-disabled {
          border-radius: 6px;
        }
      `}</style>
    </div>
  )
}

// Component for displaying rich text content (read-only)
export function RichTextDisplay({ content }: { content: string }) {
  if (!content || content === '<p><br></p>') {
    return <p className="text-sm text-gray-500 italic">No description</p>
  }

  return (
    <div
      className="prose prose-sm prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        color: 'white',
        fontSize: '14px',
      }}
    />
  )
}
