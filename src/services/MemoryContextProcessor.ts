/**
 * Memory Context Processor (MCP)
 * Advanced AI context management system for maintaining project awareness
 */

export interface ContextItem {
  id: string;
  type: 'file' | 'chat' | 'terminal' | 'selection' | 'error' | 'search';
  content: string;
  metadata: {
    timestamp: Date;
    filePath?: string;
    language?: string;
    relevanceScore?: number;
    pinned?: boolean;
    tags?: string[];
  };
}

export interface ProjectContext {
  sessionId: string;
  workspaceRoot?: string;
  openFiles: string[];
  activeFile?: string;
  recentCommands: string[];
  chatHistory: ContextItem[];
  pinnedItems: ContextItem[];
  projectIndex: Map<string, string[]>; // file -> symbols/functions
}

export class MemoryContextProcessor {
  private context: ProjectContext;
  private maxContextItems = 100;
  private maxTokenLimit = 4000; // Adjust based on model

  constructor(sessionId?: string) {
    this.context = {
      sessionId: sessionId || this.generateSessionId(),
      openFiles: [],
      recentCommands: [],
      chatHistory: [],
      pinnedItems: [],
      projectIndex: new Map(),
    };
  }

  /**
   * Add new context item to memory
   */
  addContext(item: Omit<ContextItem, 'id'>): string {
    const contextItem: ContextItem = {
      id: this.generateId(),
      ...item,
      metadata: {
        ...item.metadata,
        timestamp: new Date(),
        relevanceScore: item.metadata.relevanceScore || 1.0,
      },
    };

    this.context.chatHistory.push(contextItem);
    this.pruneContext();
    return contextItem.id;
  }

  /**
   * Pin/unpin context items for persistent inclusion
   */
  togglePin(itemId: string): boolean {
    const item = this.findContextItem(itemId);
    if (!item) return false;

    if (item.metadata.pinned) {
      item.metadata.pinned = false;
      this.context.pinnedItems = this.context.pinnedItems.filter(p => p.id !== itemId);
    } else {
      item.metadata.pinned = true;
      this.context.pinnedItems.push(item);
    }
    return true;
  }

  /**
   * Build context payload for LLM prompts
   */
  buildPromptContext(query: string, options?: {
    includeFiles?: boolean;
    includeChat?: boolean;
    includeTerminal?: boolean;
    maxTokens?: number;
  }): string {
    const opts = {
      includeFiles: true,
      includeChat: true,
      includeTerminal: true,
      maxTokens: this.maxTokenLimit,
      ...options,
    };

    let contextParts: string[] = [];

    // Always include pinned items
    if (this.context.pinnedItems.length > 0) {
      contextParts.push('## Pinned Context');
      this.context.pinnedItems.forEach(item => {
        contextParts.push(`[${item.type.toUpperCase()}] ${item.content}`);
      });
    }

    // Include current workspace info
    if (this.context.workspaceRoot) {
      contextParts.push(`## Current Workspace: ${this.context.workspaceRoot}`);
    }

    if (this.context.activeFile) {
      contextParts.push(`## Active File: ${this.context.activeFile}`);
    }

    // Include relevant context based on query
    const relevantItems = this.findRelevantContext(query, opts);
    if (relevantItems.length > 0) {
      contextParts.push('## Relevant Context');
      relevantItems.forEach(item => {
        contextParts.push(`[${item.type.toUpperCase()}] ${item.content}`);
      });
    }

    return this.truncateToTokenLimit(contextParts.join('\n\n'), opts.maxTokens);
  }

  /**
   * Update project index for better context retrieval
   */
  updateProjectIndex(filePath: string, symbols: string[]): void {
    this.context.projectIndex.set(filePath, symbols);
  }

  /**
   * Set current workspace and active file
   */
  updateWorkspaceContext(workspaceRoot?: string, activeFile?: string): void {
    this.context.workspaceRoot = workspaceRoot;
    this.context.activeFile = activeFile;
  }

  /**
   * Add file to open files list
   */
  addOpenFile(filePath: string): void {
    if (!this.context.openFiles.includes(filePath)) {
      this.context.openFiles.push(filePath);
    }
  }

  /**
   * Remove file from open files list
   */
  removeOpenFile(filePath: string): void {
    this.context.openFiles = this.context.openFiles.filter(f => f !== filePath);
  }

  /**
   * Get current context state for UI display
   */
  getContextState(): ProjectContext {
    return { ...this.context };
  }

  /**
   * Clear all context (new session)
   */
  clearContext(): void {
    this.context = {
      ...this.context,
      openFiles: [],
      recentCommands: [],
      chatHistory: [],
      pinnedItems: [],
      projectIndex: new Map(),
    };
  }

  /**
   * Export context for persistence
   */
  exportContext(): string {
    return JSON.stringify({
      ...this.context,
      projectIndex: Array.from(this.context.projectIndex.entries()),
    });
  }

  /**
   * Import context from persistence
   */
  importContext(contextData: string): boolean {
    try {
      const data = JSON.parse(contextData);
      this.context = {
        ...data,
        projectIndex: new Map(data.projectIndex || []),
      };
      return true;
    } catch (error) {
      console.error('Failed to import context:', error);
      return false;
    }
  }

  // Private methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private findContextItem(itemId: string): ContextItem | undefined {
    return this.context.chatHistory.find(item => item.id === itemId) ||
           this.context.pinnedItems.find(item => item.id === itemId);
  }

  private findRelevantContext(query: string, options: any): ContextItem[] {
    const queryLower = query.toLowerCase();
    let relevant = this.context.chatHistory
      .filter(item => {
        if (!options.includeFiles && item.type === 'file') return false;
        if (!options.includeChat && item.type === 'chat') return false;
        if (!options.includeTerminal && item.type === 'terminal') return false;
        
        return item.content.toLowerCase().includes(queryLower) ||
               item.metadata.tags?.some(tag => tag.toLowerCase().includes(queryLower));
      })
      .sort((a, b) => {
        const scoreA = a.metadata.relevanceScore || 0;
        const scoreB = b.metadata.relevanceScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, 10); // Limit to top 10 relevant items

    return relevant;
  }

  private pruneContext(): void {
    if (this.context.chatHistory.length > this.maxContextItems) {
      // Keep pinned items and recent items
      const pinnedIds = new Set(this.context.pinnedItems.map(p => p.id));
      const nonPinned = this.context.chatHistory.filter(item => !pinnedIds.has(item.id));
      
      if (nonPinned.length > this.maxContextItems - this.context.pinnedItems.length) {
        // Remove oldest non-pinned items
        const toKeep = this.maxContextItems - this.context.pinnedItems.length;
        this.context.chatHistory = [
          ...this.context.pinnedItems,
          ...nonPinned.slice(-toKeep)
        ];
      }
    }
  }

  private truncateToTokenLimit(content: string, maxTokens: number): string {
    // Simple token estimation (4 chars ≈ 1 token for English)
    const estimatedTokens = content.length / 4;
    if (estimatedTokens <= maxTokens) {
      return content;
    }

    const targetLength = maxTokens * 4;
    return content.substring(0, targetLength) + '\n\n[... context truncated ...]';
  }
}
