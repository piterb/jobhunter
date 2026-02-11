#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting JobHunter local setup..."

# 1. Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first (required for Supabase)."
    exit 1
fi

if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI is not installed."
    echo "💡 Install it via: brew install supabase/tap/supabase (macOS) or visit https://supabase.com/docs/guides/cli"
    exit 1
fi

# 2. Install dependencies
echo "📦 Installing project dependencies..."
npm install

# 3. Initialize & Start Supabase
echo "⚡ Setting up Supabase..."
if [ ! -d "supabase" ]; then
    supabase init
fi

# Check if docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🐳 Starting Supabase containers (this might take a minute)..."
supabase start

# 4. Configure Environment Variables
echo "🔐 Configuring environment variables..."

# Get Supabase local credentials
# We use -o json for easier parsing, but even grep/awk works if jq is missing
SB_STATUS=$(supabase status -o json)
SB_URL=$(echo "$SB_STATUS" | grep -o '"api_url": "[^"]*' | cut -d'"' -f4)
SB_ANON_KEY=$(echo "$SB_STATUS" | grep -o '"anon_key": "[^"]*' | cut -d'"' -f4)
SB_SERVICE_KEY=$(echo "$SB_STATUS" | grep -o '"service_role_key": "[^"]*' | cut -d'"' -f4)

# Setup Client .env
if [ ! -f "client/.env.local" ]; then
    echo "📝 Creating client/.env.local"
    cat <<EOF > client/.env.local
NEXT_PUBLIC_SUPABASE_URL=$SB_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SB_ANON_KEY
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
EOF
else
    echo "ℹ️  client/.env.local already exists, skipping."
fi

# Setup Server .env
if [ ! -f "server/.env" ]; then
    echo "📝 Creating server/.env"
    cat <<EOF > server/.env
PORT=3001
NODE_ENV=development
SUPABASE_URL=$SB_URL
SUPABASE_SERVICE_ROLE_KEY=$SB_SERVICE_KEY
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=sk-placeholder-replace-me
EOF
else
    echo "ℹ️  server/.env already exists, skipping."
fi

echo ""
echo "✨ Setup complete!"
echo "-------------------------------------------------------"
echo "1. Add your OPENAI_API_KEY to 'server/.env'"
echo "2. Run 'npm run dev' to start the application"
echo "3. Visit http://localhost:3000"
echo "-------------------------------------------------------"
