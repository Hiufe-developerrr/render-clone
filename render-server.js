const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Keep alive hack
setInterval(() => {
  require('https').get(`https://${process.env.CODESPACE_NAME}-3000.app.github.dev/ping`).on('error', () => {});
}, 240000);

app.get('/ping', (req, res) => res.send('alive'));

// Main interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🚀 GitHub Render Clone</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0d1117; color: #f0f6fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; margin: 15px 0; }
        button { background: #238636; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; margin: 5px; font-size: 14px; }
        button:hover { background: #2ea043; }
        .terminal-btn { background: #1f6feb; }
        .terminal-btn:hover { background: #388bfd; }
        input, textarea { background: #0d1117; border: 1px solid #30363d; color: #f0f6fc; padding: 8px; border-radius: 4px; width: 100%; margin: 5px 0; }
        .output { background: #0d1117; border: 1px solid #30363d; padding: 15px; border-radius: 6px; font-family: monospace; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
        .success { color: #3fb950; }
        .error { color: #f85149; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 GitHub Render Clone</h1>
            <p>Darmowy VPS z terminalem - działa 24/7</p>
        </div>
        
        <div class="card">
            <h3>🖥️ Terminal Access</h3>
            <button class="terminal-btn" onclick="openTerminal()">Otwórz Terminal</button>
            <button onclick="getInfo()">📊 Info Systemu</button>
        </div>
        
        <div class="card">
            <h3>🤖 Bot Management</h3>
            <button onclick="runCmd('pm2 status')">Status Botów</button>
            <button onclick="runCmd('pm2 logs --lines 20')">Logi</button>
            <button onclick="startBot()">▶️ Start Bot</button>
            <button onclick="runCmd('pm2 restart all')">🔄 Restart</button>
        </div>
        
        <div class="card">
            <h3>📁 File Manager</h3>
            <button onclick="runCmd('ls -la')">Lista Plików</button>
            <button onclick="runCmd('pwd')">Aktualny Folder</button>
            <button onclick="runCmd('df -h')">Miejsce na Dysku</button>
        </div>
        
        <div class="card">
            <h3>⚡ Quick Commands</h3>
            <input type="text" id="customCmd" placeholder="Wpisz komendę..." onkeypress="if(event.key==='Enter') runCustomCmd()">
            <button onclick="runCustomCmd()">Wykonaj</button>
        </div>
        
        <div class="card">
            <h3>📤 Output</h3>
            <div id="output" class="output">Gotowy do pracy...</div>
        </div>
    </div>

    <script>
        function openTerminal() {
            window.open('https://${process.env.CODESPACE_NAME}-3001.app.github.dev', '_blank');
        }
        
        async function runCmd(cmd) {
            document.getElementById('output').innerHTML = '<span class="success">Wykonywanie: ' + cmd + '</span>';
            try {
                const response = await fetch('/api/exec', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({command: cmd})
                });
                const data = await response.json();
                document.getElementById('output').innerHTML = data.output || data.error || 'Brak wyniku';
            } catch (err) {
                document.getElementById('output').innerHTML = '<span class="error">Błąd: ' + err.message + '</span>';
            }
        }
        
        function runCustomCmd() {
            const cmd = document.getElementById('customCmd').value;
            if (cmd) runCmd(cmd);
        }
        
        function getInfo() {
            runCmd('echo "=== SYSTEM INFO ===" && uname -a && echo "\\n=== MEMORY ===" && free -h && echo "\\n=== DISK ===" && df -h && echo "\\n=== UPTIME ===" && uptime');
        }
        
        function startBot() {
            runCmd('cd /workspaces/*/nex-streaming 2>/dev/null || cd ~ && git clone https://github.com/Hiufe-developerrr/nex-streaming.git && cd nex-streaming && npm install && pm2 start discord-bot.js --name kick-bot');
        }
    </script>
</body>
</html>
  `);
});

// Execute commands
app.post('/api/exec', (req, res) => {
  const { command } = req.body;
  exec(command, { cwd: process.cwd(), timeout: 30000 }, (err, stdout, stderr) => {
    res.json({ 
      output: stdout || stderr || (err ? err.message : 'Komenda wykonana'),
      error: err ? err.message : null
    });
  });
});

app.listen(3000, () => {
  console.log('🚀 Render Clone działa na porcie 3000');
  console.log('🌐 URL: https://' + process.env.CODESPACE_NAME + '-3000.app.github.dev');
});
