# Ollacode - AI Research Assistant Architecture

## Project Overview
A lightweight AI-powered research assistant optimized for RTX 5070Ti that provides deep reasoning, web search, file analysis, and persistent memory - without monopolizing system resources.

## Technology Stack
- **Frontend**: React + TypeScript + Vite + Tauri
- **AI Backend**: Ollama with lightweight models
- **Memory**: Incremental RAM loading + disk persistence
- **Search**: Tavily API / SearXNG for web scraping
- **Token Optimization**: LiteLLM / custom context compression

## Recommended Models (GPU-Friendly)
1. **Qwen2.5:7b** - 4GB VRAM, fast inference, good reasoning
2. **Phi-4:14b** - 8GB VRAM, Microsoft's reasoning model
3. **DeepSeek-R1:7b** - 4GB VRAM, transparent thinking chains
4. **Llama3.2:8b** - 5GB VRAM, efficient, good quality

## Directory Structure
```
src/
├── core/                   # Core application logic
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
│
├── components/
│   ├── chat/              # Main chat interface
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ReasoningChain.tsx
│   │   └── CitationCard.tsx
│   │
│   ├── context/           # Context & memory UI
│   │   ├── ContextPanel.tsx
│   │   ├── MemoryViewer.tsx
│   │   └── FileAnalyzer.tsx
│   │
│   ├── search/            # Web search components
│   │   ├── SearchBar.tsx
│   │   ├── SearchResults.tsx
│   │   └── SourceCard.tsx
│   │
│   └── layout/            # Layout components
│       ├── MainLayout.tsx
│       ├── Header.tsx
│       └── StatusBar.tsx
│
├── services/
│   ├── ai/
│   │   ├── OllamaService.ts       # Ollama API integration
│   │   ├── ModelManager.ts        # Model selection & loading
│   │   └── TokenOptimizer.ts      # Context compression
│   │
│   ├── memory/
│   │   ├── MemoryManager.ts       # RAM/disk memory handling
│   │   ├── ContextBuilder.ts      # Context assembly
│   │   └── SemanticCache.ts       # Deduplication
│   │
│   ├── search/
│   │   ├── WebSearchService.ts    # Web search orchestration
│   │   ├── TavilyClient.ts        # Tavily API client
│   │   └── ScraperService.ts      # Content extraction
│   │
│   └── files/
│       ├── FileProcessor.ts       # Multi-format file handling
│       └── ContentExtractor.ts    # Text/metadata extraction
│
├── utils/
│   ├── api.ts             # API utilities
│   ├── storage.ts         # LocalStorage/Tauri FS wrapper
│   └── logger.ts          # Debug logging
│
└── types/
    ├── chat.types.ts
    ├── memory.types.ts
    └── search.types.ts
```

## Key Features

### 1. Smart Memory System
- **Incremental Loading**: Load memory chunks as needed
- **Disk Persistence**: Auto-save on close, restore on open
- **Semantic Chunking**: Store meaningful context units
- **Rolling Window**: Keep recent + important context

### 2. Deep Web Search
- **Real-time Integration**: Every query can trigger web search
- **Multi-source**: Aggregate from multiple search APIs
- **Citation Tracking**: Inline source attribution
- **Content Extraction**: Clean, readable scraped content

### 3. Token Optimization
- **Context Compression**: Summarize old conversations
- **Semantic Deduplication**: Remove redundant context
- **Smart Pruning**: Keep important context, drop filler
- **Lazy Loading**: Load context only when needed

### 4. Resource Management
- **Async Model Loading**: Non-blocking inference
- **GPU Sharing**: Allow other apps to use GPU
- **Adaptive Batch Size**: Adjust based on available VRAM
- **Background Processing**: Long tasks don't block UI

## Development Phases

### Phase 1: Core Chat Interface ✓ Next
- Clean main layout
- Chat message components
- Ollama integration with lightweight models
- Basic file upload

### Phase 2: Memory System
- Memory service implementation
- Context persistence
- Token optimization

### Phase 3: Web Search
- Tavily API integration
- Content scraping
- Citation system

### Phase 4: Advanced Features
- Multi-modal file analysis
- Reasoning chain visualization
- Context graph viewer
