import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon, CheckIcon } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';

interface ColorCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}

export function ColorCustomizer({ isOpen, onClose }: ColorCustomizerProps) {
  const { t } = useLocalization();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme | null) ?? 'light';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const select = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };

  const options: { id: Theme; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'light', label: t('appearance.light'), desc: t('appearance.lightDesc'), icon: SunIcon },
  { id: 'dark', label: t('appearance.dark'), desc: t('appearance.darkDesc'), icon: MoonIcon }];


  return (
    <AnimatePresence>
      {isOpen &&
      <>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40" />


          <motion.div
          initial={{ opacity: 0, x: -10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed left-12 bottom-4 z-50 bg-white border border-neutral-200 rounded-lg shadow-2xl w-64">

            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900">{t('appearance.title')}</h3>
            </div>
            <div className="p-2 space-y-1">
              {options.map((opt) => {
                const Icon = opt.icon;
                const active = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => select(opt.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-md transition-all ${
                    active ? 'bg-[#E8F1FB] border border-[#0461BA]' : 'hover:bg-[#F0F4F8] border border-transparent'}`
                    }>

                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${active ? 'bg-[#0461BA] text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-neutral-900">{opt.label}</div>
                      <div className="text-xs text-neutral-500">{opt.desc}</div>
                    </div>
                    {active && <CheckIcon size={16} className="text-[#0461BA]" />}
                  </button>);

              })}
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}

