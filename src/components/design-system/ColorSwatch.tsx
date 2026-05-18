import React from 'react';
interface ColorSwatchProps {
  name: string;
  variable: string;
  hex: string;
  showContrast?: boolean;
  baseHex?: string; // For contrast checking against base if needed, though we usually check against white/black
}
function getContrastRatio(hex1: string, hex2: string) {
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = rgb >> 16 & 0xff;
    const g = rgb >> 8 & 0xff;
    const b = rgb >> 0 & 0xff;
    const [lr, lg, lb] = [r, g, b].map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  };
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio.toFixed(2);
}
export function ColorSwatch({
  name,
  variable,
  hex
}: ColorSwatchProps) {
  const contrastWhite = getContrastRatio(hex, '#FFFFFF');
  // Determine best text color based on contrast
  const bestTextColor =
  parseFloat(contrastWhite) >= 4.5 ? 'text-white' : 'text-neutral-900';
  const ringColor =
  hex.toLowerCase() === '#ffffff' ? 'ring-1 ring-neutral-200' : '';
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`h-24 w-full rounded-lg shadow-sm flex flex-col justify-end p-3 transition-transform hover:scale-[1.02] ${ringColor}`}
        style={{
          backgroundColor: `var(${variable})`
        }}>
        
        <div
          className={`text-xs font-medium ${bestTextColor} flex justify-between items-end`}>
          
          <span className="opacity-90">{name}</span>
          {parseFloat(contrastWhite) >= 4.5 &&
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] backdrop-blur-sm">
              AA
            </span>
          }
        </div>
      </div>
      <div className="flex flex-col px-1">
        <div className="flex justify-between items-center">
          <code className="text-xs font-mono text-neutral-500">{hex}</code>
          <code className="text-[10px] text-neutral-400">
            {variable.replace('--color-', '')}
          </code>
        </div>
      </div>
    </div>);

}