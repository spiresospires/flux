// File-type → icon mapping, split out of DocumentCard.tsx so that module exports
// only components. A module that mixes component and non-component exports breaks
// React Fast Refresh (react-refresh/only-export-components); getFileTypeIcon is a
// helper, not a component, so it lives here alongside its private lookup table.

import {
  FileIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  FileBarChart2Icon,
  FileArchiveIcon,
  FileVideoIcon,
  FileImageIcon,
  FileCodeIcon,
  FileAudioIcon,
} from 'lucide-react';

// File type to icon mapping. Every entry (including the custom DWG SVG) is an
// anonymous factory, not a named component — keeping this module component-free so
// it can export the getFileTypeIcon helper without tripping Fast Refresh.
const fileTypeIconMap: Record<string, (props: { size?: number; className?: string }) => JSX.Element> = {
  PDF: (props) => <FileTextIcon {...props} className={"text-red-500 " + (props.className || "")} />,
  DOC: (props) => <FileTextIcon {...props} className={"text-blue-600 " + (props.className || "")} />,
  DOCX: (props) => <FileTextIcon {...props} className={"text-blue-600 " + (props.className || "")} />,
  XLS: (props) => <FileSpreadsheetIcon {...props} className={"text-green-600 " + (props.className || "")} />,
  XLSX: (props) => <FileSpreadsheetIcon {...props} className={"text-green-600 " + (props.className || "")} />,
  PPT: (props) => <FileBarChart2Icon {...props} className={"text-orange-500 " + (props.className || "")} />,
  PPTX: (props) => <FileBarChart2Icon {...props} className={"text-orange-500 " + (props.className || "")} />,
  ZIP: (props) => <FileArchiveIcon {...props} className={"text-yellow-600 " + (props.className || "")} />,
  RAR: (props) => <FileArchiveIcon {...props} className={"text-yellow-600 " + (props.className || "")} />,
  // Custom DWG (Autodesk) icon — inline SVG rather than a lucide glyph.
  DWG: (props) => (
    <svg width={props.size ?? 18} height={props.size ?? 18} viewBox="0 0 20 20" fill="none" className={props.className || ''} aria-label="DWG file icon">
      <rect x="2" y="3" width="16" height="14" rx="2" fill="#F3F4F6" stroke="#2563EB" strokeWidth="1.5" />
      <text x="10" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#2563EB" fontFamily="Arial, sans-serif">DWG</text>
    </svg>
  ),
  MP4: (props) => <FileVideoIcon {...props} className={"text-purple-500 " + (props.className || "")} />,
  AVI: (props) => <FileVideoIcon {...props} className={"text-purple-500 " + (props.className || "")} />,
  MOV: (props) => <FileVideoIcon {...props} className={"text-purple-500 " + (props.className || "")} />,
  JPG: (props) => <FileImageIcon {...props} className={"text-pink-500 " + (props.className || "")} />,
  JPEG: (props) => <FileImageIcon {...props} className={"text-pink-500 " + (props.className || "")} />,
  PNG: (props) => <FileImageIcon {...props} className={"text-pink-500 " + (props.className || "")} />,
  GIF: (props) => <FileImageIcon {...props} className={"text-pink-500 " + (props.className || "")} />,
  TXT: (props) => <FileTextIcon {...props} className={"text-neutral-500 " + (props.className || "")} />,
  CSV: (props) => <FileSpreadsheetIcon {...props} className={"text-green-600 " + (props.className || "")} />,
  JSON: (props) => <FileCodeIcon {...props} className={"text-neutral-500 " + (props.className || "")} />,
  XML: (props) => <FileCodeIcon {...props} className={"text-neutral-500 " + (props.className || "")} />,
  MP3: (props) => <FileAudioIcon {...props} className={"text-amber-600 " + (props.className || "")} />,
  WAV: (props) => <FileAudioIcon {...props} className={"text-amber-600 " + (props.className || "")} />,
};

export function getFileTypeIcon(fileType: string) {
  const ext = fileType.trim().toUpperCase();
  return fileTypeIconMap[ext] || ((props) => <FileIcon {...props} className={"text-neutral-400 " + (props.className || "")} />);
}
