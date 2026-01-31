import React from 'react';
import { Message } from '../../types/chat.types';
import { User, Bot, Copy, Check } from 'lucide-react';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (content: string) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          const lang = match[1] || 'plaintext';
          const code = match[2];
          return (
            <div key={index} className="code-block">
              <div className="code-header">
                <span className="code-lang">{lang}</span>
                <button className="copy-code" onClick={() => {
                  navigator.clipboard.writeText(code);
                }}>
                  Copy Code
                </button>
              </div>
              <pre><code className={`language-${lang}`}>{code}</code></pre>
            </div>
          );
        }
      }
      
      // Format inline code and bold/italic
      return (
        <div key={index} className="text-content">
          {part.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/).map((segment, i) => {
            if (segment.startsWith('`') && segment.endsWith('`')) {
              return <code key={i} className="inline-code">{segment.slice(1, -1)}</code>;
            }
            if (segment.startsWith('**') && segment.endsWith('**')) {
              return <strong key={i}>{segment.slice(2, -2)}</strong>;
            }
            if (segment.startsWith('*') && segment.endsWith('*')) {
              return <em key={i}>{segment.slice(1, -1)}</em>;
            }
            return <span key={i}>{segment}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-avatar">
        {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="message-role">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </span>
          <span className="message-time">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        
        <div className="message-text">
          {formatContent(message.content)}
        </div>

        {message.metadata?.citations && message.metadata.citations.length > 0 && (
          <div className="message-citations">
            <h4>Sources:</h4>
            {message.metadata.citations.map((citation, index) => (
              <a
                key={index}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="citation-link"
              >
                [{index + 1}] {citation.title}
              </a>
            ))}
          </div>
        )}

        <div className="message-actions">
          <button className="action-btn" onClick={handleCopy} title="Copy message">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
