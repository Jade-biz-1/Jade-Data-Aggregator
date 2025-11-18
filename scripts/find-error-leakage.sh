#!/bin/bash
# Script to find error message leakage in Python files
# Part of Phase 11A - SEC-002

echo "🔍 Scanning for error message leakage patterns..."
echo ""
echo "================================================================"
echo "Pattern: raise HTTPException(...detail=f\"...{str(e)}\")"
echo "================================================================"
echo ""

# Find all instances of error leakage
grep -rn "raise HTTPException.*detail=f\"" backend/ --include="*.py" | \
    grep -v "__pycache__" | \
    grep -v ".pyc" | \
    grep "{str(e)}\|{e}\|{exc}\|{error}"

echo ""
echo "================================================================"
echo "Summary by file:"
echo "================================================================"
echo ""

# Count instances per file
grep -r "raise HTTPException.*detail=f\"" backend/ --include="*.py" | \
    grep -v "__pycache__" | \
    grep "{str(e)}\|{e}\|{exc}\|{error}" | \
    cut -d: -f1 | sort | uniq -c | sort -rn

echo ""
echo "================================================================"
echo "Fixedfiles (should return nothing):"
echo "================================================================"
echo ""
echo "✅ backend/api/v1/endpoints/logs.py - FIXED"
echo ""
echo "To fix a file, replace patterns like:"
echo "  raise HTTPException(500, detail=f\"Error: {str(e)}\")"
echo "with:"
echo "  from backend.core.error_handler import safe_error_response"
echo "  raise safe_error_response(500, \"User-friendly message\", internal_error=e)"
