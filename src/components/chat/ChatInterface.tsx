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
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ollamaService = useRef(new OllamaService({ model: currentModel }));
  const memoryManager = useRef(new MemoryManager());
  const webSearchService = useRef(new WebSearchService());

  useEffect(() => {
    // Load previous messages from memory
    loadSession();
    
    return () => {
      memoryManager.current.destroy();
    };
  }, []);

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
      if (enableWebSearch && shouldSearch(input)) {
        const searchResults = await webSearchService.current.search({
          query: input,
          maxResults: 3
        });
        
        searchContext = formatSearchResults(searchResults);
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

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-info">
          <h2>AI Research Assistant</h2>
          <span className="model-badge">{currentModel}</span>
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

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-actions">
          <button className="action-btn" title="Attach file">
            <Paperclip size={20} />
          </button>
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
