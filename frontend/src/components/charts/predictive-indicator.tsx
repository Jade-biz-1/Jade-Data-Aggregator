'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface PredictiveData {
  prediction_available: boolean;
  predictions?: {
    next_day_records: number;
    next_day_success_rate: number;
    confidence: 'high' | 'medium' | 'low';
  };
  volatility?: {
    records_std_dev: number;
    success_rate_std_dev: number;
  };
  recommendation?: string;
}

interface PredictiveIndicatorProps {
  data: PredictiveData;
  title?: string;
}

export const PredictiveIndicator: React.FC<PredictiveIndicatorProps> = ({
  data,
  title = 'Predictive Analytics'
}) => {
  if (!data.prediction_available) {
    return (
      <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="flex items-center gap-2 text-gray-600">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm">Insufficient data for prediction</p>
        </div>
      </div>
    );
  }

  const { predictions, volatility, recommendation } = data;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
      case 'low':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    }
  };

  const confidenceColors = getConfidenceColor(predictions?.confidence || 'low');

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Based on the last 7 days of historical data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Predicted Records */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Predicted Records</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {predictions?.next_day_records.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">Expected for tomorrow</p>
        </div>

        {/* Predicted Success Rate */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Predicted Success Rate</span>
            <Activity className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {predictions?.next_day_success_rate.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Expected success rate</p>
        </div>
      </div>

      {/* Confidence Level */}
      <div className={`p-4 rounded-lg border ${confidenceColors.border} ${confidenceColors.bg} mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className={`w-5 h-5 ${confidenceColors.text}`} />
          <span className={`font-semibold ${confidenceColors.text}`}>
            {(predictions?.confidence || 'low').charAt(0).toUpperCase() + (predictions?.confidence || 'low').slice(1)} Confidence
          </span>
        </div>
        <p className={`text-sm ${confidenceColors.text}`}>
          Prediction confidence level based on data volatility and consistency
        </p>
      </div>

      {/* Volatility Metrics */}
      {
        volatility && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Records Volatility</p>
              <p className="text-lg font-semibold text-gray-900">
                ±{volatility.records_std_dev.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Success Rate Volatility</p>
              <p className="text-lg font-semibold text-gray-900">
                ±{volatility.success_rate_std_dev.toFixed(2)}%
              </p>
            </div>
          </div>
        )
      }

      {/* Recommendation */}
      {
        recommendation && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Recommendation</h4>
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};
