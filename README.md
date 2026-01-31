# Ollacode - AI Research Assistant 🤖

> A lightweight, GPU-friendly AI-powered research assistant with web search, smart memory, and deep reasoning capabilities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-2.7.0-24c8db.svg)
![React](https://img.shields.io/badge/React-19.1.0-61dafb.svg)

## ✨ Features

- 🧠 **Deep Reasoning** - Transparent thinking with lightweight models
- 🔍 **Web Search Integration** - Real-time information retrieval
- 💾 **Smart Memory** - Intelligent context management with disk persistence
- 📁 **Multi-format Files** - Analyze any file type
- ⚡ **Token Optimized** - Efficient resource usage for multitasking
- 🎯 **GPU Friendly** - Runs on RTX 5070Ti without monopolizing resources

## 🚀 Quick Start

### Prerequisites

- [Ollama](https://ollama.ai) installed and running
- Node.js 18+ and pnpm
- NVIDIA GPU with 12GB+ VRAM (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/IamSamk/Ollacode.git
cd Ollacode

# Install dependencies
pnpm install

# Pull a lightweight AI model
ollama pull qwen2.5:7b

# Start the application
pnpm dev
```

The Tauri desktop window will open with your AI assistant ready!

## 📖 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed installation and configuration
- [Architecture](ARCHITECTURE.md) - Project structure and design decisions
- [Token Optimization](TOKEN_OPTIMIZATION.md) - How we manage context efficiently

## 🎯 Recommended Models

| Model | VRAM | Use Case | Speed |
|-------|------|----------|-------|
| **qwen2.5:7b** | ~5GB | Best for multitasking | ⚡⚡⚡⚡ |
| **phi4:14b** | ~9GB | Highest quality | ⚡⚡⚡ |
| **deepseek-r1:7b** | ~5GB | Transparent reasoning | ⚡⚡⚡ |
| **llama3.2:8b** | ~6GB | Balanced | ⚡⚡⚡⚡ |

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Desktop**: Tauri 2.7
- **AI**: Ollama (local inference)
- **Search**: Tavily API / SearXNG
- **Memory**: Custom chunking + localStorage persistence

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
