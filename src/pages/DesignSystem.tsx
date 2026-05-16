import React from 'react';
import { ColorSwatch } from '../components/design-system/ColorSwatch';
import { ContrastChecker } from '../components/design-system/ContrastChecker';
import { ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocalization } from '../contexts/LocalizationContext';
export function DesignSystem() {
  const { t } = useLocalization();
  const primaryColors = [
  {
    name: '25',
    variable: '--color-primary-25',
    hex: '#F5F7FF'
  },
  {
    name: '50',
    variable: '--color-primary-50',
    hex: '#EBF0FF'
  },
  {
    name: '100',
    variable: '--color-primary-100',
    hex: '#D6E0FF'
  },
  {
    name: '200',
    variable: '--color-primary-200',
    hex: '#ADC2FF'
  },
  {
    name: '300',
    variable: '--color-primary-300',
    hex: '#85A3FF'
  },
  {
    name: '400',
    variable: '--color-primary-400',
    hex: '#5C85FF'
  },
  {
    name: '500',
    variable: '--color-primary-500',
    hex: '#0A1F8F'
  },
  {
    name: '600',
    variable: '--color-primary-600',
    hex: '#081975'
  },
  {
    name: '700',
    variable: '--color-primary-700',
    hex: '#06125C'
  },
  {
    name: '800',
    variable: '--color-primary-800',
    hex: '#040C42'
  },
  {
    name: '900',
    variable: '--color-primary-900',
    hex: '#020629'
  }];

  const secondaryColors = [
  {
    name: '25',
    variable: '--color-secondary-25',
    hex: '#F8FCFE'
  },
  {
    name: '50',
    variable: '--color-secondary-50',
    hex: '#F3F9FD'
  },
  {
    name: '100',
    variable: '--color-secondary-100',
    hex: '#E1F0FB'
  },
  {
    name: '200',
    variable: '--color-secondary-200',
    hex: '#D2E8F8'
  },
  {
    name: '300',
    variable: '--color-secondary-300',
    hex: '#A5D0F1'
  },
  {
    name: '400',
    variable: '--color-secondary-400',
    hex: '#78B9EA'
  },
  {
    name: '500',
    variable: '--color-secondary-500',
    hex: '#1E8ADC'
  },
  {
    name: '600',
    variable: '--color-secondary-600',
    hex: '#186EB0'
  },
  {
    name: '700',
    variable: '--color-secondary-700',
    hex: '#125384'
  },
  {
    name: '800',
    variable: '--color-secondary-800',
    hex: '#0C3758'
  },
  {
    name: '900',
    variable: '--color-secondary-900',
    hex: '#061C2C'
  }];

  const neutralColors = [
  {
    name: '25',
    variable: '--color-neutral-25',
    hex: '#FCFCFC'
  },
  {
    name: '50',
    variable: '--color-neutral-50',
    hex: '#F6F6F6'
  },
  {
    name: '100',
    variable: '--color-neutral-100',
    hex: '#EFEFEF'
  },
  {
    name: '200',
    variable: '--color-neutral-200',
    hex: '#E0E0E0'
  },
  {
    name: '300',
    variable: '--color-neutral-300',
    hex: '#C2C2C2'
  },
  {
    name: '400',
    variable: '--color-neutral-400',
    hex: '#A3A3A3'
  },
  {
    name: '500',
    variable: '--color-neutral-500',
    hex: '#676767'
  },
  {
    name: '600',
    variable: '--color-neutral-600',
    hex: '#282828'
  },
  {
    name: '700',
    variable: '--color-neutral-700',
    hex: '#1A1A1A'
  },
  {
    name: '800',
    variable: '--color-neutral-800',
    hex: '#0A0A0A'
  },
  {
    name: '900',
    variable: '--color-neutral-900',
    hex: '#050505'
  }];

  const semanticColors = [
  {
    name: t('designSystem.colorNames.error'),
    variable: '--color-error-500',
    hex: '#EF4444'
  },
  {
    name: t('designSystem.colorNames.warning'),
    variable: '--color-warning-500',
    hex: '#F59E0B'
  },
  {
    name: t('designSystem.colorNames.success'),
    variable: '--color-success-500',
    hex: '#10B981'
  }];

  const whiteColors = [
  {
    name: t('designSystem.colorNames.white'),
    variable: '--color-white',
    hex: '#FFFFFF'
  },
  {
    name: t('designSystem.colorNames.iceWhite'),
    variable: '--color-ice-white',
    hex: '#FCFCFD'
  }];

  const supportingColors = [
  {
    name: t('designSystem.colorNames.plum'),
    variable: '--color-plum-500',
    hex: '#8D477C'
  }];

  return (
    <div className="min-h-screen bg-neutral-25 font-sans text-neutral-800">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 hover:bg-[#F0F4F8] rounded-full transition-colors text-neutral-500 hover:text-neutral-900">
              
              <ArrowLeftIcon size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">
                {t('designSystem.title')}
              </h1>
              <p className="text-sm text-neutral-500">
                {t('designSystem.subtitle')}
              </p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-neutral-600">
            <a
              href="#primary"
              className="hover:text-primary-500 transition-colors">
              
              {t('designSystem.nav.primary')}
            </a>
            <a
              href="#secondary"
              className="hover:text-primary-500 transition-colors">
              
              {t('designSystem.nav.secondary')}
            </a>
            <a
              href="#neutral"
              className="hover:text-primary-500 transition-colors">
              
              {t('designSystem.nav.neutral')}
            </a>
            <a
              href="#semantic"
              className="hover:text-primary-500 transition-colors">
              
              {t('designSystem.nav.semantic')}
            </a>
            <a
              href="#accessibility"
              className="hover:text-primary-500 transition-colors">
              
              {t('designSystem.nav.accessibility')}
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        {/* Intro */}
        <section className="max-w-3xl">
          <h2 className="text-3xl font-bold text-neutral-900 mb-6">{t('designSystem.overview.title')}</h2>
          <p className="text-lg text-neutral-600 leading-relaxed mb-4">
            {t('designSystem.overview.body')}
          </p>
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success-500"></span>
              <span className="text-sm text-neutral-600">
                {t('designSystem.overview.wcag')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-500"></span>
              <span className="text-sm text-neutral-600">
                {t('designSystem.overview.themeable')}
              </span>
            </div>
          </div>
        </section>

        {/* Primary Palette */}
        <section id="primary" className="scroll-mt-24">
          <div className="flex items-baseline justify-between mb-8 border-b border-neutral-200 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900">
                {t('designSystem.primary.title')}
              </h3>
              <p className="text-neutral-500 mt-1">
                {t('designSystem.primary.subtitle')}
              </p>
            </div>
            <code className="text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-600">
              --color-primary-*
            </code>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {primaryColors.map((color) =>
            <ColorSwatch key={color.name} {...color} />
            )}
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h4 className="font-semibold text-neutral-900 mb-4">
              {t('designSystem.primary.guidelines')}
            </h4>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h5 className="text-sm font-medium text-success-700 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500"></span>{' '}
                  {t('designSystem.primary.do')}
                </h5>
                <ul className="space-y-2 text-sm text-neutral-600 list-disc list-inside">
                  <li>
                    {t('designSystem.primary.do1')}
                  </li>
                  <li>
                    {t('designSystem.primary.do2')}
                  </li>
                  <li>
                    {t('designSystem.primary.do3')}
                  </li>
                  <li>
                    {t('designSystem.primary.do4')}
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-error-700 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-error-500"></span>{' '}
                  {t('designSystem.primary.dont')}
                </h5>
                <ul className="space-y-2 text-sm text-neutral-600 list-disc list-inside">
                  <li>{t('designSystem.primary.dont1')}</li>
                  <li>{t('designSystem.primary.dont2')}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary Palette */}
        <section id="secondary" className="scroll-mt-24">
          <div className="flex items-baseline justify-between mb-8 border-b border-neutral-200 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900">
                {t('designSystem.secondary.title')}
              </h3>
              <p className="text-neutral-500 mt-1">
                {t('designSystem.secondary.subtitle')}
              </p>
            </div>
            <code className="text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-600">
              --color-secondary-*
            </code>
          </div>

          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8 flex items-start gap-3">
            <span className="text-warning-600 mt-0.5">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-warning-800">
                {t('designSystem.secondary.constraintTitle')}
              </h4>
              <p className="text-sm text-warning-700 mt-1">
                {t('designSystem.secondary.constraintBody')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {secondaryColors.map((color) =>
            <ColorSwatch key={color.name} {...color} />
            )}
          </div>
        </section>

        {/* Neutral Palette */}
        <section id="neutral" className="scroll-mt-24">
          <div className="flex items-baseline justify-between mb-8 border-b border-neutral-200 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900">
                {t('designSystem.neutral.title')}
              </h3>
              <p className="text-neutral-500 mt-1">
                {t('designSystem.neutral.subtitle')}
              </p>
            </div>
            <code className="text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-600">
              --color-neutral-*
            </code>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {neutralColors.map((color) =>
            <ColorSwatch key={color.name} {...color} />
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h4 className="font-semibold text-neutral-900 mb-4">
                {t('designSystem.neutral.typographyMapping')}
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">{t('designSystem.neutral.headings')}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-neutral-900 rounded border border-neutral-200"></span>
                    <code className="text-xs text-neutral-700">
                      Neutral 900
                    </code>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">{t('designSystem.neutral.bodyText')}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-neutral-700 rounded border border-neutral-200"></span>
                    <code className="text-xs text-neutral-700">
                      Neutral 700
                    </code>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">
                    {t('designSystem.neutral.subtitlesHints')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#F0F4F8]0 rounded border border-neutral-200"></span>
                    <code className="text-xs text-neutral-700">
                      Neutral 500
                    </code>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h4 className="font-semibold text-neutral-900 mb-4">
                {t('designSystem.neutral.structureMapping')}
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">
                    {t('designSystem.neutral.pageBackground')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-neutral-25 rounded border border-neutral-200"></span>
                    <code className="text-xs text-neutral-700">Neutral 25</code>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">
                    {t('designSystem.neutral.bordersDividers')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-neutral-200 rounded border border-neutral-200"></span>
                    <code className="text-xs text-neutral-700">
                      Neutral 200
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Whites & Supporting */}
        <section className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 mb-6">{t('designSystem.whites.title')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {whiteColors.map((color) =>
              <ColorSwatch key={color.name} {...color} />
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-4">
              {t('designSystem.whites.body')}
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 mb-6">
              {t('designSystem.supporting.title')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {supportingColors.map((color) =>
              <ColorSwatch key={color.name} {...color} />
              )}
            </div>
          </div>
        </section>

        {/* Semantic Palette */}
        <section id="semantic" className="scroll-mt-24">
          <div className="flex items-baseline justify-between mb-8 border-b border-neutral-200 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900">
                {t('designSystem.semantic.title')}
              </h3>
              <p className="text-neutral-500 mt-1">{t('designSystem.semantic.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Error */}
            <div className="space-y-4">
              <h4 className="font-semibold text-error-700">{t('designSystem.semantic.error')}</h4>
              <div className="grid gap-2">
                <ColorSwatch
                  name="500"
                  variable="--color-error-500"
                  hex="#EF4444" />
                
                <ColorSwatch
                  name="50"
                  variable="--color-error-50"
                  hex="#FEF2F2" />
                
              </div>
              <p className="text-xs text-neutral-500">
                {t('designSystem.semantic.errorBody')}
              </p>
            </div>

            {/* Warning */}
            <div className="space-y-4">
              <h4 className="font-semibold text-warning-700">{t('designSystem.semantic.warning')}</h4>
              <div className="grid gap-2">
                <ColorSwatch
                  name="500"
                  variable="--color-warning-500"
                  hex="#F59E0B" />
                
                <ColorSwatch
                  name="50"
                  variable="--color-warning-50"
                  hex="#FFFBEB" />
                
              </div>
              <p className="text-xs text-neutral-500">
                {t('designSystem.semantic.warningBody')}
              </p>
            </div>

            {/* Success */}
            <div className="space-y-4">
              <h4 className="font-semibold text-success-700">{t('designSystem.semantic.success')}</h4>
              <div className="grid gap-2">
                <ColorSwatch
                  name="500"
                  variable="--color-success-500"
                  hex="#10B981" />
                
                <ColorSwatch
                  name="50"
                  variable="--color-success-50"
                  hex="#ECFDF5" />
                
              </div>
              <p className="text-xs text-neutral-500">
                {t('designSystem.semantic.successBody')}
              </p>
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section id="accessibility" className="scroll-mt-24">
          <div className="flex items-baseline justify-between mb-8 border-b border-neutral-200 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900">
                {t('designSystem.accessibility.title')}
              </h3>
              <p className="text-neutral-500 mt-1">
                {t('designSystem.accessibility.subtitle')}
              </p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            <ContrastChecker
              backgrounds={[
              {
                name: 'White',
                hex: '#FFFFFF',
                variable: '--color-white'
              },
              {
                name: 'Neutral 50',
                hex: '#F6F6F6',
                variable: '--color-neutral-50'
              },
              {
                name: 'Primary 50',
                hex: '#EBF0FF',
                variable: '--color-primary-50'
              },
              {
                name: 'Primary 500',
                hex: '#0A1F8F',
                variable: '--color-primary-500'
              },
              {
                name: 'Neutral 900',
                hex: '#050505',
                variable: '--color-neutral-900'
              }]
              }
              foregrounds={[
              {
                name: 'Neutral 900',
                hex: '#050505',
                variable: '--color-neutral-900'
              },
              {
                name: 'Neutral 700',
                hex: '#1A1A1A',
                variable: '--color-neutral-700'
              },
              {
                name: 'Neutral 500',
                hex: '#676767',
                variable: '--color-neutral-500'
              },
              {
                name: 'Primary 500',
                hex: '#0A1F8F',
                variable: '--color-primary-500'
              },
              {
                name: t('designSystem.colorNames.white'),
                hex: '#FFFFFF',
                variable: '--color-white'
              }]
              } />
            
          </div>
          <p className="text-sm text-neutral-500 mt-4">
            <strong>{t('designSystem.accessibility.note')}</strong> {t('designSystem.accessibility.noteBody')}
          </p>
        </section>
      </main>
    </div>);

}
