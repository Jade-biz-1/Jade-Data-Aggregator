"""
Analytics Export Service
Provides data export in multiple formats (JSON, CSV, Excel, PDF)
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import csv
import io
from enum import Enum


class ExportFormat(str, Enum):
    JSON = "json"
    CSV = "csv"
    EXCEL = "excel"
    PDF = "pdf"


class ExportService:
    """Service for exporting analytics data in various formats"""

    @staticmethod
    def export_to_json(
        data: Dict[str, Any],
        pretty: bool = True
    ) -> Dict[str, Any]:
        """Export data to JSON format"""
        json_str = json.dumps(data, indent=2 if pretty else None, default=str)

        return {
            "format": "json",
            "content": json_str,
            "mime_type": "application/json",
            "filename": f"analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            "size_bytes": len(json_str.encode('utf-8'))
        }

    @staticmethod
    def export_to_csv(
        data: List[Dict[str, Any]],
        columns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Export data to CSV format"""
        if not data:
            return {
                "format": "csv",
                "content": "",
                "mime_type": "text/csv",
                "filename": f"analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                "size_bytes": 0
            }

        # Determine columns
        if columns is None:
            columns = list(data[0].keys())

        # Create CSV in memory
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=columns, extrasaction='ignore')

        writer.writeheader()
        for row in data:
            writer.writerow(row)

        csv_content = output.getvalue()
        output.close()

        return {
            "format": "csv",
            "content": csv_content,
            "mime_type": "text/csv",
            "filename": f"analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            "size_bytes": len(csv_content.encode('utf-8'))
        }

    @staticmethod
    def export_time_series_to_csv(
        time_series_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Export time series data optimized for CSV"""
        formatted_data = []

        for entry in time_series_data:
            formatted_entry = {}

            # Format timestamp
            if "timestamp" in entry:
                formatted_entry["Date/Time"] = entry["timestamp"]

            # Add all metrics
            for key, value in entry.items():
                if key != "timestamp":
                    # Format key for readability
                    formatted_key = key.replace("_", " ").title()
                    formatted_entry[formatted_key] = value

            formatted_data.append(formatted_entry)

        return ExportService.export_to_csv(formatted_data)

    @staticmethod
    def export_performance_metrics_to_csv(
        metrics_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Export performance metrics to CSV format"""
        # Flatten metrics for CSV export
        flattened_data = []

        if "metrics" in metrics_data:
            for metric_name, metric_value in metrics_data["metrics"].items():
                flattened_data.append({
                    "Metric": metric_name.replace("_", " ").title(),
                    "Value": metric_value
                })

        return ExportService.export_to_csv(flattened_data)

    @staticmethod
    def export_comparative_analytics_to_csv(
        comparison_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Export comparative analytics to CSV format"""
        formatted_data = []

        if "comparison" in comparison_data:
            for pipeline_name, pipeline_data in comparison_data["comparison"].items():
                row = {"Pipeline": pipeline_name}

                if "metrics" in pipeline_data:
                    for metric_name, metric_value in pipeline_data["metrics"].items():
                        formatted_metric = metric_name.replace("_", " ").title()
                        row[formatted_metric] = metric_value

                formatted_data.append(row)

        return ExportService.export_to_csv(formatted_data)

    @staticmethod
    def create_export_summary(
        export_type: str,
        data_count: int,
        export_format: str,
        time_range: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create export metadata summary"""
        summary = {
            "export_type": export_type,
            "export_format": export_format,
            "record_count": data_count,
            "exported_at": datetime.now().isoformat(),
            "export_id": f"{export_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }

        if time_range:
            summary["time_range"] = time_range

        return summary

    @staticmethod
    def prepare_export_response(
        data: Any,
        export_format: ExportFormat,
        export_type: str = "analytics",
        time_range: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Prepare complete export response with data and metadata"""

        if export_format == ExportFormat.JSON:
            export_result = ExportService.export_to_json(data)
        elif export_format == ExportFormat.CSV:
            if isinstance(data, list):
                export_result = ExportService.export_to_csv(data)
            elif isinstance(data, dict):
                # Handle different data structures
                if "time_series" in data:
                    export_result = ExportService.export_time_series_to_csv(data["time_series"])
                elif "metrics" in data:
                    export_result = ExportService.export_performance_metrics_to_csv(data)
                elif "comparison" in data:
                    export_result = ExportService.export_comparative_analytics_to_csv(data)
                else:
                    # Flatten dict to list for CSV
                    export_result = ExportService.export_to_csv([data])
            else:
                raise ValueError(f"Unsupported data type for CSV export: {type(data)}")
        else:
            raise ValueError(f"Unsupported export format: {export_format}")

        # Add summary metadata
        record_count = len(data) if isinstance(data, list) else 1
        summary = ExportService.create_export_summary(
            export_type,
            record_count,
            export_format.value,
            time_range
        )

        return {
            **export_result,
            "summary": summary
        }


class ScheduledExportManager:
    """Manager for scheduled analytics exports"""

    def __init__(self):
        self.scheduled_exports = []

    def create_scheduled_export(
        self,
        user_id: int,
        export_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a scheduled export configuration

        Config format:
        {
            "name": "Weekly Performance Report",
            "query_config": {...},
            "export_format": "csv",
            "schedule": "0 0 * * 1",  # Cron format
            "recipients": ["email@example.com"],
            "enabled": true
        }
        """
        scheduled_export = {
            "id": len(self.scheduled_exports) + 1,
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            **export_config
        }

        self.scheduled_exports.append(scheduled_export)

        return scheduled_export

    def get_scheduled_exports(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all scheduled exports for a user"""
        return [
            export for export in self.scheduled_exports
            if export["user_id"] == user_id
        ]

    def update_scheduled_export(
        self,
        export_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a scheduled export"""
        for export in self.scheduled_exports:
            if export["id"] == export_id:
                export.update(updates)
                export["updated_at"] = datetime.now().isoformat()
                return export
        return None

    def delete_scheduled_export(self, export_id: int) -> bool:
        """Delete a scheduled export"""
        for i, export in enumerate(self.scheduled_exports):
            if export["id"] == export_id:
                del self.scheduled_exports[i]
                return True
        return False


class ReportBuilder:
    """Custom report builder for creating analytics reports"""

    @staticmethod
    def build_executive_summary(
        performance_data: Dict[str, Any],
        time_range: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build executive summary report"""
        return {
            "report_type": "executive_summary",
            "title": "Executive Performance Summary",
            "time_range": time_range,
            "generated_at": datetime.now().isoformat(),
            "sections": [
                {
                    "title": "Key Performance Indicators",
                    "metrics": performance_data.get("metrics", {})
                },
                {
                    "title": "Performance Summary",
                    "data": {
                        "total_runs": performance_data.get("total_runs", 0),
                        "success_rate": performance_data.get("metrics", {}).get("success_rate", 0),
                        "total_records": performance_data.get("metrics", {}).get("total_records_processed", 0)
                    }
                }
            ]
        }

    @staticmethod
    def build_detailed_analytics_report(
        time_series: List[Dict[str, Any]],
        performance_metrics: Dict[str, Any],
        trends: Dict[str, Any],
        time_range: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build comprehensive analytics report"""
        return {
            "report_type": "detailed_analytics",
            "title": "Detailed Analytics Report",
            "time_range": time_range,
            "generated_at": datetime.now().isoformat(),
            "sections": [
                {
                    "title": "Time Series Analysis",
                    "data": time_series
                },
                {
                    "title": "Performance Metrics",
                    "data": performance_metrics
                },
                {
                    "title": "Trend Analysis",
                    "data": trends
                }
            ]
        }

    @staticmethod
    def build_custom_report(
        report_config: Dict[str, Any],
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build custom report based on configuration"""
        return {
            "report_type": "custom",
            "title": report_config.get("title", "Custom Analytics Report"),
            "time_range": report_config.get("time_range", {}),
            "generated_at": datetime.now().isoformat(),
            "sections": report_config.get("sections", []),
            "data": data,
            "visualization_configs": report_config.get("visualizations", [])
        }
