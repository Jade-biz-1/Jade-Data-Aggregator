#!/usr/bin/env python3
"""
Test Summary Report Generator
Data Aggregator Platform Testing Framework

Parses test results and generates comprehensive summary
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Callable, Dict, Iterable, Optional, Tuple

PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORTS_DIR = PROJECT_ROOT / "testing" / "reports"
LOG_DIR = REPORTS_DIR / "logs"


def print_ascii_header() -> None:
    """Print ASCII art header."""
    print(
        """
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         Data Aggregator Platform - Test Report              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        """
    )


def read_log_lines(log_path: Path) -> Optional[Iterable[str]]:
    """Read a log file if it exists."""
    if not log_path.exists():
        return None
    return log_path.read_text().splitlines()


def parse_pytest_log(lines: Iterable[str]) -> Tuple[str, str]:
    """Parse pytest output returning status and summary line."""
    summary = "No summary available"
    status = "UNKNOWN"

    failure_indicators = ("FAILED", "ERROR", "traceback", "Traceback")
    has_failure = any(any(indicator in line for indicator in failure_indicators) for line in lines)

    for line in reversed(list(lines)):
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("=") and " in " in stripped:
            summary = stripped.strip("=").strip()
            break
        if " passed" in stripped.lower() or " failed" in stripped.lower():
            summary = stripped
            if "=" in stripped:
                break

    if has_failure or "failed" in summary.lower():
        status = "FAILED"
    elif "passed" in summary.lower():
        status = "PASSED"

    return status, summary


def parse_jest_log(lines: Iterable[str]) -> Tuple[str, str]:
    """Parse Jest output to derive status."""
    suites_line = None
    tests_line = None
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("Test Suites:"):
            suites_line = stripped
        if stripped.startswith("Tests:"):
            tests_line = stripped

    summary_parts = [part for part in [suites_line, tests_line] if part]
    summary = " | ".join(summary_parts) if summary_parts else "No summary available"

    if any("failed" in part.lower() for part in summary_parts):
        status = "FAILED"
    elif summary_parts:
        status = "PASSED"
    else:
        status = "UNKNOWN"

    return status, summary


def parse_generic_log(lines: Iterable[str]) -> Tuple[str, str]:
    """Fallback parser for logs that simply checks for failure keywords."""
    text = "\n".join(lines)
    if not text:
        return "UNKNOWN", "No log output"

    if any(keyword in text for keyword in ("FAIL", "ERROR", "Failed")):
        return "FAILED", "Failures detected"
    return "PASSED", "No failures detected"


def extract_pytest_coverage(lines: Iterable[str]) -> Optional[str]:
    """Extract coverage percentage from pytest coverage report."""
    coverage_pattern = re.compile(r"TOTAL\s+\d+\s+\d+\s+\d+\s+\d+\s+(\d+%)")
    for line in reversed(list(lines)):
        match = coverage_pattern.search(line)
        if match:
            return match.group(1)
    return None


def extract_jest_coverage(lines: Iterable[str]) -> Optional[str]:
    """Extract coverage percentage from Jest output."""
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("All files") and "|" in stripped:
            parts = [part.strip() for part in stripped.split("|") if part.strip()]
            if len(parts) >= 2:
                return parts[1]
    return None


StageParser = Callable[[Iterable[str]], Tuple[str, str]]


STAGES: Dict[str, Dict[str, object]] = {
    "backend_unit": {
        "label": "Backend Unit Tests",
        "log": "backend-unit.log",
        "parser": parse_pytest_log,
        "coverage_extractor": extract_pytest_coverage,
    },
    "backend_integration": {
        "label": "Backend Integration Tests",
        "log": "backend-integration.log",
        "parser": parse_pytest_log,
    },
    "frontend_unit": {
        "label": "Frontend Unit Tests",
        "log": "frontend-unit.log",
        "parser": parse_jest_log,
        "coverage_extractor": extract_jest_coverage,
    },
    "frontend_integration": {
        "label": "Frontend Integration Tests",
        "log": "frontend-integration.log",
        "parser": parse_jest_log,
    },
    "e2e": {
        "label": "End-to-End Tests",
        "log": "e2e.log",
        "parser": parse_generic_log,
    },
    "performance": {
        "label": "Performance Tests",
        "log": "performance.log",
        "parser": parse_generic_log,
    },
    "security": {
        "label": "Security Tests",
        "log": "security.log",
        "parser": parse_generic_log,
    },
}


def generate_summary() -> None:
    """Generate test summary report based on collected artifacts."""

    print_ascii_header()
    print(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()

    print("📊 TEST EXECUTION SUMMARY")
    print("-" * 60)

    coverage_results: Dict[str, str] = {}

    for key, metadata in STAGES.items():
        log_path = LOG_DIR / metadata["log"]
        lines = read_log_lines(log_path)

        if lines is None:
            status = "NOT RUN"
            summary = "Log file not found"
        else:
            parser: StageParser = metadata["parser"]  # type: ignore[assignment]
            status, summary = parser(lines)

            coverage_extractor = metadata.get("coverage_extractor")
            if coverage_extractor:
                coverage_value = coverage_extractor(lines)  # type: ignore[arg-type]
                if coverage_value:
                    coverage_results[metadata["label"]] = coverage_value

        print(f"{metadata['label']:<30} {status:<8} {summary}")

    print()
    print("=" * 60)
    print("📈 COVERAGE SUMMARY")
    print("-" * 60)

    if coverage_results:
        for label, coverage in coverage_results.items():
            print(f"{label:<30} {coverage}")
    else:
        print("No coverage artifacts detected. Run tests with coverage enabled.")

    print()
    print("=" * 60)
    print("💡 RECOMMENDATIONS")
    print("-" * 60)
    print("• Ensure each test stage generates logs under testing/reports/logs")
    print("• Review failing stages before merging changes")
    print("• Upload coverage reports to CI for historical tracking")
    print()


if __name__ == "__main__":
    generate_summary()
