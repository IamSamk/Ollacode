import { MemoryChunk, MemoryContext, MemoryStats, MemoryConfig } from '../../types/memory.types';
import { Message } from '../../types/chat.types';

class MemoryManager {
  private ramChunks: Map<string, MemoryChunk> = new Map();
  private config: MemoryConfig;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxRamChunks: 100, // Keep up to 100 chunks in RAM
      maxTokensPerChunk: 500,
      compressionThreshold: 0.7,
      persistencePath: 'memory/sessions',
      autoSaveInterval: 30000, // 30 seconds
      ...config
    };

    this.startAutoSave();
  }

  // Convert messages to memory chunks
  async addMessages(messages: Message[], sessionId: string): Promise<void> {
    for (const message of messages) {
      const chunk: MemoryChunk = {
        id: `${sessionId}-${message.id}`,
        content: message.content,
        metadata: {
          source: 'chat',
          timestamp: message.timestamp,
          sessionId,
          tags: this.extractTags(message.content)
        },
        importance: this.calculateImportance(message),
        accessCount: 0,
        lastAccessed: new Date()
      };

      this.ramChunks.set(chunk.id, chunk);
    }

    // Trim if over limit
    await this.trimRamChunks();
  }

  // Extract relevant context for a query
  async getRelevantContext(query: string, maxTokens: number = 2000): Promise<MemoryContext> {
    const relevantChunks: MemoryChunk[] = [];
    let totalTokens = 0;

    // Sort by relevance and importance
    const rankedChunks = Array.from(this.ramChunks.values())
      .map(chunk => ({
        chunk,
        score: this.calculateRelevance(query, chunk)
      }))
      .sort((a, b) => b.score - a.score);

    // Select top chunks within token limit
    for (const { chunk } of rankedChunks) {
      const chunkTokens = this.estimateTokens(chunk.content);
      if (totalTokens + chunkTokens <= maxTokens) {
        relevantChunks.push(chunk);
        totalTokens += chunkTokens;
        
        // Update access stats
        chunk.accessCount++;
        chunk.lastAccessed = new Date();
      }
    }

    return {
      chunks: relevantChunks,
      totalTokens,
      maxTokens,
      compressionRatio: relevantChunks.length / this.ramChunks.size
    };
  }

  // Calculate relevance score between query and chunk
  private calculateRelevance(query: string, chunk: MemoryChunk): number {
    const queryLower = query.toLowerCase();
    const contentLower = chunk.content.toLowerCase();
    
    // Simple keyword matching (can be enhanced with embeddings)
    const queryWords = queryLower.split(/\s+/);
    const matches = queryWords.filter(word => 
      word.length > 3 && contentLower.includes(word)
    ).length;
    
    const keywordScore = matches / queryWords.length;
    const importanceScore = chunk.importance;
    const recencyScore = this.calculateRecencyScore(chunk.lastAccessed);
    
    return (keywordScore * 0.4) + (importanceScore * 0.4) + (recencyScore * 0.2);
  }

  // Calculate importance of a message
  private calculateImportance(message: Message): number {
    let score = 0.5; // Base score

    // User messages are important
    if (message.role === 'user') score += 0.2;

    // Messages with citations are important
    if (message.metadata?.citations?.length) score += 0.2;

    // Messages with files attached are important
    if (message.metadata?.files?.length) score += 0.15;

    // Longer messages might be more important
    if (message.content.length > 500) score += 0.1;

    return Math.min(score, 1.0);
  }

  // Calculate recency score (decay over time)
  private calculateRecencyScore(lastAccessed: Date): number {
    const hoursSinceAccess = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60);
    return Math.exp(-hoursSinceAccess / 24); // Decay over 24 hours
  }

  // Estimate token count (rough approximation)
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  // Extract tags from content
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract hashtags
    const hashtagMatches = content.match(/#\w+/g);
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(tag => tag.substring(1).toLowerCase()));
    }

    // Extract URLs (could indicate web research)
    if (content.match(/https?:\/\//)) {
      tags.push('web-search');
    }

    // Extract code blocks
    if (content.includes('```')) {
      tags.push('code');
    }

    return tags;
  }

  // Trim RAM chunks to stay under limit
  private async trimRamChunks(): Promise<void> {
    if (this.ramChunks.size <= this.config.maxRamChunks) return;

    // Sort by least important and least recently accessed
    const sortedChunks = Array.from(this.ramChunks.entries())
      .sort(([, a], [, b]) => {
        const scoreA = a.importance * 0.5 + this.calculateRecencyScore(a.lastAccessed) * 0.5;
        const scoreB = b.importance * 0.5 + this.calculateRecencyScore(b.lastAccessed) * 0.5;
        return scoreA - scoreB;
      });

    // Remove bottom chunks
    const chunksToRemove = sortedChunks.slice(0, sortedChunks.length - this.config.maxRamChunks);
    
    // Save to disk before removing
    const chunksToSave = chunksToRemove.map(([, chunk]) => chunk);
    await this.saveToDisk(chunksToSave);

    // Remove from RAM
    for (const [id] of chunksToRemove) {
      this.ramChunks.delete(id);
    }
  }

  // Save chunks to disk
  private async saveToDisk(chunks: MemoryChunk[]): Promise<void> {
    try {
      const data = JSON.stringify(chunks, null, 2);
      localStorage.setItem('memory_chunks', data);
    } catch (error) {
      console.error('Failed to save memory to disk:', error);
    }
  }

  // Load chunks from disk
  async loadFromDisk(): Promise<void> {
    try {
      const data = localStorage.getItem('memory_chunks');
      if (data) {
        const chunks: MemoryChunk[] = JSON.parse(data);
        for (const chunk of chunks) {
          // Restore dates
          chunk.lastAccessed = new Date(chunk.lastAccessed);
          chunk.metadata.timestamp = new Date(chunk.metadata.timestamp);
          this.ramChunks.set(chunk.id, chunk);
        }
      }
    } catch (error) {
      console.error('Failed to load memory from disk:', error);
    }
  }

  // Start auto-save timer
  private startAutoSave(): void {
    this.saveTimer = setInterval(async () => {
      const chunks = Array.from(this.ramChunks.values());
      await this.saveToDisk(chunks);
    }, this.config.autoSaveInterval);
  }

  // Get memory statistics
  getStats(): MemoryStats {
    const totalTokens = Array.from(this.ramChunks.values())
      .reduce((sum, chunk) => sum + this.estimateTokens(chunk.content), 0);

    return {
      totalChunks: this.ramChunks.size,
      totalTokens,
      ramUsage: this.ramChunks.size / this.config.maxRamChunks,
      diskUsage: 0, // TODO: Calculate from localStorage
      cacheHitRate: 0.85 // TODO: Track actual hit rate
    };
  }

  // Clear all memory
  async clear(): Promise<void> {
    this.ramChunks.clear();
    localStorage.removeItem('memory_chunks');
  }

  // Cleanup
  destroy(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }
}

export default MemoryManager;
