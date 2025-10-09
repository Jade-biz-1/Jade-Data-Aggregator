# Contributing to Data Aggregator Platform

Thank you for your interest in contributing to the Data Aggregator Platform! This document provides guidelines and instructions for contributing to the project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We pledge to:

- Be respectful and considerate in all interactions
- Welcome diverse perspectives and experiences
- Focus on what is best for the community
- Show empathy towards other community members

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Unacceptable behavior includes:**
- Harassment, trolling, or discriminatory comments
- Publishing others' private information
- Other conduct that could be considered inappropriate

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Git** installed and configured
- **Python 3.11+** for backend development
- **Node.js 18+** for frontend development
- **Docker** and **Docker Compose** for local development
- **PostgreSQL 15+** and **Redis 7+** (or use Docker)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dataaggregator.git
   cd dataaggregator
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/dataaggregator.git
   ```

---

## Development Setup

### Backend Setup

```bash
cd backend

# Install Poetry
pip install poetry

# Install dependencies
poetry install

# Setup environment variables
cp .env.example .env
# Edit .env with your local settings

# Run database migrations
poetry run alembic upgrade head

# Start development server
poetry run uvicorn backend.main:app --reload --port 8001
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your local settings

# Start development server
npm run dev
```

### Docker Setup (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Fixes** - Fix identified bugs
2. **New Features** - Implement new functionality
3. **Documentation** - Improve or add documentation
4. **Tests** - Add or improve test coverage
5. **Performance** - Optimize code performance
6. **Refactoring** - Improve code quality
7. **UI/UX** - Enhance user interface and experience

### Finding Issues to Work On

- Check the [Issues](https://github.com/REPO/issues) page
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### Creating Issues

Before creating a new issue:

1. **Search existing issues** to avoid duplicates
2. **Use issue templates** when available
3. **Provide clear description** with steps to reproduce (for bugs)
4. **Include relevant information** (OS, browser, versions)

**Good Issue Example:**
```markdown
### Bug Description
Pipeline execution fails when processing CSV files >50MB

### Steps to Reproduce
1. Upload CSV file larger than 50MB
2. Create pipeline with data transformation
3. Execute pipeline
4. Error occurs at step 3

### Expected Behavior
Pipeline should process files up to 100MB

### Actual Behavior
Pipeline fails with "Memory exceeded" error

### Environment
- OS: Ubuntu 22.04
- Browser: Chrome 120
- Backend Version: 1.0.0
```

---

## Pull Request Process

### Before Submitting

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following our coding standards

3. **Test your changes:**
   ```bash
   # Backend tests
   cd backend
   poetry run pytest

   # Frontend tests
   cd frontend
   npm test

   # E2E tests
   cd frontend
   npm run test:e2e
   ```

4. **Update documentation** if needed

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add user authentication

   - Implement JWT-based authentication
   - Add login and registration endpoints
   - Include unit tests for auth service

   Closes #123"
   ```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add OAuth2 integration

Implement OAuth2 authentication flow for Google and GitHub providers.
Includes user profile synchronization and token refresh logic.

Closes #456

---

fix(pipeline): handle null values in transformations

- Add null checks in data transformation functions
- Update tests to cover null value scenarios
- Fix edge case where empty arrays caused crashes

Fixes #789
```

### Submitting Pull Request

1. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill in PR template:**
   - Clear description of changes
   - Link to related issues
   - Screenshots (if UI changes)
   - Test results
   - Breaking changes (if any)

4. **Wait for review** - maintainers will review your PR

5. **Address feedback** - make requested changes

6. **Get approval** - PR will be merged once approved

### Pull Request Template

```markdown
## Description
Brief description of what this PR does

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

---

## Coding Standards

### Python (Backend)

**Style Guide:** PEP 8

```python
# Use type hints
def process_data(data: dict, user_id: str) -> dict:
    """
    Process data for the given user.

    Args:
        data: The input data dictionary
        user_id: The user identifier

    Returns:
        Processed data dictionary

    Raises:
        ValueError: If data is invalid
    """
    if not data:
        raise ValueError("Data cannot be empty")

    # Implementation
    return processed_data

# Use meaningful variable names
user_pipeline_count = get_pipeline_count(user_id)

# Use docstrings for all public functions and classes
class Pipeline:
    """
    Represents a data processing pipeline.

    Attributes:
        id: Unique pipeline identifier
        name: Pipeline name
        is_active: Whether pipeline is active
    """
    pass
```

