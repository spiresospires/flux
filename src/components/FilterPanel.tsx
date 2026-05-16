import React, { useState } from 'react';
import { SearchIcon, ChevronDownIcon } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string[];
  onStatusChange: (status: string[]) => void;
  selectedDocType: string[];
  onDocTypeChange: (types: string[]) => void;
  selectedProject: string[];
  onProjectChange: (projects: string[]) => void;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}
export function FilterPanel({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedDocType,
  onDocTypeChange,
  selectedProject,
  onProjectChange,
  selectedCategories,
  onCategoryChange
}: FilterPanelProps) {
  const { t } = useLocalization();
  const [includePlaceholders, setIncludePlaceholders] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState('');
  const [currentVersionOnly, setCurrentVersionOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const statuses = ['Draft', 'In Review', 'Approved', 'Superseded', 'Archived'];
  const docTypes = [
  'Drawing',
  'Specification',
  'Technical Report',
  'Manual',
  'Procedure'];

  const projects = [
  'Refinery Upgrade 2024',
  'Operations Manual',
  'Maintenance Program',
  'Safety Compliance 2024',
  'Environmental Initiative',
  'Digital Transformation'];

  const fileTypes = [
  'Word',
  'Excel',
  'PowerPoint',
  'AutoCAD',
  'MicroStation',
  'Images',
  'Movie',
  'PDF'];

  const categories = [
  'Structural',
  'Electrical',
  'Mechanical',
  'Civil',
  'Architectural',
  'Plumbing',
  'HVAC'];

  const companies = [
  'Acme Engineering',
  'BuildCorp',
  'DesignPro',
  'TechConstruct',
  'Global Architects'];

  const users = [
  'John Smith',
  'Sarah Johnson',
  'Mike Chen',
  'Lisa Wong',
  'David Kumar',
  'Emily Rodriguez'];

  const setQuickDateRange = (range: 'day' | 'week' | 'month' | 'sixmonths') => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    let from = new Date();
    switch (range) {
      case 'day':
        from.setDate(today.getDate() - 1);
        break;
      case 'week':
        from.setDate(today.getDate() - 7);
        break;
      case 'month':
        from.setMonth(today.getMonth() - 1);
        break;
      case 'sixmonths':
        from.setMonth(today.getMonth() - 6);
        break;
    }
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to);
  };
  const handleSaveFilter = () => {
    console.log('Filter saved');
  };
  const handleClearAll = () => {
    onStatusChange([]);
    onDocTypeChange([]);
    onProjectChange([]);
    onCategoryChange([]);
    onSearchChange('');
    setIncludePlaceholders(false);
    setSelectedFileType('');
    setCurrentVersionOnly(false);
    setDateFrom('');
    setDateTo('');
    setSelectedCompany('');
    setSelectedUser('');
  };
  const toggleFilter = (
  value: string,
  current: string[],
  onChange: (values: string[]) => void) =>
  {
    if (current.includes(value)) {
      onChange(current.filter((v) => v !== value));
    } else {
      onChange([...current, value]);
    }
  };
  const statusLabelKeys: Record<string, string> = {
    Draft: 'filters.statusOptions.draft',
    'In Review': 'filters.statusOptions.inReview',
    Approved: 'filters.statusOptions.approved',
    Superseded: 'filters.statusOptions.superseded',
    Archived: 'filters.statusOptions.archived'
  };
  const docTypeLabelKeys: Record<string, string> = {
    Drawing: 'filters.documentTypeOptions.drawing',
    Specification: 'filters.documentTypeOptions.specification',
    'Technical Report': 'filters.documentTypeOptions.technicalReport',
    Manual: 'filters.documentTypeOptions.manual',
    Procedure: 'filters.documentTypeOptions.procedure'
  };
  const fileTypeLabelKeys: Record<string, string> = {
    Word: 'filters.fileTypeOptions.word',
    Excel: 'filters.fileTypeOptions.excel',
    PowerPoint: 'filters.fileTypeOptions.powerpoint',
    AutoCAD: 'filters.fileTypeOptions.autocad',
    MicroStation: 'filters.fileTypeOptions.microstation',
    Images: 'filters.fileTypeOptions.images',
    Movie: 'filters.fileTypeOptions.movie',
    PDF: 'filters.fileTypeOptions.pdf'
  };
  const categoryLabelKeys: Record<string, string> = {
    Structural: 'filters.categories.structural',
    Electrical: 'filters.categories.electrical',
    Mechanical: 'filters.categories.mechanical',
    Civil: 'filters.categories.civil',
    Architectural: 'filters.categories.architectural',
    Plumbing: 'filters.categories.plumbing',
    HVAC: 'filters.categories.hvac'
  };
  return (
    <div className="w-full h-full px-4 pb-4 overflow-y-auto custom-scrollbar">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          
          <input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full pl-9 pr-3 py-2.5 
              bg-[#F0F4F8] border border-neutral-200 
              text-sm rounded-lg 
              text-neutral-900 placeholder-neutral-400
              focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent focus:bg-white
              transition-all
            " />







          
        </div>
      </div>

      {/* Status */}
      <div className="mb-4 pb-4 border-b border-neutral-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t('filters.status')}
        </h3>
        <div className="space-y-1.5">
          {statuses.map((status) =>
          <label
            key={status}
            className="flex items-center gap-3 text-sm cursor-pointer group">
            
              <div className="relative flex items-center">
                <input
                type="checkbox"
                checked={selectedStatus.includes(status)}
                onChange={() =>
                toggleFilter(status, selectedStatus, onStatusChange)
                }
                className="
                    peer w-4 h-4 appearance-none 
                    border border-neutral-300 rounded 
                    bg-white
                    checked:bg-[#0461BA] checked:border-[#0461BA]
                    focus:outline-none focus:ring-2 focus:ring-[#0461BA]/30
                    transition-all cursor-pointer
                  " />







              
                <svg
                className="absolute w-4 h-4 p-0.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round">
                
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors">
                {t(statusLabelKeys[status])}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Document Type */}
      <div className="mb-4 pb-4 border-b border-neutral-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t('filters.documentType')}
        </h3>
        <div className="space-y-1.5">
          {docTypes.map((type) =>
          <label
            key={type}
            className="flex items-center gap-3 text-sm cursor-pointer group">
            
              <div className="relative flex items-center">
                <input
                type="checkbox"
                checked={selectedDocType.includes(type)}
                onChange={() =>
                toggleFilter(type, selectedDocType, onDocTypeChange)
                }
                className="
                    peer w-4 h-4 appearance-none 
                    border border-neutral-300 rounded 
                    bg-white
                    checked:bg-[#0461BA] checked:border-[#0461BA]
                    focus:outline-none focus:ring-2 focus:ring-[#0461BA]/30
                    transition-all cursor-pointer
                  " />







              
                <svg
                className="absolute w-4 h-4 p-0.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round">
                
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors">
                {t(docTypeLabelKeys[type])}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Project */}
      <div className="mb-4 pb-4 border-b border-neutral-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t('filters.project')}
        </h3>
        <div className="space-y-1.5">
          {projects.map((project) =>
          <label
            key={project}
            className="flex items-center gap-3 text-sm cursor-pointer group">
            
              <div className="relative flex items-center shrink-0">
                <input
                type="checkbox"
                checked={selectedProject.includes(project)}
                onChange={() =>
                toggleFilter(project, selectedProject, onProjectChange)
                }
                className="
                    peer w-4 h-4 appearance-none 
                    border border-neutral-300 rounded 
                    bg-white
                    checked:bg-[#0461BA] checked:border-[#0461BA]
                    focus:outline-none focus:ring-2 focus:ring-[#0461BA]/30
                    transition-all cursor-pointer
                  " />







              
                <svg
                className="absolute w-4 h-4 p-0.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round">
                
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-xs text-neutral-700 group-hover:text-neutral-900 transition-colors leading-tight">
                {project}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Placeholders */}
      <div className="mb-4 pb-4 border-b border-neutral-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t('filters.placeholders')}
        </h3>
        <label className="flex items-center gap-3 text-sm cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={includePlaceholders}
              onChange={(e) => setIncludePlaceholders(e.target.checked)}
              className="
                peer w-4 h-4 appearance-none 
                border border-neutral-300 rounded 
                bg-white
                checked:bg-[#0461BA] checked:border-[#0461BA]
                focus:outline-none focus:ring-2 focus:ring-[#0461BA]/30
                transition-all cursor-pointer
              " />







            
            <svg
              className="absolute w-4 h-4 p-0.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round">
              
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors">
            {t('filters.includeDocumentPlaceholders')}
          </span>
        </label>
      </div>

      {/* File Type */}
      <div className="mb-4 pb-4 border-b border-neutral-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t('filters.fileType')}
        </h3>
        <div className="relative">
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="
              w-full px-3 py-2.5 pr-8
              bg-[#F0F4F8] border border-neutral-200 
              text-sm rounded-lg 
              text-neutral-700
              focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent focus:bg-white
              transition-all cursor-pointer
              appearance-none
            ">








            
            <option value="">{t('filters.allFileTypes')}</option>
            {fileTypes.map((type) =>
            <option key={type} value={type}>
                {t(fileTypeLabelKeys[type])}
              </option>
            )}
          </select>
          <ChevronDownIcon
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          
        </div>
      </div>

      {/* Version Control */}
      <div className="mb-4 pb-4 border-b border-neutral-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t('filters.versionControl')}
        </h3>
        <label className="flex items-center gap-3 text-sm cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={currentVersionOnly}
              onChange={(e) => setCurrentVersionOnly(e.target.checked)}
              className="
                peer w-4 h-4 appearance-none 
                border border-neutral-300 rounded 
                bg-white
                checked:bg-[#0461BA] checked:border-[#0461BA]
                focus:outline-none focus:ring-2 focus:ring-[#0461BA]/30
                transition-all cursor-pointer
              " />







            
            <svg
              className="absolute w-4 h-4 p-0.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round">
              
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors">
            {t('filters.currentVersionOnly')}
          </span>
        </label>
      </div>

      {/* Date Range */}
      <div className="mb-4 pb-4 border-b border-neutral-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t('filters.uploadedDate')}
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">{t('filters.from')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="
                w-full px-3 py-2
                bg-[#F0F4F8] border border-neutral-200 
                text-sm rounded-lg 
                text-neutral-700
                focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent focus:bg-white
                transition-all
              " />







            
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">{t('filters.to')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="
                w-full px-3 py-2
                bg-[#F0F4F8] border border-neutral-200 
                text-sm rounded-lg 
                text-neutral-700
                focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent focus:bg-white
                transition-all
              " />







            
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setQuickDateRange('day')}
              className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition-colors">
              
              {t('filters.last24h')}
            </button>
            <button
              onClick={() => setQuickDateRange('week')}
              className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition-colors">
              
              {t('filters.last7Days')}
            </button>
            <button
              onClick={() => setQuickDateRange('month')}
              className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition-colors">
              
              {t('filters.last30Days')}
            </button>
            <button
              onClick={() => setQuickDateRange('sixmonths')}
              className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition-colors">
              
              {t('filters.last6Months')}
            </button>
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="mb-4 pb-4 border-b border-neutral-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t('filters.category')}
        </h3>
        <div className="space-y-1.5">
          {categories.map((category) =>
          <label
            key={category}
            className="flex items-center gap-3 text-sm cursor-pointer group">
            
              <div className="relative flex items-center">
                <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onCategoryChange([...selectedCategories, category]);
                  } else {
                    onCategoryChange(
                      selectedCategories.filter((c) => c !== category)
                    );
                  }
                }}
                className="
                    peer w-4 h-4 appearance-none 
                    border border-neutral-300 rounded 
                    bg-white
                    checked:bg-[#0461BA] checked:border-[#0461BA]
                    focus:outline-none focus:ring-2 focus:ring-[#0461BA]/30
                    transition-all cursor-pointer
                  " />







              
                <svg
                className="absolute w-4 h-4 p-0.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round">
                
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors">
                {t(categoryLabelKeys[category])}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Uploaded By */}
      <div className="mb-4 pb-4 border-b border-neutral-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t('filters.uploadedBy')}
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              {t('filters.company')}
            </label>
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="
                  w-full px-3 py-2.5 pr-8
                  bg-[#F0F4F8] border border-neutral-200 
                  text-sm rounded-lg 
                  text-neutral-700
                  focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent focus:bg-white
                  transition-all cursor-pointer
                  appearance-none
                ">








                
                <option value="">{t('filters.allCompanies')}</option>
                {companies.map((company) =>
                <option key={company} value={company}>
                    {company}
                  </option>
                )}
              </select>
              <ChevronDownIcon
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">{t('filters.user')}</label>
            <div className="relative">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="
                  w-full px-3 py-2.5 pr-8
                  bg-[#F0F4F8] border border-neutral-200 
                  text-sm rounded-lg 
                  text-neutral-700
                  focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent focus:bg-white
                  transition-all cursor-pointer
                  appearance-none
                ">








                
                <option value="">{t('filters.allUsers')}</option>
                {users.map((user) =>
                <option key={user} value={user}>
                    {user}
                  </option>
                )}
              </select>
              <ChevronDownIcon
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSaveFilter}
          className="
            flex-1 py-2.5 
            bg-[#2A5FB8] hover:bg-[#234d96]
            text-sm rounded-lg 
            text-white font-medium 
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-[#2A5FB8] focus:ring-offset-2
          ">







          
          {t('filters.saveFilter')}
        </button>
        <button
          onClick={handleClearAll}
          className="
            flex-1 py-2.5 
            bg-[#F0F4F8] hover:bg-neutral-200 
            border border-neutral-200 hover:border-neutral-300
            text-sm rounded-lg 
            text-neutral-700 font-medium 
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:ring-offset-2
          ">








          
          {t('filters.clearAll')}
        </button>
      </div>
    </div>);

}
