const thisHost  = location.protocol + '//' + location.host;
const thisWS    = 'ws//:' + location.host

const ws        = new WebSocket(thisWS);

const chat      = document.getElementById('chat');
const form      = document.getElementById('chat-form');
const input     = document.getElementById('userInput');

let currentBotMessage   = null;
let currentBotMarkdown  = '';



/* ############################################################################################## */
/*                                   Markdown-Renderer Settings                                   */
/* ############################################################################################## */
marked.use({
  breaks:         true,
  useNewRenderer: true,
  renderer: {
    link({ tokens, href, text }) {
      return `<a target="_blank" href="${href}">${text}</a>`;
    }
  },
});


function resetTextarea() {
  input.value        = '';
  input.style.height = 'auto';
}

ws.onmessage = (event) => {

  const msg = JSON.parse(event.data);

  if (msg.type === 'chunk') {
    if (!currentBotMessage) {
      currentBotMessage = document.createElement('div');
      currentBotMessage.classList.add('chat-message', 'bot');
      chat.appendChild(currentBotMessage);
    }

    currentBotMarkdown            += msg.data;
    currentBotMessage.innerHTML   = marked.parse(currentBotMarkdown);
    wrapTablesInDiv(currentBotMessage);
    chat.scrollTop = chat.scrollHeight;
  }

  if (msg.type === 'done') {
    currentBotMessage = null;
    currentBotMarkdown = '';
  }

  if (msg.type === 'error') {
    const err = document.createElement('div');
    err.classList.add('chat-message', 'bot');
    err.textContent = '⚠️ Fehler: ' + msg.error;
    chat.appendChild(err);
    currentBotMessage = null;
    currentBotMarkdown = '';
  }
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const userMsg = document.createElement('div');
  userMsg.classList.add('chat-message', 'user');
  userMsg.textContent = text;
  chat.appendChild(userMsg);
  chat.scrollTop = chat.scrollHeight;

  ws.send(text);
  resetTextarea();
});





// Enter sendet, Shift+Enter macht eine neue Zeile
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});



/* ############################################################################################## */
/*                                             Helper                                             */
/* ############################################################################################## */

/* ############################################################################################## */
/*                                    "Parse" Markdown Tables                                     */
/* ############################################################################################## */
// Workaround
function wrapTablesInDiv(container) {
  container.querySelectorAll('table').forEach(table => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}



/* ############################################################################################## */
/*                                           User-Input                                           */
/* ############################################################################################## */

// Autoscroll
const textarea = document.getElementById('userInput');
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
});