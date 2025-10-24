#!/bin/bash
# Prerequisites Check Script
# Data Aggregator Platform Testing Framework

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Checking testing prerequisites..."
echo ""

ALL_OK=true

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker is installed${NC}"
    docker --version
else
    echo -e "${RED}✗ Docker is NOT installed${NC}"
    ALL_OK=false
fi

# Check Docker Compose (v2 or v1)
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose is installed (v2)${NC}"
    docker compose version
elif command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose is installed (v1)${NC}"
    docker-compose --version
else
    echo -e "${RED}✗ Docker Compose is NOT installed${NC}"
    ALL_OK=false
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓ Python 3 is installed${NC}"
    python3 --version
else
    echo -e "${RED}✗ Python 3 is NOT installed${NC}"
    ALL_OK=false
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js is installed${NC}"
    node --version
else
    echo -e "${RED}✗ Node.js is NOT installed${NC}"
    ALL_OK=false
fi

# Check Poetry
if command -v poetry &> /dev/null; then
    echo -e "${GREEN}✓ Poetry is installed${NC}"
    poetry --version
else
    echo -e "${YELLOW}⚠ Poetry is NOT installed (optional)${NC}"
fi

echo ""
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}All prerequisites are met!${NC}"
    exit 0
else
    echo -e "${RED}Some prerequisites are missing. Please install them.${NC}"
    exit 1
fi
