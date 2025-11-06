'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
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

  // Simple syntax highlighting using CSS
  const getLanguageClass = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'python': return 'language-python';
      case 'javascript': return 'language-javascript';
      case 'typescript': return 'language-typescript';
      case 'json': return 'language-json';
      case 'bash': return 'language-bash';
      default: return 'language-text';
    }
  };

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      {(title || showCopyButton || showRunButton) && (
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {title && <span className="text-sm font-medium text-gray-200">{title}</span>}
            <span className="text-xs text-gray-400 uppercase tracking-wide">{language}</span>
          </div>
          <div className="flex items-center gap-2">
            {showRunButton && onRun && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRun}
                className="h-7 text-xs bg-gray-700 hover:bg-gray-600 border-gray-600 text-white hover:border-gray-500 transition-colors"
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
                className={`h-7 text-xs border-gray-600 text-white transition-all duration-200 ${
                  copied
                    ? 'bg-success-600 hover:bg-success-700 border-success-600'
                    : 'bg-gray-700 hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied!
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
      <div className="relative group">
        <pre
          className={`p-4 text-sm leading-relaxed overflow-x-auto bg-gray-900 text-gray-100 custom-scrollbar ${getLanguageClass(language)}`}
          style={{ fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", Courier, monospace' }}
        >
          {showLineNumbers ? (
            <code className="block">
              {code.split('\n').map((line, index) => (
                <span
                  key={index}
                  className={`block hover:bg-gray-800/50 transition-colors duration-150 ${
                    highlightLines.includes(index + 1)
                      ? 'bg-blue-900/40 border-l-4 border-blue-400 pl-2'
                      : ''
                  }`}
                >
                  <span className="inline-block w-8 text-right text-gray-500 select-none mr-4 text-xs">
                    {index + 1}
                  </span>
                  {line || '\u00A0'}
                </span>
              ))}
            </code>
          ) : (
            <code>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
};
