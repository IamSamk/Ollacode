import React, { useState, useEffect } from 'react';
import { FolderOpen, File, ChevronRight, ChevronDown, Search, Folder } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import './Sidebar.css';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
  isExpanded?: boolean;
}

interface SidebarProps {
  width: number;
  onFileSelect?: (filePath: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ width, onFileSelect }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const loadDirectory = async (path: string = ''): Promise<FileItem[]> => {
    try {
      setIsLoading(true);
      
      // Check if invoke is available
      if (typeof invoke === 'undefined') {
        console.error('Tauri invoke function not available');
        return [];
      }
      
      const entries = await invoke<FileItem[]>('read_directory', { 
        path: path || currentDirectory 
      });
      
      return entries.map(entry => ({
        name: entry.name,
        path: entry.path,
        isDirectory: entry.isDirectory,
        children: entry.isDirectory ? [] : undefined,
        isExpanded: false
      }));
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const openFolder = async () => {
    try {
      // Check if open function is available
      if (typeof open === 'undefined') {
        console.error('Tauri dialog open function not available');
        return;
      }

      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Folder to Open'
      });
      
      if (selected && typeof selected === 'string') {
        setCurrentDirectory(selected);
        const directoryContents = await loadDirectory(selected);
        setFiles(directoryContents);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const openFile = async () => {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        title: 'Select File to Open'
      });
      
      if (selected && typeof selected === 'string') {
        setSelectedFile(selected);
        onFileSelect?.(selected);
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  useEffect(() => {
    loadDirectory().then(setFiles);
  }, []);

  const toggleDirectory = async (item: FileItem) => {
    if (!item.isDirectory) return;
    
    const updatedFiles = await updateFileTree(files, item.path, async (file) => {
      if (!file.isExpanded && (!file.children || file.children.length === 0)) {
        file.children = await loadDirectory(file.path);
      }
      file.isExpanded = !file.isExpanded;
      return file;
    });
    
    setFiles(updatedFiles);
  };

  const updateFileTree = async (
    items: FileItem[], 
    targetPath: string, 
    updater: (item: FileItem) => Promise<FileItem> | FileItem
  ): Promise<FileItem[]> => {
    return Promise.all(items.map(async item => {
      if (item.path === targetPath) {
        return await updater(item);
      }
      if (item.children) {
        return {
          ...item,
          children: await updateFileTree(item.children, targetPath, updater)
        };
      }
      return item;
    }));
  };

  const renderFileTree = (items: FileItem[], level: number = 0): React.ReactNode => {
    return items
      .filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((item) => (
        <div key={item.path} className="file-item">
          <div 
            className={`file-item-content ${selectedFile === item.path ? 'selected' : ''}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              if (item.isDirectory) {
                toggleDirectory(item);
              } else {
                setSelectedFile(item.path);
                onFileSelect?.(item.path);
              }
            }}
          >
            <div className="file-item-icon">
              {item.isDirectory ? (
                <>
                  {item.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <FolderOpen size={16} />
                </>
              ) : (
                <File size={16} />
              )}
            </div>
            <span className="file-item-name">{item.name}</span>
          </div>
          {item.isDirectory && item.isExpanded && item.children && (
            <div className="file-item-children">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      ));
  };

  return (
    <div className="sidebar" style={{ width }}>
      <div className="sidebar-header">
        <h3>Explorer</h3>
        <div className="toolbar-buttons">
          <button 
            className="toolbar-button" 
            onClick={openFolder}
            title="Open Folder"
            disabled={isLoading}
          >
            <Folder size={16} />
          </button>
          <button 
            className="toolbar-button" 
            onClick={openFile}
            title="Open File"
            disabled={isLoading}
          >
            <File size={16} />
          </button>
        </div>
      </div>
      {currentDirectory && (
        <div className="current-directory">
          <span title={currentDirectory}>
            📁 {currentDirectory.split(/[/\\]/).pop() || currentDirectory}
          </span>
        </div>
      )}
      <div className="search-container">
        <div className="search-input-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <div className="file-tree">
        {isLoading ? (
          <div className="loading-indicator">Loading...</div>
        ) : files.length === 0 && !currentDirectory ? (
          <div className="empty-state">
            <p>No folder open</p>
            <button className="open-folder-button" onClick={openFolder}>
              Open Folder
            </button>
          </div>
        ) : (
          renderFileTree(files)
        )}
      </div>
    </div>
  );
};
