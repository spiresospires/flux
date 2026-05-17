import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  SearchIcon,
  SparklesIcon } from
'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Folder } from '../types/document';
interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}
export function FolderTree({
  folders,
  selectedFolderId,
  onFolderSelect
}: FolderTreeProps) {
  const navigate = useNavigate();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const nodeRefs = useRef(new Map<string, HTMLDivElement | null>());
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };
  const filterFoldersRecursive = (
  folders: Folder[],
  searchLower: string)
  : Folder[] => {
    return folders.
    filter((folder) => {
      const matchesSearch = folder.name.toLowerCase().includes(searchLower);
      const hasMatchingChildren =
      folder.children &&
      folder.children.length > 0 &&
      filterFoldersRecursive(folder.children, searchLower).length > 0;
      return matchesSearch || hasMatchingChildren;
    }).
    map((folder) => ({
      ...folder,
      children: folder.children ?
      filterFoldersRecursive(folder.children, searchLower) :
      []
    }));
  };
  const filteredFolders = useMemo(() => {
    if (!searchTerm) return folders;
    const searchLower = searchTerm.toLowerCase();
    return filterFoldersRecursive(folders, searchLower);
  }, [folders, searchTerm]);
  const renderFolder = (folder: Folder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    return (
      <div key={folder.id} ref={(el) => { nodeRefs.current.set(folder.id, el); }}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors group rounded-md mx-1 ${isSelected ? 'bg-[#E8F1FB] text-[#0461BA]' : 'text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900'}`}
          style={{
            paddingLeft: `${8 + level * 12}px`
          }}
          onClick={() => onFolderSelect(folder.id)}>
          
          {hasChildren ?
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder(folder.id);
            }}
            className={`p-0.5 rounded transition-colors ${isSelected ? 'hover:bg-[#D1E3F8]' : 'hover:bg-neutral-200'}`}>
            
              {isExpanded ?
            <ChevronDownIcon
              size={14}
              className={
              isSelected ?
              'text-[#0461BA]' :
              'text-neutral-400 group-hover:text-neutral-600'
              } /> :


            <ChevronRightIcon
              size={14}
              className={
              isSelected ?
              'text-[#0461BA]' :
              'text-neutral-400 group-hover:text-neutral-600'
              } />

            }
            </button> :

          <div className="w-5" />
          }

          {isExpanded || isSelected ?
          <FolderOpenIcon
            size={16}
            className={`flex-shrink-0 ${isSelected ? 'text-amber-500' : 'text-amber-400 group-hover:text-amber-500'}`} /> :


          <FolderIcon
            size={16}
            className={`flex-shrink-0 ${isSelected ? 'text-amber-500' : 'text-amber-400 group-hover:text-amber-500'}`} />

          }

          <span className="text-sm flex-1 truncate font-medium">
            {folder.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/chat?ask=${encodeURIComponent(folder.name)}&askKind=folder`);
            }}
            title={`Ask Flint about ${folder.name}`}
            aria-label={`Ask Flint about ${folder.name}`}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-6 h-6 rounded-md inline-flex items-center justify-center text-[#0461BA] hover:bg-[#E8F1FB] flex-shrink-0">
            <SparklesIcon size={13} />
          </button>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0 transition-colors ${isSelected ? 'bg-[#0461BA] text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'}`}>
            
            {folder.documentCount}
          </span>
        </div>

        {hasChildren && isExpanded &&
        <div className="mt-0.5 space-y-0.5">
            {folder.children.map((child) => renderFolder(child, level + 1))}
          </div>
        }
      </div>);

  };

  // When a selectedFolderId is provided, ensure its ancestor folders are expanded
  // and scroll the selected folder into view so it appears focused when returning
  // to the folder view.
  useEffect(() => {
    if (!selectedFolderId) return;

    const findPath = (id: string, nodes: Folder[], path: string[] = []): string[] | null => {
      for (const n of nodes) {
        if (n.id === id) return [...path, n.id];
        if (n.children && n.children.length > 0) {
          const res = findPath(id, n.children, [...path, n.id]);
          if (res) return res;
        }
      }
      return null;
    };

    const path = findPath(selectedFolderId, folders);
    if (path && path.length > 1) {
      // add all ancestors (excluding the leaf) to expanded set
      const parents = path.slice(0, -1);
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        parents.forEach((p) => next.add(p));
        return next;
      });
    }

    // Scroll the selected node into view
    const el = nodeRefs.current.get(selectedFolderId);
    if (el && el.scrollIntoView) {
      // Delay to allow expansion to take effect
      setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
    }
  }, [selectedFolderId, folders]);
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="px-4 pt-1 pb-3">
        <div className="relative">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          
          <input
            type="text"
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full pl-8 pr-3 py-1.5 
              bg-[#F0F4F8] border border-neutral-200 
              text-xs rounded-md 
              text-neutral-900 placeholder-neutral-400
              focus:outline-none focus:ring-1 focus:ring-[#7FB7E6] focus:border-transparent focus:bg-white
              relative z-20
              transition-all
            " />







          
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 mx-1 mb-2 rounded-md cursor-pointer transition-colors group ${selectedFolderId === null ? 'bg-[#E8F1FB] text-[#0461BA]' : 'text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900'}`}
          onClick={() => onFolderSelect(null)}>
          
          <FolderIcon
            size={16}
            className={
            selectedFolderId === null ?
            'text-amber-500' :
            'text-amber-400 group-hover:text-amber-500'
            } />
          
          <span className="text-sm font-semibold">All Documents</span>
        </div>

        <div className="space-y-0.5">
          {filteredFolders.map((folder) => renderFolder(folder))}
        </div>

        {searchTerm && filteredFolders.length === 0 &&
        <div className="p-4 text-sm text-neutral-500 text-center">
            No folders found
          </div>
        }
      </div>
    </div>);

}
