#!/bin/bash

# DeepGuard Backend Start Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  DeepGuard Backend - Startup${NC}"
echo -e "${GREEN}================================${NC}\n"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚙️  Please edit .env with your settings${NC}\n"
fi

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.8+${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓${NC} Python version: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}🔧 Activating virtual environment...${NC}"
source venv/bin/activate

# Install/update requirements
echo -e "${YELLOW}📥 Installing requirements...${NC}"
pip install -q -r requirements.txt

# Initialize database
echo -e "${YELLOW}💾 Initializing database...${NC}"
python3 -c "from app.database import init_db; init_db()" 2>/dev/null || true

# Start server
echo -e "\n${GREEN}🚀 Starting DeepGuard API Server...${NC}"
echo -e "${GREEN}📍 Server running at: http://localhost:8000${NC}"
echo -e "${GREEN}📚 Docs at: http://localhost:8000/api/docs${NC}"
echo -e "${GREEN}📊 Health check: http://localhost:8000/api/health${NC}\n"

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

echo -e "\n${RED}🛑 Server stopped${NC}"
