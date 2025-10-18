#!/usr/bin/env python3
"""
Generate Test Summary Report
Combines data from all test stages and generates a comprehensive summary
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def generate_summary():
    """Generate comprehensive test summary"""

    reports_dir = Path(__file__).parent.parent / "reports"

    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         Data Aggregator Platform - Test Summary               ║")
    print(f"║         Execution Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                   ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()

    # Try to load test results if they exist
    results_file = reports_dir / "test-results.json"
    if results_file.exists():
        with open(results_file) as f:
            results = json.load(f)

        print("OVERALL RESULTS")
        print("───────────────────────────────────────────────────────────────")
        print(f"Total Tests:       {results.get('total_tests', 0):,}")
        print(f"Passed:            {results.get('passed', 0):,}  ({results.get('pass_rate', 0):.1f}%)")
        print(f"Failed:            {results.get('failed', 0):,}  ({results.get('fail_rate', 0):.1f}%)")
        print(f"Skipped:           {results.get('skipped', 0):,}  ({results.get('skip_rate', 0):.1f}%)")
        print(f"Duration:          {results.get('duration', '0m 0s')}")
        print(f"Status:            {'✓ PASSED' if results.get('failed', 0) == 0 else '✗ FAILED'}")
        print()
    else:
        print("OVERALL RESULTS")
        print("───────────────────────────────────────────────────────────────")
        print("No test results found. Run tests to generate results.")
        print()

    # Try to load coverage data
    backend_cov_file = reports_dir / "coverage/backend/coverage.json"
    if backend_cov_file.exists():
        with open(backend_cov_file) as f:
            backend_cov = json.load(f)

        print("COVERAGE")
        print("───────────────────────────────────────────────────────────────")
        total = backend_cov.get('totals', {})
        coverage_pct = total.get('percent_covered', 0)
        target = 80

        print(f"Backend Overall:    {coverage_pct:.1f}%  (Target: {target}%) {'✓' if coverage_pct >= target else '✗'}")
        print()
    else:
        print("COVERAGE")
        print("───────────────────────────────────────────────────────────────")
        print("No coverage data found. Run tests with coverage to generate data.")
        print()

    print("REPORTS")
    print("───────────────────────────────────────────────────────────────")
    print(f"HTML Coverage:  {reports_dir}/coverage/backend/index.html")
    print(f"                {reports_dir}/coverage/frontend/index.html")
    print(f"Test Results:   {reports_dir}/test-results.json")
    print(f"Logs:           {reports_dir}/logs/")
    print()

if __name__ == "__main__":
    generate_summary()
