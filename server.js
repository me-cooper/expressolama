
const path              = require('path');


/* ############################################################################################## */
/*                                            Settings                                            */
/* ############################################################################################## */

const choosenModel      = "llama3";
const sysPrompt         = 'You are a personal assistant!';

const PORT              = 3000;
const publicPath        = path.join(__dirname, 'public');
const viewsPath         = path.join(__dirname, 'views');


const http              = require('http');
const WebSocket         = require('ws');

const { Ollamanode }    = require('./ollamanode');

const express           = require('express');
const   app             = express();
        app             .use(express.static(publicPath));


const server            = http.createServer(app);
const wsserver          = new WebSocket.Server({ server });





        


app.get('/', (req, res) => {
  res.sendFile(path.join(viewsPath, 'index.html'));
});


wsserver.on('connection', (wsserver) => {
  console.log('🔌 WebSocket-Client verbunden');

  const session = new Ollamanode({
    model: choosenModel,
    systemPrompt: sysPrompt
  });

  wsserver.on('message', async (msg) => {
    const userInput = msg.toString();
    console.log('📨 Eingabe:', userInput);

    try {
      await session.sendStream(userInput, (chunk) => {
        wsserver.send(JSON.stringify({ type: 'chunk', data: chunk }));
      });
      wsserver.send(JSON.stringify({ type: 'done' }));
    } catch (err) {
      wsserver.send(JSON.stringify({ type: 'error', error: err.message }));
    }
  });

  wsserver.on('close', () => {

    console.log('❌ Client getrennt');
  });
});


server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});