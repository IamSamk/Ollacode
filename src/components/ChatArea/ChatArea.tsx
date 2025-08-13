import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Settings, Zap } from 'lucide-react';
import './ChatArea.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface OllamaModel {
  name: string;
  size: string;
  modified: string;
}

export const ChatArea: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isOllamaConnected, setIsOllamaConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check Ollama connection on component mount
  useEffect(() => {
    checkOllamaConnection();
    loadAvailableModels();
  }, []);

  const checkOllamaConnection = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      setIsOllamaConnected(response.ok);
    } catch (error) {
      setIsOllamaConnected(false);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
        if (data.models && data.models.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedModel) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: inputMessage,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response from Ollama');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Could not connect to Ollama. Please ensure Ollama is running.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-title">
          <Bot size={16} />
          <span>AI Assistant</span>
          <div className={`connection-status ${isOllamaConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isOllamaConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="chat-controls">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-selector"
            disabled={!isOllamaConnected}
          >
            <option value="">Select Model</option>
            {availableModels.map(model => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
          <button className="chat-action-button" title="Refresh Models" onClick={loadAvailableModels}>
            <Zap size={14} />
          </button>
          <button className="chat-action-button" title="Settings">
            <Settings size={14} />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <Bot size={48} />
            <h3>Welcome to Ollacode AI Assistant</h3>
            <p>
              {isOllamaConnected 
                ? `Connected to Ollama. Select a model and start chatting!`
                : 'Please start Ollama and ensure it\'s running on port 11434'
              }
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-icon">
                {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant">
            <div className="message-icon">
              <Bot size={16} />
            </div>
            <div className="message-content">
              <div className="message-text typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={selectedModel ? "Ask me anything..." : "Please select a model first"}
          className="chat-input"
          rows={1}
          disabled={!isOllamaConnected || !selectedModel}
        />
        <button 
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading || !selectedModel}
          className="send-button"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
