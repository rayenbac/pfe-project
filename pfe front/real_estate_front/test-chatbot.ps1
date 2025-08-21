# Chatbot Build & Test Script for Windows
Write-Host "🤖 Testing Chatbot Integration..." -ForegroundColor Cyan

# Navigate to the project directory
Set-Location "pfe front/real_estate_front"

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🔧 Building the project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful! Chatbot integration complete." -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 To test the chatbot:" -ForegroundColor Cyan
    Write-Host "1. Run: npm start" -ForegroundColor White
    Write-Host "2. Look for the purple chat button in bottom-left corner" -ForegroundColor White
    Write-Host "3. Try these commands:" -ForegroundColor White
    Write-Host "   - 'Show my notifications'" -ForegroundColor Gray
    Write-Host "   - 'Check pending payments'" -ForegroundColor Gray
    Write-Host "   - 'Leave a review'" -ForegroundColor Gray
    Write-Host "   - 'I need help'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📖 Documentation:" -ForegroundColor Cyan
    Write-Host "   - Integration README: CHATBOT_INTEGRATION_README.md" -ForegroundColor White
    Write-Host "   - Installation Guide: CHATBOT_INSTALLATION_GUIDE.md" -ForegroundColor White
    Write-Host "   - Implementation Summary: CHATBOT_IMPLEMENTATION_SUMMARY.md" -ForegroundColor White
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
