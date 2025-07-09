#!/bin/bash

# HungerQuest Speech-to-Text Backend Server

echo "🎤 Starting HungerQuest Speech-to-Text Backend Server..."
echo "📡 AssemblyAI Integration Ready"
echo "🔗 Server will run on http://localhost:3001"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "🚀 Starting server..."
npm run dev 