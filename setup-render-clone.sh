#!/bin/bash
# Auto setup in codespace
echo "🚀 Setting up GitHub Render Clone..."

# Install dependencies
npm install
npm install -g pm2 wetty

# Keep codespace alive (ping every 4 min)
(crontab -l 2>/dev/null; echo "*/4 * * * * curl -s https://$CODESPACE_NAME-3000.app.github.dev/ping > /dev/null") | crontab -

# Start web terminal
wetty --port 3001 --host 0.0.0.0 &

# Start render clone server
pm2 start render-server.js --name render-clone
pm2 startup
pm2 save

echo "✅ GitHub Render Clone ready!"
echo "🌐 Main Interface: https://$CODESPACE_NAME-3000.app.github.dev"
echo "🖥️ Web Terminal: https://$CODESPACE_NAME-3001.app.github.dev"
echo "📱 Mobile friendly - works on phone!"
