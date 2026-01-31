import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, StopCircle, Paperclip, Search } from 'lucide-react';
import { Message } from '../../types/chat.types';
import MessageBubble from './MessageBubble';
import OllamaService from '../../services/ai/OllamaService';
import MemoryManager from '../../services/memory/MemoryManager';
import WebSearchService from '../../services/search/WebSearchService';
import './ChatInterface.css';

interface ChatInterfaceProps {
  sessionId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState('qwen2.5:7b');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ollamaService = useRef(new OllamaService({ model: currentModel }));
  const memoryManager = useRef(new MemoryManager());
  const webSearchService = useRef(new WebSearchService());

  useEffect(() => {
    // Load previous messages from memory
    loadSession();
    loadAvailableModels();
    
    return () => {
      memoryManager.current.destroy();
    };
  }, []);

  const loadAvailableModels = async () => {
    try {
      const models = await ollamaService.current.listModels();
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(currentModel)) {
        setCurrentModel(models[0]);
        ollamaService.current.setModel(models[0]);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async () => {
    await memoryManager.current.loadFromDisk();
    // TODO: Load messages for this session
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Add user message to memory
      await memoryManager.current.addMessages([userMessage], sessionId);

      // Check if we need web search
      let searchContext = '';
      setSearchResults([]);
      if (enableWebSearch && shouldSearch(input)) {
        setIsSearching(true);
        const results = await webSearchService.current.search({
          query: input,
          maxResults: 5
        });
        setSearchResults(results);
        setIsSearching(false);
        
        searchContext = formatSearchResults(results);
      }

      // Get relevant memory context
      const memoryContext = await memoryManager.current.getRelevantContext(input, 1500);
      const contextStr = memoryContext.chunks.map(c => c.content).join('\n\n');

      // Build the prompt with context
      const systemMessage: Message = {
        id: 'system',
        role: 'system',
        content: `You are a helpful AI research assistant. Use the following context to inform your responses:

${contextStr ? `Previous context:\n${contextStr}\n\n` : ''}${searchContext ? `Web search results:\n${searchContext}\n\n` : ''}

Provide detailed, well-reasoned responses. Cite sources when using web search results.`
      };

      // Prepare messages for the model
      const chatMessages = [systemMessage, ...messages.slice(-5), userMessage]; // Keep last 5 messages

      // Stream the response
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        metadata: {
          model: currentModel,
          tokens: { prompt: 0, completion: 0, total: 0 }
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      await ollamaService.current.chat(
        chatMessages,
        (chunk) => {
          assistantMessage.content += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMessage };
            return updated;
          });
        },
        async (fullResponse) => {
          assistantMessage.content = fullResponse;
          await memoryManager.current.addMessages([assistantMessage], sessionId);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const shouldSearch = (query: string): boolean => {
    const searchKeywords = ['search', 'find', 'what is', 'who is', 'latest', 'current', 'today', 'news'];
    return searchKeywords.some(keyword => query.toLowerCase().includes(keyword));
  };

  const formatSearchResults = (results: any[]): string => {
    return results.map((r, i) => 
      `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`
    ).join('\n\n');
  };

  const handleStop = () => {
    ollamaService.current.abort();
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      let fileInfo = '';

      // Check if it's a Jupyter Notebook
      if (file.name.endsWith('.ipynb')) {
        try {
          const { parseNotebook, formatNotebookForChat, summarizeNotebook } = 
            await import('../../utils/notebookParser');
          
          const parsed = parseNotebook(content);
          
          if (parsed) {
            const summary = summarizeNotebook(parsed);
            const formattedContent = formatNotebookForChat(parsed, file.name);
            fileInfo = `${summary}\n\n${formattedContent}`;
          } else {
            fileInfo = `[File: ${file.name}]\n\n⚠️ Failed to parse notebook. Using raw content:\n\n${content.substring(0, 5000)}`;
          }
        } catch (error) {
          console.error('Error processing notebook:', error);
          fileInfo = `[File: ${file.name}]\n\n⚠️ Error reading notebook\n\n${content.substring(0, 5000)}`;
        }
      } else {
        // Regular text file
        fileInfo = `[File: ${file.name} (${file.type})]

${content.substring(0, 10000)}`;
      }

      setInput(prev => prev + '\n\n' + fileInfo);
    };
    reader.readAsText(file);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-info">
          <h2>AI Research Assistant</h2>
          <select 
            className="model-selector"
            value={currentModel}
            onChange={(e) => {
              setCurrentModel(e.target.value);
              ollamaService.current.setModel(e.target.value);
            }}
          >
            {availableModels.length === 0 ? (
              <option>Loading models...</option>
            ) : (
              availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))
            )}
          </select>
        </div>
        <div className="chat-controls">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={enableWebSearch}
              onChange={(e) => setEnableWebSearch(e.target.checked)}
            />
            <Search size={16} />
            Web Search
          </label>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>👋 Welcome to Ollacode</h3>
            <p>Your AI-powered research assistant with web search and deep reasoning.</p>
            <div className="suggestions">
              <button onClick={() => setInput('Explain quantum computing')}>
                Explain quantum computing
              </button>
              <button onClick={() => setInput('Search for latest AI developments')}>
                Latest AI developments
              </button>
              <button onClick={() => setInput('Analyze this concept: [paste text]')}>
                Analyze a concept
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          message.role !== 'system' && (
            <MessageBubble key={message.id} message={message} />
          )
        ))}

        {isSearching && (
          <div className="searching-indicator">
            <Loader2 className="spinning" size={20} />
            <span>Searching the web...</span>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="search-sources">
            <h4>🔍 Sources:</h4>
            <div className="sources-grid">
              {searchResults.map((result, index) => (
                <a 
                  key={index} 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="source-card"
                >
                  <div className="source-index">{index + 1}</div>
                  <div className="source-content">
                    <div className="source-title">{result.title}</div>
                    <div className="source-snippet">{result.snippet}</div>
                    <div className="source-url">{new URL(result.url).hostname}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-actions">
          <label className="action-btn" title="Attach file">
            <Paperclip size={20} />
            <input 
              type="file" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".txt,.md,.json,.csv,.log,.py,.js,.ts,.tsx,.jsx,.java,.cpp,.c,.h,.html,.css,.xml,.yaml,.yml,.ipynb"
            />
          </label>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask anything... (Shift+Enter for new line)"
          rows={1}
          disabled={isLoading}
        />

        <button
          className={`send-btn ${isLoading ? 'loading' : ''}`}
          onClick={isLoading ? handleStop : handleSend}
          disabled={!input.trim() && !isLoading}
        >
          {isLoading ? (
            <>
              <StopCircle size={20} />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
