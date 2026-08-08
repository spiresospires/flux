interface ContrastCheckerProps {
  backgrounds: Array<{
    name: string;
    hex: string;
    variable: string;
  }>;
  foregrounds: Array<{
    name: string;
    hex: string;
    variable: string;
  }>;
}
export function ContrastChecker({
  backgrounds,
  foregrounds
}: ContrastCheckerProps) {
  const getContrastRatio = (hex1: string, hex2: string) => {
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
    return ratio;
  };
  const getRating = (ratio: number) => {
    if (ratio >= 7)
    return {
      label: 'AAA',
      color: 'bg-success-100 text-success-700 border-success-200'
    };
    if (ratio >= 4.5)
    return {
      label: 'AA',
      color: 'bg-success-50 text-success-600 border-success-200'
    };
    if (ratio >= 3)
    return {
      label: 'AA Large',
      color: 'bg-warning-50 text-warning-700 border-warning-200'
    };
    return {
      label: 'Fail',
      color: 'bg-error-50 text-error-600 border-error-200'
    };
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr>
            <th className="p-3 border-b border-neutral-200 bg-[#F0F4F8] font-medium text-neutral-500">
              Text / Bg
            </th>
            {backgrounds.map((bg) =>
            <th
              key={bg.name}
              className="p-3 border-b border-neutral-200 bg-[#F0F4F8] font-medium text-neutral-500 min-w-[120px]">
              
                <div className="flex items-center gap-2">
                  <div
                  className="w-4 h-4 rounded border border-neutral-200"
                  style={{
                    backgroundColor: bg.hex
                  }} />
                
                  {bg.name}
                </div>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {foregrounds.map((fg) =>
          <tr
            key={fg.name}
            className="border-b border-neutral-100 hover:bg-neutral-25">
            
              <td className="p-3 font-medium text-neutral-700">
                <div className="flex items-center gap-2">
                  <div
                  className="w-4 h-4 rounded border border-neutral-200"
                  style={{
                    backgroundColor: fg.hex
                  }} />
                
                  {fg.name}
                </div>
              </td>
              {backgrounds.map((bg) => {
              const ratio = getContrastRatio(fg.hex, bg.hex);
              const rating = getRating(ratio);
              return (
                <td key={`${fg.name}-${bg.name}`} className="p-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs text-neutral-600">
                        {ratio.toFixed(2)}:1
                      </span>
                      <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border w-fit ${rating.color}`}>
                      
                        {rating.label}
                      </span>
                    </div>
                  </td>);

            })}
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}
