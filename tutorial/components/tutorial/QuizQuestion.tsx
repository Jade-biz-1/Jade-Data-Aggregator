'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestionProps {
  question: string;
  options: QuizOption[];
  explanation?: string;
  hint?: string;
  multipleChoice?: boolean;
  onAnswer?: (correct: boolean, selectedIds: string[]) => void;
  allowRetry?: boolean;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  options,
  explanation,
  hint,
  multipleChoice = false,
  onAnswer,
  allowRetry = true,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleOptionClick = (optionId: string) => {
    if (submitted && !allowRetry) return;

    const newSelected = new Set(selectedOptions);
    if (multipleChoice) {
      if (newSelected.has(optionId)) {
        newSelected.delete(optionId);
      } else {
        newSelected.add(optionId);
      }
    } else {
      newSelected.clear();
      newSelected.add(optionId);
    }
    setSelectedOptions(newSelected);
  };

  const handleSubmit = () => {
    if (selectedOptions.size === 0) return;

    // Check if answer is correct
    const selectedIds = Array.from(selectedOptions);
    const correctIds = options.filter((opt) => opt.isCorrect).map((opt) => opt.id);

    const correct =
      selectedIds.length === correctIds.length &&
      selectedIds.every((id) => correctIds.includes(id));

    setIsCorrect(correct);
    setSubmitted(true);

    if (onAnswer) {
      onAnswer(correct, selectedIds);
    }
  };

  const handleReset = () => {
    setSelectedOptions(new Set());
    setSubmitted(false);
    setIsCorrect(null);
    setShowHint(false);
  };

  return (
    <Card className="p-6">
      {/* Question */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-start gap-2">
          <HelpCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          {question}
        </h3>
        {multipleChoice && (
          <p className="text-sm text-gray-600 italic">
            Select all that apply
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {options.map((option) => {
          const isSelected = selectedOptions.has(option.id);
          const showCorrectness = submitted;
          const isOptionCorrect = option.isCorrect;

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={submitted && !allowRetry}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${isSelected && !showCorrectness ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}
                ${showCorrectness && isSelected && isOptionCorrect ? 'border-success-500 bg-success-50' : ''}
                ${showCorrectness && isSelected && !isOptionCorrect ? 'border-danger-500 bg-danger-50' : ''}
                ${showCorrectness && !isSelected && isOptionCorrect ? 'border-success-300 bg-success-25' : ''}
                ${!(submitted && !allowRetry) ? 'hover:border-primary-300 cursor-pointer' : 'cursor-not-allowed'}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox/Radio */}
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                  ${multipleChoice ? 'rounded' : 'rounded-full'}
                  ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}
                  ${showCorrectness && isSelected && isOptionCorrect ? 'bg-success-600 border-success-600' : ''}
                  ${showCorrectness && isSelected && !isOptionCorrect ? 'bg-danger-600 border-danger-600' : ''}
                `}>
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>

                {/* Option Text */}
                <span className="flex-1 text-gray-900">{option.text}</span>

                {/* Status Icon */}
                {showCorrectness && isSelected && (
                  isOptionCorrect ? (
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {hint && !submitted && (
        <div className="mb-4">
          {showHint ? (
            <Alert variant="info">
              <strong>Hint:</strong> {hint}
            </Alert>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHint(true)}
            >
              Show Hint
            </Button>
          )}
        </div>
      )}

      {/* Result */}
      {submitted && isCorrect !== null && (
        <div className="mb-4">
          <Alert variant={isCorrect ? 'success' : 'error'}>
            <div className="flex items-start gap-2">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <div>
                <strong>
                  {isCorrect ? 'Correct!' : 'Not quite right.'}
                </strong>
                {explanation && (
                  <p className="mt-1 text-sm">{explanation}</p>
                )}
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!submitted ? (
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={selectedOptions.size === 0}
          >
            Submit Answer
          </Button>
        ) : allowRetry && (
          <Button variant="outline" onClick={handleReset}>
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
};
