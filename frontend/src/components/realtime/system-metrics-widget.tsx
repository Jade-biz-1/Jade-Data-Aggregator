'use client';

import { useRealTimeMetrics } from '@/hooks/useRealTimeMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, HardDrive, MemoryStick, Wifi, WifiOff } from 'lucide-react';

export function SystemMetricsWidget() {
  const { metrics, lastUpdate, isConnected } = useRealTimeMetrics();

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">System Metrics (Live)</CardTitle>
        <div className="flex items-center">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!metrics ? (
          <div className="text-sm text-gray-500">Waiting for metrics...</div>
        ) : (
          <div className="space-y-4">
            {/* CPU */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">CPU</span>
              </div>
              <span className={`text-sm font-bold ${getStatusColor(metrics.cpu.percent)}`}>
                {metrics.cpu.percent.toFixed(1)}%
              </span>
            </div>

            {/* Memory */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MemoryStick className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${getStatusColor(metrics.memory.percent)}`}>
                  {metrics.memory.percent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {metrics.memory.used_gb.toFixed(1)} / {metrics.memory.total_gb.toFixed(1)} GB
                </div>
              </div>
            </div>

            {/* Disk */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Disk</span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${getStatusColor(metrics.disk.percent)}`}>
                  {metrics.disk.percent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {metrics.disk.free_gb.toFixed(1)} GB free
                </div>
              </div>
            </div>

            {/* Last Update */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                Last updated: {formatTime(lastUpdate)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
