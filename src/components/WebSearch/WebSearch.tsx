import React, { useState } from 'react';
import { Search, Globe, ExternalLink, Settings, History, Trash2 } from 'lucide-react';
import { webSearchService, SearchResult, SearchOptions } from '../../services/WebSearchService';
import './WebSearch.css';

interface WebSearchProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const WebSearch: React.FC<WebSearchProps> = ({ isOpen, onToggle }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    source: 'all',
    maxResults: 10,
    includeCode: true,
  });
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isEnabled, setIsEnabled] = useState(webSearchService.isSearchEnabled());

  const handleSearch = async () => {
    if (!query.trim() || !isEnabled) return;

    setIsLoading(true);
    try {
      const searchResults = await webSearchService.search(query, searchOptions);
      setResults(searchResults);
      setSearchHistory(webSearchService.getSearchHistory());
    } catch (error) {
      console.error('Search failed:', error);
      alert(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleErrorSearch = async (errorMessage: string) => {
    if (!isEnabled) return;

    setQuery(errorMessage);
    setIsLoading(true);
    try {
      const searchResults = await webSearchService.searchError(errorMessage);
      setResults(searchResults);
      setSearchHistory(webSearchService.getSearchHistory());
    } catch (error) {
      console.error('Error search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    webSearchService.setEnabled(newEnabled);
  };

  const handleClearHistory = () => {
    webSearchService.clearHistory();
    setSearchHistory([]);
  };

  const openLink = (url: string) => {
    // In a real Tauri app, you'd use the shell plugin to open URLs
    window.open(url, '_blank');
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'stackoverflow': return '🟠';
      case 'github': return '🐙';
      case 'docs': return '📚';
      case 'web': return '🌐';
      default: return '🔍';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'stackoverflow': return '#f48024';
      case 'github': return '#333';
      case 'docs': return '#4CAF50';
      case 'web': return '#2196F3';
      default: return '#666';
    }
  };

  if (!isOpen) {
    return (
      <div className="web-search-toggle" onClick={onToggle}>
        <Globe size={20} />
        <span>Web Search</span>
      </div>
    );
  }

  return (
    <div className="web-search">
      <div className="web-search-header">
        <div className="header-title">
          <Globe size={18} />
          <span>Web Search</span>
          <div className="header-controls">
            <button
              className={`toggle-button ${isEnabled ? 'enabled' : 'disabled'}`}
              onClick={handleToggleEnabled}
              title={isEnabled ? 'Disable web search' : 'Enable web search'}
            >
              {isEnabled ? '🟢' : '🔴'}
            </button>
            <button
              className="settings-button"
              onClick={() => setShowSettings(!showSettings)}
              title="Search settings"
            >
              <Settings size={16} />
            </button>
            <button
              className="history-button"
              onClick={() => setShowHistory(!showHistory)}
              title="Search history"
            >
              <History size={16} />
            </button>
          </div>
        </div>
      </div>

      {!isEnabled && (
        <div className="disabled-notice">
          <p>Web search is disabled for privacy. Enable it to search the web for development help.</p>
          <button className="enable-button" onClick={handleToggleEnabled}>
            Enable Web Search
          </button>
        </div>
      )}

      {isEnabled && (
        <>
          {showSettings && (
            <div className="search-settings">
              <div className="setting-group">
                <label>Search Source:</label>
                <select
                  value={searchOptions.source}
                  onChange={(e) => setSearchOptions({
                    ...searchOptions,
                    source: e.target.value as any
                  })}
                >
                  <option value="all">All Sources</option>
                  <option value="stackoverflow">Stack Overflow</option>
                  <option value="github">GitHub</option>
                  <option value="docs">Documentation</option>
                  <option value="web">General Web</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>Max Results:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={searchOptions.maxResults}
                  onChange={(e) => setSearchOptions({
                    ...searchOptions,
                    maxResults: parseInt(e.target.value) || 10
                  })}
                />
              </div>
              
              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={searchOptions.includeCode}
                    onChange={(e) => setSearchOptions({
                      ...searchOptions,
                      includeCode: e.target.checked
                    })}
                  />
                  Include code examples
                </label>
              </div>
            </div>
          )}

          {showHistory && (
            <div className="search-history">
              <div className="history-header">
                <h4>Recent Searches</h4>
                <button className="clear-history-button" onClick={handleClearHistory}>
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
              
              {searchHistory.length === 0 ? (
                <div className="empty-history">No search history yet.</div>
              ) : (
                <div className="history-items">
                  {searchHistory.slice(-10).reverse().map((result, index) => (
                    <div key={index} className="history-item" onClick={() => setQuery(result.title)}>
                      <span className="source-icon">{getSourceIcon(result.source)}</span>
                      <span className="history-title">{result.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="search-input-section">
            <div className="search-input-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search for documentation, errors, code examples..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button
                className="search-button"
                onClick={handleSearch}
                disabled={!query.trim() || isLoading}
              >
                {isLoading ? '...' : 'Search'}
              </button>
            </div>

            <div className="quick-searches">
              <button onClick={() => handleErrorSearch('TypeError: Cannot read property')}>
                Common JS Error
              </button>
              <button onClick={() => handleErrorSearch('npm ERR!')}>
                NPM Errors
              </button>
              <button onClick={() => handleErrorSearch('React hooks rules')}>
                React Help
              </button>
            </div>
          </div>

          <div className="search-results">
            {results.length === 0 && !isLoading && (
              <div className="empty-results">
                {query ? 'No results found. Try different keywords.' : 'Enter a search query to get started.'}
              </div>
            )}

            {isLoading && (
              <div className="loading-results">
                <div className="loading-spinner"></div>
                <span>Searching the web...</span>
              </div>
            )}

            {results.map((result, index) => (
              <div key={index} className="search-result">
                <div className="result-header">
                  <div className="result-source" style={{ color: getSourceColor(result.source) }}>
                    <span className="source-icon">{getSourceIcon(result.source)}</span>
                    <span className="source-name">{result.source.toUpperCase()}</span>
                  </div>
                  <div className="result-score">
                    {result.relevanceScore && `${(result.relevanceScore * 100).toFixed(0)}%`}
                  </div>
                </div>
                
                <div className="result-title" onClick={() => openLink(result.url)}>
                  {result.title}
                  <ExternalLink size={14} />
                </div>
                
                <div className="result-snippet">
                  {result.snippet}
                </div>
                
                <div className="result-url">
                  {result.url}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
