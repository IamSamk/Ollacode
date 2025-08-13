import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { X, Plus } from 'lucide-react';
import './EditorArea.css';

interface OpenFile {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
  language?: string;
}

export const EditorArea: React.FC = () => {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1);
  const editorRef = useRef(null);

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'shell',
      'sql': 'sql',
      'php': 'php',
      'rb': 'ruby',
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  const openFile = async (path: string, name: string) => {
    // Check if file is already open
    const existingIndex = openFiles.findIndex(file => file.path === path);
    if (existingIndex !== -1) {
      setActiveFileIndex(existingIndex);
      return;
    }

    try {
      // TODO: Read file content using Tauri API
      const content = `// File: ${path}\n// Content will be loaded here...`;
      
      const newFile: OpenFile = {
        path,
        name,
        content,
        isDirty: false,
        language: getLanguageFromPath(path)
      };

      setOpenFiles(prev => [...prev, newFile]);
      setActiveFileIndex(openFiles.length);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const closeFile = (index: number) => {
    const newOpenFiles = openFiles.filter((_, i) => i !== index);
    setOpenFiles(newOpenFiles);
    
    if (activeFileIndex === index) {
      setActiveFileIndex(Math.max(0, index - 1));
    } else if (activeFileIndex > index) {
      setActiveFileIndex(activeFileIndex - 1);
    }
    
    if (newOpenFiles.length === 0) {
      setActiveFileIndex(-1);
    }
  };

  const updateFileContent = (content: string) => {
    if (activeFileIndex >= 0) {
      setOpenFiles(prev => prev.map((file, index) => 
        index === activeFileIndex 
          ? { ...file, content, isDirty: true }
          : file
      ));
    }
  };

  const activeFile = activeFileIndex >= 0 ? openFiles[activeFileIndex] : null;

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure Monaco Editor
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      lineNumbers: 'on',
      minimap: { enabled: true },
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
    });
  };

  return (
    <div className="editor-area">
      <div className="tab-bar">
        {openFiles.map((file, index) => (
          <div
            key={file.path}
            className={`tab ${index === activeFileIndex ? 'active' : ''}`}
            onClick={() => setActiveFileIndex(index)}
          >
            <span className="tab-name">
              {file.name}
              {file.isDirty && <span className="dirty-indicator">●</span>}
            </span>
            <button
              className="close-button"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(index);
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button className="new-file-button" title="New File">
          <Plus size={16} />
        </button>
      </div>
      
      <div className="editor-container">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeFile.language}
            value={activeFile.content}
            onChange={(value) => updateFileContent(value || '')}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: 'Consolas, "Courier New", monospace',
              lineNumbers: 'on',
              minimap: { enabled: true },
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderWhitespace: 'selection',
              tabSize: 2,
              insertSpaces: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'smart',
              quickSuggestions: true,
            }}
          />
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h2>Welcome to Ollacode</h2>
              <p>AI-powered IDE with local LLM integration</p>
              <div className="welcome-actions">
                <button className="welcome-button">Open Folder</button>
                <button className="welcome-button">New File</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
