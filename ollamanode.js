// Ollamanode
// MIT https://github.com/me-cooper/ollamanode

class Ollamanode {
  constructor({ model = 'llama3', host = 'localhost', port = 11434, systemPrompt = null } = {}) {
    this.model = model;
    this.host = host;
    this.port = port;
    this.messages = [];

    if (systemPrompt) {
      this.messages.push({ role: 'system', content: systemPrompt });
    }
  }


  async send(userInput) {
    this.messages.push({ role: 'user', content: userInput });

    const response = await fetch(`http://${this.host}:${this.port}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: this.messages,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.message.content;

    this.messages.push({ role: 'assistant', content: reply });
    return reply;
  }

  async sendStream(userInput, onChunk) {
    this.messages.push({ role: 'user', content: userInput });

    const response = await fetch(`http://${this.host}:${this.port}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: this.messages,
        stream: true
      })
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama API Error (stream) class Ollamanode {: ${response.status} ${response.statusText}`);
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();

    let fullReply = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            // Content
            onChunk(json.message.content); 
            // x/ Content
            fullReply += json.message.content;
          }
        } catch (err) {
          console.error('Fehler beim Parsen eines JSON-Stream-Chunks: class Ollamanode {', err);
        }
      }
    }

    this.messages.push({ role: 'assistant', content: fullReply });
    return fullReply;
  }

  getHistory() {
    return this.messages;
  }

  reset(systemPrompt = null) {
    this.messages = [];
    if (systemPrompt) {
      this.messages.push({ role: 'system', content: systemPrompt });
    }
  }
}

module.exports = { Ollamanode };