import React, { useState, useEffect } from 'react';
import { Brain, Pin, Search, Trash2, Eye, EyeOff, Clock, Tag } from 'lucide-react';
import { MemoryContextProcessor, ContextItem } from '../../services/MemoryContextProcessor';
import './MemoryInspector.css';

interface MemoryInspectorProps {
  mcp: MemoryContextProcessor;
  isOpen: boolean;
  onToggle: () => void;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({ mcp, isOpen, onToggle }) => {
  const [contextState, setContextState] = useState(mcp.getContextState());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setContextState(mcp.getContextState());
    }, 1000);

    return () => clearInterval(interval);
  }, [mcp]);

  const filteredItems = contextState.chatHistory.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.metadata.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handleTogglePin = (itemId: string) => {
    mcp.togglePin(itemId);
    setContextState(mcp.getContextState());
  };

  const handleClearContext = () => {
    if (window.confirm('Are you sure you want to clear all context? This cannot be undone.')) {
      mcp.clearContext();
      setContextState(mcp.getContextState());
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file': return '📄';
      case 'chat': return '💬';
      case 'terminal': return '💻';
      case 'selection': return '✂️';
      case 'error': return '❌';
      case 'search': return '🔍';
      default: return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'file': return '#4CAF50';
      case 'chat': return '#2196F3';
      case 'terminal': return '#FF9800';
      case 'selection': return '#9C27B0';
      case 'error': return '#F44336';
      case 'search': return '#607D8B';
      default: return '#666';
    }
  };

  if (!isOpen) {
    return (
      <div className="memory-inspector-toggle" onClick={onToggle}>
        <Brain size={20} />
        <span>Memory</span>
      </div>
    );
  }

  return (
    <div className="memory-inspector">
      <div className="memory-inspector-header">
        <div className="header-title">
          <Brain size={18} />
          <span>Memory Inspector</span>
          <button className="close-button" onClick={onToggle}>
            <EyeOff size={16} />
          </button>
        </div>
        
        <div className="memory-stats">
          <span>Session: {contextState.sessionId.split('_')[1]}</span>
          <span>Items: {contextState.chatHistory.length}</span>
          <span>Pinned: {contextState.pinnedItems.length}</span>
        </div>
      </div>

      <div className="memory-inspector-controls">
        <div className="search-container">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search context..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="type-filter"
          >
            <option value="all">All Types</option>
            <option value="file">Files</option>
            <option value="chat">Chat</option>
            <option value="terminal">Terminal</option>
            <option value="selection">Selections</option>
            <option value="error">Errors</option>
            <option value="search">Searches</option>
          </select>

          <button 
            className="clear-button"
            onClick={handleClearContext}
            title="Clear all context"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="workspace-info">
        {contextState.workspaceRoot && (
          <div className="workspace-item">
            <strong>Workspace:</strong> {contextState.workspaceRoot.split(/[/\\]/).pop()}
          </div>
        )}
        {contextState.activeFile && (
          <div className="workspace-item">
            <strong>Active File:</strong> {contextState.activeFile.split(/[/\\]/).pop()}
          </div>
        )}
        {contextState.openFiles.length > 0 && (
          <div className="workspace-item">
            <strong>Open Files:</strong> {contextState.openFiles.length}
          </div>
        )}
      </div>

      <div className="context-items">
        {contextState.pinnedItems.length > 0 && (
          <div className="pinned-section">
            <h4>📌 Pinned Items</h4>
            {contextState.pinnedItems.map(item => (
              <ContextItemComponent
                key={item.id}
                item={item}
                isPinned={true}
                onTogglePin={handleTogglePin}
                showDetails={showDetails === item.id}
                onToggleDetails={(id) => setShowDetails(showDetails === id ? null : id)}
                getTypeIcon={getTypeIcon}
                getTypeColor={getTypeColor}
                formatTimestamp={formatTimestamp}
              />
            ))}
          </div>
        )}

        <div className="recent-section">
          <h4>🕒 Recent Context ({filteredItems.length})</h4>
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              No context items match your filters.
            </div>
          ) : (
            filteredItems.map(item => (
              <ContextItemComponent
                key={item.id}
                item={item}
                isPinned={item.metadata.pinned || false}
                onTogglePin={handleTogglePin}
                showDetails={showDetails === item.id}
                onToggleDetails={(id) => setShowDetails(showDetails === id ? null : id)}
                getTypeIcon={getTypeIcon}
                getTypeColor={getTypeColor}
                formatTimestamp={formatTimestamp}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface ContextItemComponentProps {
  item: ContextItem;
  isPinned: boolean;
  onTogglePin: (id: string) => void;
  showDetails: boolean;
  onToggleDetails: (id: string) => void;
  getTypeIcon: (type: string) => string;
  getTypeColor: (type: string) => string;
  formatTimestamp: (timestamp: Date) => string;
}

const ContextItemComponent: React.FC<ContextItemComponentProps> = ({
  item,
  isPinned,
  onTogglePin,
  showDetails,
  onToggleDetails,
  getTypeIcon,
  getTypeColor,
  formatTimestamp,
}) => {
  return (
    <div className={`context-item ${isPinned ? 'pinned' : ''}`}>
      <div className="context-item-header" onClick={() => onToggleDetails(item.id)}>
        <div className="item-type" style={{ color: getTypeColor(item.type) }}>
          <span className="type-icon">{getTypeIcon(item.type)}</span>
          <span className="type-label">{item.type.toUpperCase()}</span>
        </div>
        
        <div className="item-actions">
          <span className="timestamp">
            <Clock size={12} />
            {formatTimestamp(item.metadata.timestamp)}
          </span>
          <button
            className={`pin-button ${isPinned ? 'pinned' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(item.id);
            }}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={14} />
          </button>
          <button className="details-button" title="Toggle details">
            <Eye size={14} />
          </button>
        </div>
      </div>

      <div className="item-content-preview">
        {item.content.length > 100 
          ? `${item.content.substring(0, 100)}...`
          : item.content
        }
      </div>

      {showDetails && (
        <div className="item-details">
          <div className="full-content">
            <pre>{item.content}</pre>
          </div>
          
          {item.metadata.filePath && (
            <div className="metadata-item">
              <strong>File:</strong> {item.metadata.filePath}
            </div>
          )}
          
          {item.metadata.language && (
            <div className="metadata-item">
              <strong>Language:</strong> {item.metadata.language}
            </div>
          )}
          
          {item.metadata.relevanceScore && (
            <div className="metadata-item">
              <strong>Relevance:</strong> {item.metadata.relevanceScore.toFixed(2)}
            </div>
          )}
          
          {item.metadata.tags && item.metadata.tags.length > 0 && (
            <div className="metadata-item">
              <strong>Tags:</strong>
              <div className="tags">
                {item.metadata.tags.map(tag => (
                  <span key={tag} className="tag">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
