const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

/**
 * In-memory data store for MVP.
 * Replace with Postgres/Redis in production.
 */
const db = {
  users: new Map(),
  conversations: new Map(),
  arenaBattles: new Map(),
  votes: new Map(),
};

const models = [
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'anthropic' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic' },
];

function nowIso() {
  return new Date().toISOString();
}

function getOrCreateUser(req) {
  const provided = req.headers['x-user-id'];
  const userId = provided || `anon_${crypto.randomUUID()}`;

  if (!db.users.has(userId)) {
    db.users.set(userId, {
      id: userId,
      createdAt: nowIso(),
      usage: {
        requests: 0,
        messages: 0,
        uploads: 0,
      },
    });
  }

  return db.users.get(userId);
}

function mockAssistantReply({ modelId, content }) {
  const suffix = [
    'Poniżej masz zwięzłą odpowiedź i plan wykonania.',
    'Mogę też rozpisać to na checklistę krok-po-kroku.',
    'Jeśli chcesz, wygeneruję wersję pod desktop i mobile.',
  ][Math.floor(Math.random() * 3)];

  return `Model: ${modelId}\n\nZrozumiałem: "${content}"\n\n${suffix}`;
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function requireConversation(conversationId, res) {
  const conversation = db.conversations.get(conversationId);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found.' });
    return null;
  }
  return conversation;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, now: nowIso() });
});

app.get('/api/models', (req, res) => {
  res.json({ models });
});

app.get('/api/me/usage', (req, res) => {
  const user = getOrCreateUser(req);
  res.setHeader('x-user-id', user.id);
  res.json({ userId: user.id, usage: user.usage });
});

app.post('/api/chat/create', (req, res) => {
  const user = getOrCreateUser(req);
  user.usage.requests += 1;

  const { title, modelId } = req.body || {};
  const selectedModel = models.find((m) => m.id === modelId) || models[0];

  const conversation = {
    id: `chat_${crypto.randomUUID()}`,
    userId: user.id,
    title: title || 'Nowa rozmowa',
    modelId: selectedModel.id,
    messages: [],
    memorySummary: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    deletedAt: null,
  };

  db.conversations.set(conversation.id, conversation);

  res.setHeader('x-user-id', user.id);
  res.status(201).json({ conversation });
});

app.get('/api/chat/list', (req, res) => {
  const user = getOrCreateUser(req);
  const conversations = [...db.conversations.values()]
    .filter((c) => c.userId === user.id && !c.deletedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.setHeader('x-user-id', user.id);
  res.json({ conversations });
});

app.get('/api/chat/:id', (req, res) => {
  const conversation = requireConversation(req.params.id, res);
  if (!conversation) return;
  res.json({ conversation });
});

app.post('/api/chat/:id/message', (req, res) => {
  const user = getOrCreateUser(req);
  user.usage.requests += 1;
  user.usage.messages += 1;

  const conversation = requireConversation(req.params.id, res);
  if (!conversation) return;

  const { content, attachments = [] } = req.body || {};
  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'Message content is required.' });
    return;
  }

  const userMessage = {
    id: `msg_${crypto.randomUUID()}`,
    role: 'user',
    content,
    attachments,
    createdAt: nowIso(),
  };

  const assistantMessage = {
    id: `msg_${crypto.randomUUID()}`,
    role: 'assistant',
    content: mockAssistantReply({ modelId: conversation.modelId, content }),
    createdAt: nowIso(),
  };

  conversation.messages.push(userMessage, assistantMessage);

  if (conversation.messages.length > 8) {
    const recentUserLines = conversation.messages
      .filter((m) => m.role === 'user')
      .slice(-4)
      .map((m) => `- ${m.content.slice(0, 80)}`)
      .join('\n');
    conversation.memorySummary = `Recent intent:\n${recentUserLines}`;
  }

  conversation.updatedAt = nowIso();

  res.setHeader('x-user-id', user.id);
  res.json({
    conversationId: conversation.id,
    messages: [userMessage, assistantMessage],
    memorySummary: conversation.memorySummary,
  });
});

app.delete('/api/chat/:id', (req, res) => {
  const conversation = requireConversation(req.params.id, res);
  if (!conversation) return;

  conversation.deletedAt = nowIso();
  conversation.updatedAt = nowIso();

  res.json({ ok: true, conversationId: conversation.id, deletedAt: conversation.deletedAt });
});

