import React from 'react';
import { Monitor, GitBranch, AlertCircle, Cpu, MessageSquare } from 'lucide-react';
import './StatusBar.css';

interface StatusBarProps {
  onToggleTerminal: () => void;
  onToggleChat: () => void;
  isTerminalVisible: boolean;
  isChatVisible: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  onToggleTerminal, 
  onToggleChat,
  isTerminalVisible,
  isChatVisible
}) => {
  return (
    <div className="status-bar">
      <div className="status-left">
        <div className="status-item">
          <GitBranch size={14} />
          <span>main</span>
        </div>
        <div className="status-item">
          <AlertCircle size={14} />
          <span>0 problems</span>
        </div>
      </div>
      
      <div className="status-center">
        <div className="status-item">
          <span>Ollacode v0.1.0</span>
        </div>
      </div>
      
      <div className="status-right">
        <div className="status-item">
          <Cpu size={14} />
          <span>TypeScript</span>
        </div>
        <button 
          className={`status-button ${isTerminalVisible ? 'active' : ''}`}
          onClick={onToggleTerminal}
          title="Toggle Terminal"
        >
          <Monitor size={14} />
          <span>Terminal</span>
        </button>
        <button 
          className={`status-button ${isChatVisible ? 'active' : ''}`}
          onClick={onToggleChat}
          title="Toggle AI Chat"
        >
          <MessageSquare size={14} />
          <span>AI Chat</span>
        </button>
      </div>
    </div>
  );
};
