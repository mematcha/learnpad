'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mathematics from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { EditorToolbar } from './editor-toolbar';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  showToolbar?: boolean;
  bordered?: boolean;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className,
  editable = true,
  onFocus,
  onBlur,
  showToolbar = true,
  bordered = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
          displayMode: false,
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
          'prose-headings:font-semibold prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-7',
          'prose-li:text-foreground',
          'prose-strong:text-foreground prose-strong:font-semibold',
          'prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-pre:bg-muted prose-pre:text-foreground',
          'prose-blockquote:text-muted-foreground prose-blockquote:border-l-border',
          'prose-hr:border-border',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
          'min-h-[200px] p-4'
        ),
      },
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn(bordered ? 'border rounded-lg overflow-hidden' : '', className)}>
      {showToolbar && <EditorToolbar editor={editor} />}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="min-h-[200px] max-h-[600px] overflow-y-auto"
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {editor.isEmpty && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
