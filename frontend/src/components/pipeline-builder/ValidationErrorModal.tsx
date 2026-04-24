'use client';

import { XCircle, AlertTriangle, Lightbulb, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  suggestion?: string;
  node_id?: string;
  node_label?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  issues?: ValidationIssue[];
}

interface Props {
  result: ValidationResult;
  onClose: () => void;
  onFocusNode?: (nodeId: string) => void;
}

const SEVERITY_META = {
  error: {
    Icon: XCircle,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-50 border-red-200',
    labelClass: 'text-red-700',
    badgeClass: 'bg-red-100 text-red-800',
    label: 'Error',
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: 'text-yellow-500',
    bgClass: 'bg-yellow-50 border-yellow-200',
    labelClass: 'text-yellow-700',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    label: 'Warning',
  },
  suggestion: {
    Icon: Lightbulb,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-50 border-blue-200',
    labelClass: 'text-blue-700',
    badgeClass: 'bg-blue-100 text-blue-800',
    label: 'Suggestion',
  },
};

function IssueRow({
  issue,
  onFocusNode,
}: {
  issue: ValidationIssue;
  onFocusNode?: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const meta = SEVERITY_META[issue.severity];
  const { Icon } = meta;

  return (
    <div className={`rounded-lg border p-3 ${meta.bgClass}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${meta.iconClass}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold uppercase tracking-wide ${meta.labelClass}`}>
                {meta.label}
              </span>
              {issue.node_label && (
                <span className="text-xs text-gray-500">
                  — node: <strong className="text-gray-700">{issue.node_label}</strong>
                </span>
              )}
              {issue.node_id && onFocusNode && (
                <button
                  onClick={() => onFocusNode(issue.node_id!)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Locate on canvas
                </button>
              )}
            </div>
            {issue.suggestion && (
              <button
                onClick={() => setOpen(o => !o)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                title={open ? 'Hide fix suggestion' : 'Show fix suggestion'}
              >
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
          <p className={`text-sm font-medium mt-0.5 ${meta.labelClass}`}>{issue.message}</p>
          {issue.suggestion && open && (
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
              <span className="font-medium text-gray-700">How to fix: </span>
              {issue.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ValidationErrorModal({ result, onClose, onFocusNode }: Props) {
  // Build a normalised issue list — prefer the structured `issues` array when
  // available, fall back to constructing from the flat string arrays.
  const issues: ValidationIssue[] = result.issues && result.issues.length > 0
    ? result.issues
    : [
        ...result.errors.map(m => ({ severity: 'error' as const, message: m })),
        ...result.warnings.map(m => ({ severity: 'warning' as const, message: m })),
        ...result.suggestions.map(m => ({ severity: 'suggestion' as const, message: m })),
      ];

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const suggestions = issues.filter(i => i.severity === 'suggestion');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {result.is_valid
              ? <Lightbulb className="h-6 w-6 text-blue-500" />
              : <XCircle className="h-6 w-6 text-red-500" />
            }
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {result.is_valid ? 'Validation Passed with Notices' : 'Pipeline Validation Failed'}
              </h2>
              <p className="text-sm text-gray-500">
                {errors.length > 0 && `${errors.length} error${errors.length > 1 ? 's' : ''}`}
                {errors.length > 0 && warnings.length > 0 && ' · '}
                {warnings.length > 0 && `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`}
                {(errors.length > 0 || warnings.length > 0) && suggestions.length > 0 && ' · '}
                {suggestions.length > 0 && `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {errors.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">
                Errors — must fix before executing
              </h3>
              <div className="space-y-2">
                {errors.map((issue, i) => (
                  <IssueRow key={i} issue={issue} onFocusNode={onFocusNode} />
                ))}
              </div>
            </section>
          )}

          {warnings.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-yellow-600 mb-2 mt-4">
                Warnings — pipeline may not work as expected
              </h3>
              <div className="space-y-2">
                {warnings.map((issue, i) => (
                  <IssueRow key={i} issue={issue} onFocusNode={onFocusNode} />
                ))}
              </div>
            </section>
          )}

          {suggestions.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2 mt-4">
                Suggestions
              </h3>
              <div className="space-y-2">
                {suggestions.map((issue, i) => (
                  <IssueRow key={i} issue={issue} onFocusNode={onFocusNode} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button onClick={onClose}>
            {result.is_valid ? 'Continue' : 'Fix Issues'}
          </Button>
        </div>
      </div>
    </div>
  );
}
