#!/bin/bash

# Chatbot Build & Test Script
echo "🤖 Testing Chatbot Integration..."

# Navigate to the project directory
cd "pfe front/real_estate_front"

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Chatbot integration complete."
    echo ""
    echo "🚀 To test the chatbot:"
    echo "1. Run: npm start"
    echo "2. Look for the purple chat button in bottom-left corner"
    echo "3. Try these commands:"
    echo "   - 'Show my notifications'"
    echo "   - 'Check pending payments'"
    echo "   - 'Leave a review'"
    echo "   - 'I need help'"
    echo ""
    echo "📖 Documentation:"
    echo "   - Integration README: CHATBOT_INTEGRATION_README.md"
    echo "   - Installation Guide: CHATBOT_INSTALLATION_GUIDE.md"
    echo "   - Implementation Summary: CHATBOT_IMPLEMENTATION_SUMMARY.md"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
