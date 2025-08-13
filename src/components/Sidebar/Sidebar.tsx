import React, { useState, useEffect } from 'react';
import { FolderOpen, File, ChevronRight, ChevronDown, Search } from 'lucide-react';
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
}

export const Sidebar: React.FC<SidebarProps> = ({ width }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const loadDirectory = async (path: string = ''): Promise<FileItem[]> => {
    try {
      // For now, let's create some dummy files to test the UI
      if (path === '') {
        return [
          { name: 'src', path: 'src', isDirectory: true, children: [] },
          { name: 'package.json', path: 'package.json', isDirectory: false },
          { name: 'README.md', path: 'README.md', isDirectory: false },
          { name: 'tsconfig.json', path: 'tsconfig.json', isDirectory: false },
        ];
      }
      return [];
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
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
                // TODO: Open file in editor
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
      </div>
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
        {renderFileTree(files)}
      </div>
    </div>
  );
};