app.post('/api/upload', (req, res) => {
  const user = getOrCreateUser(req);
  user.usage.requests += 1;
  user.usage.uploads += 1;

  const { fileName, mimeType, base64Data } = req.body || {};
  if (!fileName || !mimeType || !base64Data) {
    res.status(400).json({ error: 'fileName, mimeType and base64Data are required.' });
    return;
  }

app.use(express.json());
app.use(express.static('.'));
  const safeName = sanitizeFileName(fileName);
  const id = `file_${crypto.randomUUID()}`;
  const ext = path.extname(safeName);
  const finalName = `${id}${ext}`;
  const finalPath = path.join(UPLOAD_DIR, finalName);

// Keep alive hack
setInterval(() => {
  require('https').get(`https://${process.env.CODESPACE_NAME}-3000.app.github.dev/ping`).on('error', () => {});
}, 240000);
  try {
    fs.writeFileSync(finalPath, Buffer.from(base64Data, 'base64'));
  } catch (error) {
    res.status(400).json({ error: `Failed to decode file: ${error.message}` });
    return;
  }

app.get('/ping', (req, res) => res.send('alive'));
  const url = `/uploads/${finalName}`;

  res.setHeader('x-user-id', user.id);
  res.status(201).json({
    id,
    fileName: safeName,
    mimeType,
    url,
    createdAt: nowIso(),
  });
});

app.post('/api/arena/start', (req, res) => {
  const user = getOrCreateUser(req);
  user.usage.requests += 1;

  const { prompt, leftModelId, rightModelId } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt is required.' });
    return;
  }

  const left = models.find((m) => m.id === leftModelId) || models[0];
  const right = models.find((m) => m.id === rightModelId) || models[1] || models[0];

  const battle = {
    id: `battle_${crypto.randomUUID()}`,
    userId: user.id,
    prompt,
    options: [
      {
        key: 'A',
        modelId: left.id,
        output: mockAssistantReply({ modelId: left.id, content: prompt }),
      },
      {
        key: 'B',
        modelId: right.id,
        output: mockAssistantReply({ modelId: right.id, content: prompt }),
      },
    ],
    createdAt: nowIso(),
  };

  db.arenaBattles.set(battle.id, battle);

  res.setHeader('x-user-id', user.id);
  res.status(201).json({ battle });
});

app.post('/api/arena/:id/vote', (req, res) => {
  const user = getOrCreateUser(req);
  user.usage.requests += 1;

  const battle = db.arenaBattles.get(req.params.id);
  if (!battle) {
    res.status(404).json({ error: 'Battle not found.' });
    return;
  }

  const { winnerKey } = req.body || {};
  if (!['A', 'B'].includes(winnerKey)) {
    res.status(400).json({ error: 'winnerKey must be A or B.' });
    return;
  }

  const vote = {
    id: `vote_${crypto.randomUUID()}`,
    battleId: battle.id,
    userId: user.id,
    winnerKey,
    createdAt: nowIso(),
  };

  db.votes.set(vote.id, vote);

  res.setHeader('x-user-id', user.id);
  res.status(201).json({ vote });
});

