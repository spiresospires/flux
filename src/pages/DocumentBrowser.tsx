import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  Children,
  lazy } from
'react';
import { DocumentCard, statusColors } from '../components/DocumentCard';
import { FilterPanel } from '../components/FilterPanel';
import { FolderTree } from '../components/FolderTree';
import { LeftRail } from '../components/LeftRail';
import { CollapsibleFilterPanel } from '../components/CollapsibleFilterPanel';
import { ChatInterface } from '../components/ChatInterface';
import { mockDocuments } from '../data/mockDocuments';
import { mockFolders } from '../data/mockFolders';
import {
  LayoutGridIcon,
  ListIcon,
  TableIcon,
  SearchIcon,
  UserIcon,
  CalendarIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
  LoaderIcon,
  SparklesIcon } from
'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
type SortDirection = 'asc' | 'desc' | null;
type ColumnKey =
'id' |
'title' |
'revisionNumber' |
'status' |
'documentType' |
'author' |
'dateModified';
interface ColumnFilter {
  column: ColumnKey;
  value: string;
  sortDirection: SortDirection;
}
type ViewMode = 'grid' | 'list' | 'table' | 'compact-table';
function ProjectDropdown({
  selectedProject,
  onProjectChange
}: {selectedProject: string;onProjectChange: (p: string) => void;}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const projects = ['The Shard, London', 'Skyline', 'Tower', 'Empire State'];
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node))
      {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-semibold text-neutral-900 tracking-tight hover:text-[#2A5FB8] transition-colors flex items-center gap-1.5">
        
        {selectedProject}
        <ChevronDownIcon
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        
      </button>

      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{
            opacity: 0,
            y: -4
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -4
          }}
          transition={{
            duration: 0.15
          }}
          className="absolute top-full left-0 mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
          
            <div className="p-2">
              {projects.map((project) =>
            <button
              key={project}
              onClick={() => {
                onProjectChange(project);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${selectedProject === project ? 'bg-[#E8F1FB] text-[#2A5FB8] font-medium' : 'text-neutral-700 hover:bg-neutral-50'}`}>
              
                  {project}
                </button>
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
function ViewModeDropdown({
  viewMode,
  onViewModeChange



}: {viewMode: ViewMode;onViewModeChange: (mode: ViewMode) => void;}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const viewOptions: {
    mode: ViewMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
  {
    mode: 'table',
    label: 'Comfy Table',
    icon: <TableIcon size={16} />
  },
  {
    mode: 'compact-table',
    label: 'Compact Table',
    icon: <TableIcon size={16} />
  },
  {
    mode: 'grid',
    label: 'Grid',
    icon: <LayoutGridIcon size={16} />
  },
  {
    mode: 'list',
    label: 'List',
    icon: <ListIcon size={16} />
  }];

  const currentView =
  viewOptions.find((v) => v.mode === viewMode) || viewOptions[0];
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node))
      {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 h-7 border border-neutral-200 text-xs font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent transition-all">
        
        {currentView.icon}
        View
        <ChevronDownIcon
          size={12}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        
      </button>

      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{
            opacity: 0,
            y: -4
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -4
          }}
          transition={{
            duration: 0.15
          }}
          className="absolute top-full right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
          
            <div className="p-2">
              {viewOptions.map((option) =>
            <button
              key={option.mode}
              onClick={() => {
                onViewModeChange(option.mode);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${viewMode === option.mode ? 'bg-[#E8F1FB] text-[#2A5FB8] font-medium' : 'text-neutral-700 hover:bg-neutral-50'}`}>
              
                  {option.icon}
                  {option.label}
                </button>
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
interface ColumnHeaderDropdownProps {
  column: ColumnKey;
  label: string;
  filter: ColumnFilter | undefined;
  onFilterChange: (column: ColumnKey, value: string) => void;
  onSortChange: (column: ColumnKey, direction: SortDirection) => void;
  onClearFilter: (column: ColumnKey) => void;
}
function ColumnHeaderDropdown({
  column,
  label,
  filter,
  onFilterChange,
  onSortChange,
  onClearFilter
}: ColumnHeaderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValue, setFilterValue] = useState(filter?.value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node))
      {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const hasActiveFilter = filter?.value || filter?.sortDirection;
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-left font-semibold text-xs uppercase tracking-wider transition-colors ${hasActiveFilter ? 'text-[#0461BA]' : 'text-neutral-700 hover:text-neutral-900'}`}>
        
        {label}
        {filter?.sortDirection === 'asc' && <ChevronUpIcon size={14} />}
        {filter?.sortDirection === 'desc' && <ChevronDownIcon size={14} />}
        {!filter?.sortDirection &&
        <ChevronDownIcon size={12} className="opacity-50" />
        }
        {filter?.value &&
        <span className="w-1.5 h-1.5 rounded-full bg-[#0461BA]" />
        }
      </button>

      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{
            opacity: 0,
            y: -4
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -4
          }}
          transition={{
            duration: 0.15
          }}
          className="absolute top-full left-0 mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
          
            <div className="p-3 border-b border-neutral-100">
              <div className="relative">
                <SearchIcon
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              
                <input
                type="text"
                placeholder={`Filter ${label.toLowerCase()}...`}
                value={filterValue}
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  onFilterChange(column, e.target.value);
                }}
                className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent"
                autoFocus />
              
              </div>
            </div>

            <div className="p-2">
              <button
              onClick={() => {
                onSortChange(column, 'asc');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${filter?.sortDirection === 'asc' ? 'bg-[#E8F1FB] text-[#0461BA]' : 'text-neutral-700 hover:bg-neutral-50'}`}>
              
                <ChevronUpIcon size={14} />
                Sort Ascending
              </button>
              <button
              onClick={() => {
                onSortChange(column, 'desc');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${filter?.sortDirection === 'desc' ? 'bg-[#E8F1FB] text-[#0461BA]' : 'text-neutral-700 hover:bg-neutral-50'}`}>
              
                <ChevronDownIcon size={14} />
                Sort Descending
              </button>
            </div>

            {hasActiveFilter &&
          <div className="p-2 border-t border-neutral-100">
                <button
              onClick={() => {
                setFilterValue('');
                onClearFilter(column);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-md transition-colors">
              
                  <XIcon size={14} />
                  Clear Filter
                </button>
              </div>
          }
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
const ITEMS_PER_PAGE = 20;
export function DocumentBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<'dateModified' | 'title' | 'id'>(
    'dateModified'
  );
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [leftPanelMode, setLeftPanelMode] = useState<'filter' | 'folder'>(
    'folder'
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isChatMode, setIsChatMode] = useState(false);
  const [activeRailItem, setActiveRailItem] = useState('dashboard');
  const [currentProject, setCurrentProject] = useState<string>(() => {
    if (typeof window === 'undefined') return 'The Shard, London';
    return localStorage.getItem('flux.currentProject') || 'The Shard, London';
  });
  useEffect(() => {
    localStorage.setItem('flux.currentProject', currentProject);
  }, [currentProject]);
  const handleProjectChange = (p: string) => {
    setCurrentProject(p);
    setSelectedFolderId(null);
    setDisplayedCount(ITEMS_PER_PAGE);
  };
  const projectScale: Record<string, number> = {
    'The Shard, London': 1,
    'Skyline': 0.7,
    'Tower': 0.45,
    'Empire State': 0.85
  };
  const projectFolders = useMemo(() => {
    const factor = projectScale[currentProject] ?? 1;
    const scale = (n: number) => Math.max(0, Math.round(n * factor));
    const walk = (list: typeof mockFolders): typeof mockFolders =>
    list.map((f) => ({
      ...f,
      documentCount: scale(f.documentCount),
      children: f.children ? walk(f.children) : []
    }));
    return walk(mockFolders);
  }, [currentProject]);
  const projectDocuments = useMemo(() => {
    const factor = projectScale[currentProject] ?? 1;
    // Deterministic shuffle seeded by project name so each workspace shows a different mix
    let seed = 0;
    for (let i = 0; i < currentProject.length; i++) {
      seed = (seed * 31 + currentProject.charCodeAt(i)) >>> 0;
    }
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    const shuffled = [...mockDocuments];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const count = Math.max(1, Math.round(mockDocuments.length * factor));
    return shuffled.slice(0, count);
  }, [currentProject]);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname === '/chat') {
      setIsChatMode(true);
      setActiveRailItem('chat');
    } else {
      setIsChatMode(false);
      setActiveRailItem('documents');
    }
  }, [location.pathname]);
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(null);
  // Column filters for table view
  const [columnFilters, setColumnFilters] = useState<
    Map<ColumnKey, ColumnFilter>>(
    new Map());
  // Lazy loading state
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const handleColumnFilterChange = (column: ColumnKey, value: string) => {
    setColumnFilters((prev) => {
      const newFilters = new Map(prev);
      const existing = newFilters.get(column);
      newFilters.set(column, {
        column,
        value,
        sortDirection: existing?.sortDirection || null
      });
      return newFilters;
    });
    setDisplayedCount(ITEMS_PER_PAGE);
  };
  const handleColumnSortChange = (
  column: ColumnKey,
  direction: SortDirection) =>
  {
    setColumnFilters((prev) => {
      const newFilters = new Map(prev);
      // Clear sort from other columns
      newFilters.forEach((filter, key) => {
        if (key !== column) {
          newFilters.set(key, {
            ...filter,
            sortDirection: null
          });
        }
      });
      const existing = newFilters.get(column);
      newFilters.set(column, {
        column,
        value: existing?.value || '',
        sortDirection: direction
      });
      return newFilters;
    });
  };
  const handleClearColumnFilter = (column: ColumnKey) => {
    setColumnFilters((prev) => {
      const newFilters = new Map(prev);
      newFilters.delete(column);
      return newFilters;
    });
    setDisplayedCount(ITEMS_PER_PAGE);
  };
  const filteredDocuments = useMemo(() => {
    let filtered = projectDocuments;
    if (leftPanelMode === 'folder' && selectedFolderId !== null) {
      filtered = filtered.filter((doc) => doc.folderId === selectedFolderId);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (leftPanelMode === 'filter' && selectedStatus.length > 0) {
      filtered = filtered.filter((doc) => selectedStatus.includes(doc.status));
    }
    if (leftPanelMode === 'filter' && selectedDocType.length > 0) {
      filtered = filtered.filter((doc) =>
      selectedDocType.includes(doc.documentType)
      );
    }
    if (leftPanelMode === 'filter' && selectedProject.length > 0) {
      filtered = filtered.filter((doc) => selectedProject.includes(doc.project));
    }
    // Apply column filters (for table view)
    columnFilters.forEach((filter) => {
      if (filter.value) {
        filtered = filtered.filter((doc) => {
          const value = doc[filter.column as keyof typeof doc];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(filter.value.toLowerCase());
          }
          return true;
        });
      }
    });
    // Apply column sorting
    let sortColumn: ColumnKey | null = null;
    let sortDirection: SortDirection = null;
    columnFilters.forEach((filter) => {
      if (filter.sortDirection) {
        sortColumn = filter.column;
        sortDirection = filter.sortDirection;
      }
    });
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn as keyof typeof a] as string;
        const bVal = b[sortColumn as keyof typeof b] as string;
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default sorting
      filtered.sort((a, b) => {
        if (sortBy === 'dateModified') {
          return (
            new Date(b.dateModified).getTime() -
            new Date(a.dateModified).getTime());

        } else if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else {
          return a.id.localeCompare(b.id);
        }
      });
    }
    return filtered;
  }, [
  searchTerm,
  selectedStatus,
  selectedDocType,
  selectedProject,
  sortBy,
  leftPanelMode,
  selectedFolderId,
  columnFilters,
  projectDocuments]
  );
  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [
  searchTerm,
  selectedStatus,
  selectedDocType,
  selectedProject,
  selectedFolderId,
  leftPanelMode]
  );
  // Lazy loading with Intersection Observer
  const loadMore = useCallback(() => {
    if (displayedCount >= filteredDocuments.length || isLoading) return;
    setIsLoading(true);
    // Simulate network delay for lazy loading
    setTimeout(() => {
      setDisplayedCount((prev) =>
      Math.min(prev + ITEMS_PER_PAGE, filteredDocuments.length)
      );
      setIsLoading(false);
    }, 500);
  }, [displayedCount, filteredDocuments.length, isLoading]);
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        threshold: 0.1
      }
    );
    observer.observe(currentRef);
    return () => {
      observer.disconnect();
    };
  }, [loadMore, viewMode]);
  const displayedDocuments = filteredDocuments.slice(0, displayedCount);
  const hasMore = displayedCount < filteredDocuments.length;
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 10
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };
  const handleChatClick = () => {
    navigate('/chat');
  };
  const handleExitChat = () => {
    navigate('/');
  };
  const handleDocumentSelectFromChat = (docId: string) => {
    navigate('/');
    setHighlightedDocId(docId);
    setSelectedFolderId(null);
    setSelectedStatus([]);
    setSelectedDocType([]);
    setSelectedProject([]);
    setSearchTerm('');
    setTimeout(() => setHighlightedDocId(null), 5000);
  };
  const columns: {
    key: ColumnKey;
    label: string;
  }[] = [
  {
    key: 'id',
    label: 'Document ID'
  },
  {
    key: 'title',
    label: 'Title'
  },
  {
    key: 'revisionNumber',
    label: 'Rev'
  },
  {
    key: 'status',
    label: 'Status'
  },
  {
    key: 'documentType',
    label: 'Type'
  },
  {
    key: 'author',
    label: 'Author'
  },
  {
    key: 'dateModified',
    label: 'Date Modified'
  }];

  return (
    <div
      className="h-[calc(100vh-24px)] mt-6 font-sans overflow-hidden p-3"
      style={{
        backgroundColor: 'var(--main-bg-color, #E5E5E5)'
      }}>
      
      {/* Chat Mode */}
      <AnimatePresence>
        {isChatMode &&
        <ChatInterface
          onExit={handleExitChat}
          onDocumentSelect={handleDocumentSelectFromChat}
          askAbout={new URLSearchParams(location.search).get('ask')}
          askKind={new URLSearchParams(location.search).get('askKind') as 'folder' | 'document' | null} />

        }
      </AnimatePresence>

      {/* Main Layout */}
      <AnimatePresence>
        {!isChatMode &&
        <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          transition={{
            duration: 0.25
          }}
          className="flex h-full gap-2 pl-[52px]">
          
            {/* Left Rail */}
            <LeftRail
            activeItem={activeRailItem}
            onItemClick={setActiveRailItem}
            onChatClick={handleChatClick} />
          

            {/* Sidebar Island */}
            <CollapsibleFilterPanel
            isExpanded={isFilterExpanded}
            onToggle={() => setIsFilterExpanded(!isFilterExpanded)}
            mode={leftPanelMode}
            onModeChange={setLeftPanelMode}
            topSlot={<ProjectDropdown selectedProject={currentProject} onProjectChange={handleProjectChange} />}>
            
              {leftPanelMode === 'filter' ?
            <FilterPanel
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedDocType={selectedDocType}
              onDocTypeChange={setSelectedDocType}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject} /> :


            <FolderTree
              folders={projectFolders}
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId} />

            }
            </CollapsibleFilterPanel>

            {/* Main Content Island */}
            <div
            className="flex-1 flex flex-col min-w-0 rounded-lg shadow-lg overflow-hidden"
            style={{
              backgroundColor: 'var(--element-bg-color, #FFFFFF)'
            }}>
            
              {/* Header */}
              <header className="px-4 h-10 bg-white shrink-0 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  {filteredDocuments.length} documents found
                  {displayedCount < filteredDocuments.length &&
                <span className="text-neutral-400">
                      {' '}
                      • Showing {displayedCount}
                    </span>
                }
                </p>
                <ViewModeDropdown
                  viewMode={viewMode}
                  onViewModeChange={setViewMode} />
              </header>

              {/* Filter Pills */}
              {leftPanelMode === 'filter' && (selectedStatus.length > 0 || selectedDocType.length > 0 || selectedProject.length > 0 || searchTerm) && (
                <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 border-b border-neutral-100 bg-white shrink-0">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium">
                      Search: <span className="font-semibold">{searchTerm}</span>
                      <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500 transition-colors" aria-label="Clear search">
                        <XIcon size={12} />
                      </button>
                    </span>
                  )}
                  {selectedStatus.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                      Status: <span className="font-semibold">{s}</span>
                      <button onClick={() => setSelectedStatus((prev) => prev.filter((x) => x !== s))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${s} filter`}>
                        <XIcon size={12} />
                      </button>
                    </span>
                  ))}
                  {selectedDocType.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                      Type: <span className="font-semibold">{t}</span>
                      <button onClick={() => setSelectedDocType((prev) => prev.filter((x) => x !== t))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${t} filter`}>
                        <XIcon size={12} />
                      </button>
                    </span>
                  ))}
                  {selectedProject.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                      Project: <span className="font-semibold">{p}</span>
                      <button onClick={() => setSelectedProject((prev) => prev.filter((x) => x !== p))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${p} filter`}>
                        <XIcon size={12} />
                      </button>
                    </span>
                  ))}
                  {(selectedStatus.length > 1 || selectedDocType.length > 1 || selectedProject.length > 1 || (selectedStatus.length + selectedDocType.length + selectedProject.length > 1)) && (
                    <button
                      onClick={() => { setSelectedStatus([]); setSelectedDocType([]); setSelectedProject([]); setSearchTerm(''); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors">
                      Clear all
                      <XIcon size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredDocuments.length === 0 ?
              <div className="flex flex-col items-center justify-center h-full max-h-[400px] bg-white rounded-lg border border-neutral-200 border-dashed">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-3">
                      <SearchIcon size={24} className="text-neutral-400" />
                    </div>
                    <p className="text-neutral-900 font-semibold text-lg">
                      No documents found
                    </p>
                    <p className="text-neutral-500 text-sm mt-1">
                      Try adjusting your filters or search criteria
                    </p>
                  </div> :
              viewMode === 'grid' ?
              <div key="grid-view">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {displayedDocuments.map((doc) =>
                  <div key={doc.id}>
                          <DocumentCard
                      document={doc}
                      isHighlighted={highlightedDocId === doc.id} />
                    
                        </div>
                  )}
                    </div>
                    {hasMore &&
                <div
                  ref={loadMoreRef}
                  className="flex justify-center py-8">
                  
                        {isLoading ?
                  <div className="flex items-center gap-2 text-neutral-500">
                            <LoaderIcon size={20} className="animate-spin" />
                            <span className="text-sm">
                              Loading more documents...
                            </span>
                          </div> :

                  <div className="h-8" />
                  }
                      </div>
                }
                  </div> :
              viewMode === 'list' ?
              <div key="list-view" className="space-y-2">
                    {displayedDocuments.map((doc) =>
                <div key={doc.id}>
                        <Link
                    to={`/document/${doc.id}`}
                    className={`block border p-3 hover:shadow-sm transition-all bg-white rounded-md group ${highlightedDocId === doc.id ? 'border-[#0461BA] ring-2 ring-[#0461BA]/20 shadow-md' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    
                          <div className="flex gap-3">
                            <div className="w-24 h-16 bg-neutral-100 flex-shrink-0 rounded-md overflow-hidden border border-neutral-100">
                              <img
                          src={doc.thumbnail}
                          alt={doc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        
                            </div>
                            <div className="flex-1 flex flex-col justify-center min-w-0">
                              <div className="flex items-start justify-between mb-1 gap-3">
                                <h3 className="font-semibold text-neutral-900 text-sm group-hover:text-[#0461BA] transition-colors truncate">
                                  {doc.title}
                                </h3>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/chat?ask=${encodeURIComponent(`${doc.id} — ${doc.title}`)}&askKind=document`);
                              }}
                              title={`Ask Flint about ${doc.id}`}
                              aria-label={`Ask Flint about ${doc.id}`}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-6 h-6 rounded-md inline-flex items-center justify-center text-[#0461BA] hover:bg-[#E8F1FB]">
                                    <SparklesIcon size={13} />
                                  </button>
                                  <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap ${statusColors[doc.status]}`}>
                              
                                    {doc.status}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs font-medium text-neutral-500 mb-2">
                                {doc.id}{' '}
                                <span className="text-neutral-300 mx-1">•</span>{' '}
                                Rev {doc.revisionNumber}
                              </p>
                              <div className="flex gap-5 text-xs text-neutral-500">
                                <span className="flex items-center gap-1.5">
                                  <UserIcon
                              size={12}
                              className="text-neutral-400" />
                            
                                  {doc.author}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <CalendarIcon
                              size={12}
                              className="text-neutral-400" />
                            
                                  {doc.dateModified}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <FolderIcon
                              size={12}
                              className="text-neutral-400" />
                            
                                  {doc.project}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                )}
                    {hasMore &&
                <div
                  ref={loadMoreRef}
                  className="flex justify-center py-8">
                  
                        {isLoading ?
                  <div className="flex items-center gap-2 text-neutral-500">
                            <LoaderIcon size={20} className="animate-spin" />
                            <span className="text-sm">
                              Loading more documents...
                            </span>
                          </div> :

                  <div className="h-8" />
                  }
                      </div>
                }
                  </div> :

              <div key="table-view">
                    <div className="bg-white rounded-md border border-neutral-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse whitespace-nowrap">
                          <thead>
                            <tr className="border-b border-neutral-200 bg-neutral-50">
                              {columns.map((col) =>
                          <th
                            key={col.key}
                            className={
                            viewMode === 'compact-table' ?
                            'text-left p-2' :
                            'text-left p-4'
                            }>
                            
                                  <ColumnHeaderDropdown
                              column={col.key}
                              label={col.label}
                              filter={columnFilters.get(col.key)}
                              onFilterChange={handleColumnFilterChange}
                              onSortChange={handleColumnSortChange}
                              onClearFilter={handleClearColumnFilter} />
                            
                                </th>
                          )}
                              <th className={viewMode === 'compact-table' ? 'p-2 w-10' : 'p-4 w-12'} aria-label="Actions" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {displayedDocuments.map((doc) =>
                        <tr
                          key={doc.id}
                          className={`transition-colors group ${highlightedDocId === doc.id ? 'bg-[#E8F1FB]' : 'hover:bg-neutral-50'}`}>
                          
                                <td
                            className={
                            viewMode === 'compact-table' ? 'p-2' : 'p-4'
                            }>
                            
                                  <Link
                              to={`/document/${doc.id}`}
                              className="text-[#0461BA] hover:text-[#035299] font-medium">
                              
                                    {doc.id}
                                  </Link>
                                </td>
                                <td
                            className={
                            viewMode === 'compact-table' ? 'p-2' : 'p-4'
                            }>
                            
                                  <Link
                              to={`/document/${doc.id}`}
                              className="text-neutral-900 group-hover:text-[#0461BA] transition-colors font-medium">
                              
                                    {doc.title}
                                  </Link>
                                </td>
                                <td
                            className={`${viewMode === 'compact-table' ? 'p-2' : 'p-4'} text-neutral-500 font-medium`}>
                            
                                  {doc.revisionNumber}
                                </td>
                                <td
                            className={
                            viewMode === 'compact-table' ? 'p-2' : 'p-4'
                            }>
                            
                                  <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${statusColors[doc.status]}`}>
                              
                                    {doc.status}
                                  </span>
                                </td>
                                <td
                            className={`${viewMode === 'compact-table' ? 'p-2' : 'p-4'} text-neutral-600`}>
                            
                                  {doc.documentType}
                                </td>
                                <td
                            className={`${viewMode === 'compact-table' ? 'p-2' : 'p-4'} text-neutral-600`}>
                            
                                  {doc.author}
                                </td>
                                <td
                            className={`${viewMode === 'compact-table' ? 'p-2' : 'p-4'} text-neutral-600`}>
                            
                                  {doc.dateModified}
                                </td>
                                <td
                            className={`${viewMode === 'compact-table' ? 'p-2' : 'p-4'} text-right`}>
                                  <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/chat?ask=${encodeURIComponent(`${doc.id} — ${doc.title}`)}&askKind=document`);
                              }}
                              title={`Ask Flint about ${doc.id}`}
                              aria-label={`Ask Flint about ${doc.id}`}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-7 h-7 rounded-md inline-flex items-center justify-center text-[#0461BA] hover:bg-[#E8F1FB]">
                                    <SparklesIcon size={14} />
                                  </button>
                                </td>
                              </tr>
                        )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {hasMore &&
                <div
                  ref={loadMoreRef}
                  className="flex justify-center py-8">
                  
                        {isLoading ?
                  <div className="flex items-center gap-2 text-neutral-500">
                            <LoaderIcon size={20} className="animate-spin" />
                            <span className="text-sm">
                              Loading more documents...
                            </span>
                          </div> :

                  <div className="h-8" />
                  }
                      </div>
                }
                  </div>
              }
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}