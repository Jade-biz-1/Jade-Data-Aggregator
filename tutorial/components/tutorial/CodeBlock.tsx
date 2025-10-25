'use client';

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/Button';
import { Copy, Check, Play } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  showCopyButton?: boolean;
  showRunButton?: boolean;
  onRun?: () => void;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'javascript',
  title,
  showLineNumbers = true,
  highlightLines = [],
  showCopyButton = true,
  showRunButton = false,
  onRun,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleRun = () => {
    if (onRun) {
      onRun();
    }
  };

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}>
      {/* Header */}
      {(title || showCopyButton || showRunButton) && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {title && <span className="text-sm font-medium text-gray-300">{title}</span>}
            <span className="text-xs text-gray-500 uppercase">{language}</span>
          </div>
          <div className="flex items-center gap-2">
            {showRunButton && onRun && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRun}
                className="h-7 text-xs bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
              >
                <Play className="w-3 h-3 mr-1" />
                Run
              </Button>
            )}
            {showCopyButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Code Content */}
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          wrapLines={highlightLines.length > 0}
          lineProps={(lineNumber) => {
            const style: React.CSSProperties = { display: 'block' };
            if (highlightLines.includes(lineNumber)) {
              style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              style.borderLeft = '3px solid rgb(59, 130, 246)';
              style.paddingLeft = '0.5rem';
            }
            return { style };
          }}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            background: '#1e1e1e',
          }}
          codeTagProps={{
            style: {
              fontFamily: '"Fira Code", "Courier New", Courier, monospace',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