// Main interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
  res.send(`<!doctype html>
<html lang="pl">
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
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Arena + Chat MVP</title>
<style>
:root{--bg:#0b1020;--panel:#141a2e;--line:#2a3558;--text:#e8edff;--muted:#9bacd6;--accent:#5b8cff;--ok:#2bb673;}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,system-ui,Arial,sans-serif;background:linear-gradient(180deg,#0a0f1f,#0f1730);color:var(--text)}
.wrapper{max-width:1100px;margin:0 auto;padding:20px}
.grid{display:grid;grid-template-columns:280px 1fr;gap:16px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px}
h1{margin:0 0 8px;font-size:22px}.sub{color:var(--muted);margin:0 0 14px}
button{background:var(--accent);color:white;border:none;border-radius:10px;padding:10px 12px;cursor:pointer;font-weight:600}
button.secondary{background:#263357} button.ok{background:var(--ok)}
input,select,textarea{width:100%;background:#0f1730;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px}
label{font-size:12px;color:var(--muted)}
.chatbox{height:380px;overflow:auto;background:#0d1430;border:1px solid var(--line);border-radius:10px;padding:10px}
.msg{margin:8px 0;padding:8px 10px;border-radius:10px;white-space:pre-wrap}
.user{background:#1d2850}.assistant{background:#12203f}
.kv{font-size:12px;color:var(--muted);margin:8px 0}
.row{display:flex;gap:8px;flex-wrap:wrap}
.col{display:flex;flex-direction:column;gap:8px}
.arena{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.output{min-height:180px}
@media (max-width:900px){.grid{grid-template-columns:1fr}.arena{grid-template-columns:1fr}}
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
<div class="wrapper">
  <h1>⚔️ Arena + 💬 Chat MVP</h1>
  <p class="sub">Responsywny prototyp (desktop + mobile), z chatem, pamięcią, uploadem i battle mode.</p>

  <div class="grid">
    <section class="card col">
      <h3>Sesja</h3>
      <div class="kv">User ID: <span id="uid">(brak)</span></div>
      <div class="row">
        <button onclick="refreshUsage()">Odśwież usage</button>
        <button class="secondary" onclick="createChat()">Nowy chat</button>
      </div>
      <div class="kv" id="usage">Requests: 0, Msg: 0, Uploads: 0</div>

      <label>Wybierz rozmowę</label>
      <select id="chatSelect"></select>
      <div class="row">
        <button class="secondary" onclick="loadChat()">Wczytaj</button>
        <button class="secondary" onclick="deleteChat()">Usuń chat</button>
      </div>

      <label>Model</label>
      <select id="modelSelect"></select>
    </section>

    <section class="card col">
      <h3>Chat</h3>
      <div id="chatbox" class="chatbox"></div>
      <label>Wiadomość</label>
      <textarea id="prompt" rows="3" placeholder="Napisz wiadomość..."></textarea>
      <div class="row">
        <button class="ok" onclick="sendMessage()">Wyślij</button>
        <input id="fileInput" type="file" accept="image/*,video/*" />
      </div>
      <div class="kv" id="memory">Memory summary: (brak)</div>
    </section>
  </div>

  <section class="card col" style="margin-top:16px">
    <h3>Battle Mode</h3>
    <label>Prompt</label>
    <textarea id="arenaPrompt" rows="2" placeholder="Porównaj modele na tym samym pytaniu..."></textarea>
    <div class="row">
      <select id="leftModel"></select>
      <select id="rightModel"></select>
      <button onclick="startBattle()">Start battle</button>
    </div>
    <div class="arena">
      <div class="card output"><strong>Odpowiedź A</strong><pre id="outA"></pre><button onclick="vote('A')">Wybieram A</button></div>
      <div class="card output"><strong>Odpowiedź B</strong><pre id="outB"></pre><button onclick="vote('B')">Wybieram B</button></div>
    </div>
    <div class="kv" id="battleInfo">Brak aktywnej bitwy.</div>
  </section>
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
<script>
let userId = localStorage.getItem('mvp_user_id') || '';
let activeChatId = '';
let activeBattleId = '';
let pendingAttachment = null;

function headers() {
  const h = {'Content-Type': 'application/json'};
  if (userId) h['x-user-id'] = userId;
  return h;
}

async function api(path, method='GET', body) {
  const res = await fetch(path, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  const nextUserId = res.headers.get('x-user-id');
  if (nextUserId) {
    userId = nextUserId;
    localStorage.setItem('mvp_user_id', userId);
    document.getElementById('uid').textContent = userId;
  }
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

// Execute commands
app.post('/api/exec', (req, res) => {
  const { command } = req.body;
  exec(command, { cwd: process.cwd(), timeout: 30000 }, (err, stdout, stderr) => {
    res.json({ 
      output: stdout || stderr || (err ? err.message : 'Komenda wykonana'),
      error: err ? err.message : null
async function loadModels() {
  const { models } = await api('/api/models');
  const targets = ['modelSelect','leftModel','rightModel'];
  for (const id of targets) {
    const sel = document.getElementById(id);
    sel.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      sel.appendChild(opt);
    });
  }
  if (models[1]) document.getElementById('rightModel').value = models[1].id;
}

async function refreshUsage() {
  const data = await api('/api/me/usage');
  document.getElementById('usage').textContent = 'Requests: ' + data.usage.requests + ', Msg: ' + data.usage.messages + ', Uploads: ' + data.usage.uploads;
}

async function createChat() {
  const modelId = document.getElementById('modelSelect').value;
  const { conversation } = await api('/api/chat/create', 'POST', { title: 'Nowa rozmowa', modelId });
  activeChatId = conversation.id;
  await refreshChats();
  await loadChat();
}

async function refreshChats() {
  const { conversations } = await api('/api/chat/list');
  const sel = document.getElementById('chatSelect');
  sel.innerHTML = '';
  conversations.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.title + ' (' + new Date(c.updatedAt).toLocaleString() + ')';
    sel.appendChild(opt);
  });
  if (!activeChatId && conversations.length) activeChatId = conversations[0].id;
  if (activeChatId) sel.value = activeChatId;
}

function drawMessages(messages=[]) {
  const box = document.getElementById('chatbox');
  box.innerHTML = '';
  messages.forEach(m => {
    const div = document.createElement('div');
    div.className = 'msg ' + m.role;
    div.textContent = m.role.toUpperCase() + ':\\n' + m.content;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

async function loadChat() {
  activeChatId = document.getElementById('chatSelect').value || activeChatId;
  if (!activeChatId) return;
  const { conversation } = await api('/api/chat/' + activeChatId);
  drawMessages(conversation.messages);
  document.getElementById('memory').textContent = 'Memory summary: ' + (conversation.memorySummary || '(brak)');
}

async function deleteChat() {
  if (!activeChatId) return;
  await api('/api/chat/' + activeChatId, 'DELETE');
  activeChatId = '';
  drawMessages([]);
  await refreshChats();
}

async function uploadIfNeeded() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files?.[0];
  if (!file) return null;

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploaded = await api('/api/upload', 'POST', {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64Data: base64,
  });

  fileInput.value = '';
  return uploaded;
}

async function sendMessage() {
  if (!activeChatId) await createChat();
  const content = document.getElementById('prompt').value.trim();
  if (!content) return;

  pendingAttachment = await uploadIfNeeded();
  const attachments = pendingAttachment ? [pendingAttachment] : [];

  await api('/api/chat/' + activeChatId + '/message', 'POST', { content, attachments });
  document.getElementById('prompt').value = '';
  await loadChat();
  await refreshUsage();
  await refreshChats();
}

async function startBattle() {
  const prompt = document.getElementById('arenaPrompt').value.trim();
  if (!prompt) return;
  const leftModelId = document.getElementById('leftModel').value;
  const rightModelId = document.getElementById('rightModel').value;

  const { battle } = await api('/api/arena/start', 'POST', { prompt, leftModelId, rightModelId });
  activeBattleId = battle.id;
  document.getElementById('outA').textContent = battle.options[0].output;
  document.getElementById('outB').textContent = battle.options[1].output;
  document.getElementById('battleInfo').textContent = 'Battle: ' + battle.id;
  await refreshUsage();
}

async function vote(winnerKey) {
  if (!activeBattleId) return;
  const { vote } = await api('/api/arena/' + activeBattleId + '/vote', 'POST', { winnerKey });
  document.getElementById('battleInfo').textContent = 'Zapisano głos: ' + vote.winnerKey + ' @ ' + new Date(vote.createdAt).toLocaleString();
}

(async function init() {
  try {
    document.getElementById('uid').textContent = userId || '(anon)';
    await loadModels();
    await refreshUsage();
    await refreshChats();
    if (activeChatId) await loadChat();
  } catch (e) {
    alert('Błąd inicjalizacji: ' + e.message);
  }
})();
</script>
</body>
</html>`);
});

app.listen(3000, () => {
  console.log('🚀 Render Clone działa na porcie 3000');
  console.log('🌐 URL: https://' + process.env.CODESPACE_NAME + '-3000.app.github.dev');
app.listen(PORT, HOST, () => {
  const localUrl = `http://localhost:${PORT}`;
  const hostUrl = `http://${HOST}:${PORT}`;
  console.log(`🚀 Arena + Chat MVP działa.`);
  console.log(`🌐 Local: ${localUrl}`);
  if (HOST !== 'localhost') {
    console.log(`🧩 Bind: ${hostUrl}`);
  }
  if (HOST === '0.0.0.0') {
    console.log('ℹ️ Uwaga: 0.0.0.0 to adres bind serwera, w przeglądarce otwieraj http://localhost:' + PORT);
  }
});