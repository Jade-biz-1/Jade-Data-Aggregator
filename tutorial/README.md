# Data Aggregator Platform - Interactive Tutorial

An interactive, self-paced tutorial application for learning the Data Aggregator Platform.

## Overview

This tutorial app provides:
- **6 Progressive Modules**: From platform basics to advanced scenarios
- **Hands-on Exercises**: Real API integration with validation
- **4 Real-World Scenarios**: E-commerce, IoT, Financial, Customer 360
- **Interactive Playground**: Sandbox environment for experimentation
- **Progress Tracking**: Save and resume your learning journey

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Access to Data Aggregator Platform API

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# http://localhost:4000
```

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm run start
```

## Project Structure

```
tutorial/
├── app/                    # Next.js app directory
│   ├── modules/            # Tutorial modules (1-6)
│   ├── playground/         # Interactive sandbox
│   ├── progress/           # Progress tracking
│   └── help/               # Help resources
├── components/
│   ├── tutorial/           # Tutorial-specific components
│   ├── sandbox/            # Interactive tools
│   └── ui/                 # UI primitives
├── lib/
│   ├── api/                # API integration
│   ├── sample-data/        # Data generators
│   └── progress/           # Progress tracking
├── public/
│   └── sample-data/        # Sample CSV/JSON files
└── docs/                   # Tutorial documentation
```

## Configuration

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TUTORIAL_MODE=true
```

## Learning Path

1. **Module 1**: Platform Basics (30 mins)
2. **Module 2**: Connectors (45 mins)
3. **Module 3**: Transformations (60 mins)
4. **Module 4**: Pipelines (90 mins)
5. **Module 5**: Advanced Features (90 mins)
6. **Module 6**: Production Scenarios (120 mins)

## Development

```bash
# Install dependencies
npm install

# Run dev server (port 4000)
npm run dev

# Lint code
npm run lint

# Build
npm run build
```

## Features

- ✅ Interactive code editor (Monaco)
- ✅ Visual pipeline builder
- ✅ Real-time API testing
- ✅ Progress tracking
- ✅ Exercise validation
- ✅ Gamification badges
- ✅ Sample data library

## Documentation

- **Specification**: See `/TUTORIAL_APP_SPECIFICATION.md`
- **Implementation Plan**: See `/TUTORIAL_IMPLEMENTATION_PLAN.md`
- **Task List**: See `/TUTORIAL_TASKS.md`

## Support

For issues or questions:
1. Check tutorial documentation
2. Review API docs: http://localhost:8001/docs
3. Consult platform user guide

## License

Same as Data Aggregator Platform

## Version

v0.1.0 - Initial Setup
