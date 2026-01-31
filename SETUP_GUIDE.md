# Ollacode Setup Guide

## 🎯 What is Ollacode?

Ollacode is an AI-powered research assistant optimized for lightweight performance. It provides:
- **Deep reasoning** with transparent thinking chains
- **Web search integration** for real-time information
- **Smart memory** with persistent context
- **Multi-format file analysis**
- **Token optimization** to reduce resource usage

## 🖥️ System Requirements

- **GPU**: NVIDIA RTX 5070Ti (or similar with 16GB+ VRAM)
- **RAM**: 16GB minimum (32GB recommended)
- **OS**: Windows 10/11, macOS, or Linux
- **Ollama**: Version 0.1.0 or higher

## 📦 Installation

### 1. Install Ollama

Download and install Ollama from [https://ollama.ai](https://ollama.ai)

### 2. Pull a Lightweight Model

Open a terminal and run ONE of these commands:

**Recommended for multitasking (uses ~5GB VRAM):**
```bash
ollama pull qwen2.5:7b
```

**For best quality (uses ~9GB VRAM):**
```bash
ollama pull phi4:14b
```

**For transparent reasoning (uses ~5GB VRAM):**
```bash
ollama pull deepseek-r1:7b
```

### 3. Verify Ollama is Running

```bash
ollama list
```

You should see your pulled model in the list.

### 4. Start Ollacode

```bash
cd "C:\Users\Samarth Kadam\Ollacode"
pnpm dev
```

A Tauri desktop window will open with your AI assistant!

## 🚀 Usage

### Basic Chat
1. Type your question in the input box
2. Press Enter or click Send
3. The AI will respond with streaming output

### Enable Web Search
- Toggle the "Web Search" checkbox in the header
- Useful for queries like:
  - "What are the latest AI developments?"
  - "Search for information about quantum computing"
  - "Find recent news on climate change"

### File Analysis
1. Click the paperclip icon
2. Upload any file (PDF, TXT, DOCX, etc.)
3. Ask questions about the file content

### Memory System
- Your conversations are automatically saved
- Context is intelligently managed to avoid token bloat
- Important information is prioritized in memory

## ⚙️ Configuration

### Change Model

Edit [`src/components/chat/ChatInterface.tsx`](src/components/chat/ChatInterface.tsx#L20):

```typescript
const [currentModel, setCurrentModel] = useState('qwen2.5:7b');
```

Replace with your preferred model name.

### Adjust Memory Settings

Edit [`src/services/memory/MemoryManager.ts`](src/services/memory/MemoryManager.ts#L8):

```typescript
this.config = {
  maxRamChunks: 100,        // Number of chunks in RAM
  maxTokensPerChunk: 500,   // Tokens per chunk
  compressionThreshold: 0.7, // When to compress
  autoSaveInterval: 30000,  // Auto-save every 30s
  ...config
};
```

### Configure Web Search

#### Option 1: Free (SearXNG - default)
No configuration needed. Uses public instances.

#### Option 2: Premium (Tavily API)
1. Get API key from [https://tavily.com](https://tavily.com)
2. Edit [`src/components/chat/ChatInterface.tsx`](src/components/chat/ChatInterface.tsx):

```typescript
const webSearchService = useRef(new WebSearchService({
  tavilyApiKey: 'your-api-key-here'
}));
```

## 🎨 Model Recommendations

### For Multitasking (Recommended)
- **qwen2.5:7b** - Fast, efficient, leaves room for other apps
- VRAM: ~5GB
- RAM: ~8GB
- Speed: ⚡⚡⚡⚡

### For Best Quality
- **phi4:14b** - Microsoft's reasoning model
- VRAM: ~9GB
- RAM: ~12GB
- Speed: ⚡⚡⚡

### For Transparent Thinking
- **deepseek-r1:7b** - Shows reasoning steps
- VRAM: ~5GB
- RAM: ~8GB
- Speed: ⚡⚡⚡

### For Efficiency
- **llama3.2:8b** - Balanced performance
- VRAM: ~6GB
- RAM: ~9GB
- Speed: ⚡⚡⚡⚡

## 🔧 Troubleshooting

### "Model not found" error
```bash
# Pull the model first
ollama pull qwen2.5:7b
```

### "Ollama not running" error
```bash
# Start Ollama service
ollama serve
```

### Out of memory errors
1. Use a smaller model (qwen2.5:7b)
2. Reduce maxRamChunks in MemoryManager
3. Close other GPU-intensive apps

### Slow performance
1. Check other apps using GPU:
   ```bash
   nvidia-smi
   ```
2. Reduce temperature (faster but less creative):
   ```typescript
   ollamaService.current.updateConfig({ temperature: 0.3 });
   ```

### Web search not working
- Check internet connection
- Try enabling Tavily API key
- SearXNG instances may be rate-limited

## 📚 Advanced Features

### Token Optimization
The memory system automatically:
- Compresses old conversations
- Removes duplicate context
- Prioritizes important information
- Prunes low-value content

### Context Management
- Recent messages: Always kept
- Important messages: High priority
- Cited information: Preserved
- Generic responses: Compressed

### Persistence
- Memory saved every 30 seconds
- Auto-loads on restart
- Survives crashes
- Stored in localStorage

## 🛠️ Development

### Project Structure
```
src/
├── components/chat/     # Chat UI components
├── services/
│   ├── ai/             # Ollama integration
│   ├── memory/         # Memory management
│   └── search/         # Web search
└── types/              # TypeScript definitions
```

### Build for Production
```bash
pnpm build-tauri
```

### Run Tests
```bash
pnpm test
```

## 📝 Tips for Best Results

1. **Be specific** in your queries
2. **Use web search** for current information
3. **Upload files** for deep analysis
4. **Reference previous context** - the memory system will recall it
5. **Break complex tasks** into smaller questions

## 🔮 Upcoming Features

- [ ] Image generation integration
- [ ] Voice input/output
- [ ] Multiple concurrent models
- [ ] Plugin system for extensions
- [ ] Collaborative sessions
- [ ] Export conversations

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 💬 Support

Having issues? Check:
1. [GitHub Issues](https://github.com/IamSamk/Ollacode/issues)
2. [Discussions](https://github.com/IamSamk/Ollacode/discussions)
3. Documentation in `/docs`
