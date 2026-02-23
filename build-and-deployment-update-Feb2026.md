---
## February 2026 Update

- Poetry dependencies updated: pyotp and aiosqlite added for backend compatibility.
- Backend test harness refactored for async fixtures and SQLite support.
- Middleware error handling improved (rate limiting, input validation).
- ExceptionGroup handling updated for Python 3.12.
- Security middleware regression tests pass; deprecation warnings remain (Pydantic V1, SQLAlchemy).
