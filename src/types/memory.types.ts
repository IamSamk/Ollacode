export interface MemoryChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
  importance: number;
  accessCount: number;
  lastAccessed: Date;
}

export interface ChunkMetadata {
  source: 'chat' | 'file' | 'web' | 'system';
  timestamp: Date;
  sessionId?: string;
  tags?: string[];
}

export interface MemoryContext {
  chunks: MemoryChunk[];
  totalTokens: number;
  maxTokens: number;
  compressionRatio: number;
}

export interface MemoryStats {
  totalChunks: number;
  totalTokens: number;
  ramUsage: number;
  diskUsage: number;
  cacheHitRate: number;
}

export interface MemoryConfig {
  maxRamChunks: number;
  maxTokensPerChunk: number;
  compressionThreshold: number;
  persistencePath: string;
  autoSaveInterval: number;
}