**Code Formatting:**
```bash
# Format code with Black
poetry run black .

# Sort imports with isort
poetry run isort .

# Lint with flake8
poetry run flake8 .

# Type check with mypy
poetry run mypy .
```

### TypeScript/React (Frontend)

**Style Guide:** Airbnb + Prettier

```typescript
// Use TypeScript interfaces
interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

// Use functional components with hooks
export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Skeleton />;
  if (!user) return <NotFound />;

  return (
    <div className="user-profile">
      <h1>{user.email}</h1>
      <Badge>{user.role}</Badge>
    </div>
  );
}

// Use meaningful component names
export function PipelineExecutionStatus() {
  // Component implementation
}
```

**Code Formatting:**
```bash
# Format code with Prettier
npm run format

# Lint with ESLint
npm run lint

# Type check
npm run type-check
```

### General Guidelines

1. **Keep functions small** - Single responsibility principle
2. **Use meaningful names** - Variables, functions, classes
3. **Add comments** - Explain complex logic, not obvious code
4. **Avoid magic numbers** - Use named constants
5. **Handle errors** - Always handle potential errors
6. **Write tests** - Aim for 80%+ code coverage
7. **Keep it DRY** - Don't Repeat Yourself
8. **Follow SOLID principles** - Especially Single Responsibility

---

## Testing Guidelines

### Backend Testing

**Unit Tests:**
```python
import pytest
from backend.services.pipeline_service import PipelineService

def test_create_pipeline():
    """Test pipeline creation with valid data."""
    service = PipelineService()
    pipeline = service.create_pipeline({
        "name": "Test Pipeline",
        "description": "Test description"
    })

    assert pipeline.name == "Test Pipeline"
    assert pipeline.is_active is False

def test_create_pipeline_invalid_name():
    """Test pipeline creation with invalid name."""
    service = PipelineService()

    with pytest.raises(ValueError):
        service.create_pipeline({"name": ""})
```

**Integration Tests:**
```python
@pytest.mark.asyncio
async def test_pipeline_execution(client, test_db):
    """Test complete pipeline execution flow."""
    # Create pipeline
    response = await client.post("/api/pipelines", json={
        "name": "Test Pipeline"
    })
    assert response.status_code == 201

    # Execute pipeline
    pipeline_id = response.json()["id"]
    response = await client.post(f"/api/pipelines/{pipeline_id}/execute")
    assert response.status_code == 200
```

### Frontend Testing

**Component Tests:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/components/auth/login-form';

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

**E2E Tests:**
```typescript
import { test, expect } from '@playwright/test';

test('user can create and execute pipeline', async ({ page }) => {
  // Login
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('admin@test.com');
  await page.getByLabel(/password/i).fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Navigate to pipelines
  await page.goto('/pipelines');
  await page.getByRole('button', { name: /create pipeline/i }).click();

  // Create pipeline
  await page.getByLabel(/name/i).fill('Test Pipeline');
  await page.getByRole('button', { name: /save/i }).click();

  // Verify creation
  await expect(page.getByText('Test Pipeline')).toBeVisible();
});
```

---

## Documentation

### Code Documentation

- **Add docstrings** to all public functions and classes
- **Comment complex logic** - Explain why, not what
- **Keep docs updated** when changing code
- **Use type hints** in Python
- **Use JSDoc** for complex TypeScript functions

### Project Documentation

When adding new features, update:

- `README.md` - If public API changes
- API documentation - For new endpoints
- User guide - For user-facing features
- Architecture docs - For significant changes

---

## Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and discussions
- **Slack/Discord** - Real-time chat (if available)

### Getting Help

- Check existing documentation
- Search closed issues
- Ask in GitHub Discussions
- Tag maintainers if urgent

### Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- Project README

---

## License

By contributing to the Data Aggregator Platform, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have questions not covered in this guide, please:
1. Check the [Documentation](./docs/)
2. Search [existing issues](https://github.com/REPO/issues)
3. Create a new issue with the `question` label

---

Thank you for contributing to the Data Aggregator Platform! 🎉

**Last Updated:** October 7, 2025
