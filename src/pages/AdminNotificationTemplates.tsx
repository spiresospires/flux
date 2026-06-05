import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LeftRail } from '../components/LeftRail';
import { AdminContextLayout } from '../components/admin/AdminContextLayout';
import { useScope } from '../contexts/ScopeContext';
import { NotificationTemplateListPanel } from '../components/admin/notification/NotificationTemplateListPanel';
import { TemplateEditorWorkspace } from '../components/admin/notification/TemplateEditorWorkspace';
import { getInitialTemplates } from '../components/admin/notification/mockData';
import type { NotificationTemplate } from '../components/admin/notification/types';
import { useLocalization } from '../contexts/LocalizationContext';

function NotificationTemplatesContent({
  section,
  scopeLabel,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onChangeTemplate,
  onNewTemplate,
  onDuplicateTemplate,
  onArchiveTemplate,
  onDeleteTemplate,
  onSaveTemplate,
  onSaveAsTemplate,
}: {
  section: string;
  scopeLabel: string;
  templates: NotificationTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onChangeTemplate: (updatedTemplate: NotificationTemplate) => void;
  onNewTemplate: () => void;
  onDuplicateTemplate: () => void;
  onArchiveTemplate: () => void;
  onDeleteTemplate: () => void;
  onSaveTemplate: () => void;
  onSaveAsTemplate: () => void;
}) {
  const { t } = useLocalization();
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? templates[0],
    [templates, selectedTemplateId]
  );

  if (section === 'template-editor') {
    if (!selectedTemplate) {
      return (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          {t('admin.notifications.empty.noTemplates')}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <NotificationTemplateListPanel
          templates={templates}
          selectedTemplateId={selectedTemplate.id}
          onSelectTemplate={onSelectTemplate}
          onNewTemplate={onNewTemplate}
          onDuplicateTemplate={onDuplicateTemplate}
          onArchiveTemplate={onArchiveTemplate}
          onDeleteTemplate={onDeleteTemplate}
        />

        <TemplateEditorWorkspace
          template={selectedTemplate}
          scopeLabel={scopeLabel}
          onChangeTemplate={onChangeTemplate}
          onSaveTemplate={onSaveTemplate}
          onSaveAsTemplate={onSaveAsTemplate}
        />
      </div>
    );
  }

  if (section === 'template-list') {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">{t('admin.notifications.sections.templateList.title')}</h2>
        <p className="text-sm text-neutral-600">
          {t('admin.notifications.sections.templateList.description')}
        </p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          {t('admin.notifications.sections.templateList.guidance')}
        </div>
      </div>
    );
  }

  if (section === 'token-registry') {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">{t('admin.notifications.sections.tokenRegistry.title')}</h2>
        <p className="text-sm text-neutral-600">
          {t('admin.notifications.sections.tokenRegistry.description')}
        </p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          {t('admin.notifications.sections.tokenRegistry.placeholder')}
        </div>
      </div>
    );
  }

  if (section === 'visual-builder') {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">{t('admin.notifications.sections.visualBuilder.title')}</h2>
        <p className="text-sm text-neutral-600">
          {t('admin.notifications.sections.visualBuilder.description')}
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {t('admin.notifications.sections.visualBuilder.comingSoon')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-neutral-900">{t('admin.notifications.sections.default.title')}</h2>
      <p className="text-sm text-neutral-600">
        {t('admin.notifications.sections.default.description')}
      </p>
      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">{t('admin.notifications.table.columns.template')}</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">{t('admin.notifications.table.columns.channel')}</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">{t('admin.notifications.table.columns.trigger')}</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">{t('admin.notifications.table.columns.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            <tr>
              <td className="px-3 py-2">{t('admin.notifications.table.rows.documentDueReminder.template')}</td>
              <td className="px-3 py-2">{t('admin.notifications.table.rows.documentDueReminder.channel')}</td>
              <td className="px-3 py-2">{t('admin.notifications.table.rows.documentDueReminder.trigger')}</td>
              <td className="px-3 py-2">{t('admin.notifications.table.rows.documentDueReminder.status')}</td>
            </tr>
            <tr>
              <td className="px-3 py-2">{t('admin.notifications.table.rows.workflowAssignment.template')}</td>
              <td className="px-3 py-2">{t('admin.notifications.table.rows.workflowAssignment.channel')}</td>
              <td className="px-3 py-2">{t('admin.notifications.table.rows.workflowAssignment.trigger')}</td>
              <td className="px-3 py-2">{t('admin.notifications.table.rows.workflowAssignment.status')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminNotificationTemplates() {
  const { t, locale } = useLocalization();
  const { scope } = useScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSection = searchParams.get('section') ?? 'template-list';
  const localizedInitialTemplates = useMemo(() => getInitialTemplates(t, locale), [locale, t]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(localizedInitialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(localizedInitialTemplates[0]?.id ?? '');

  const templateNavItems = useMemo(
    () => [
      { id: 'template-list', label: t('admin.notifications.nav.templateList') },
      { id: 'template-editor', label: t('admin.notifications.nav.templateEditor') },
      { id: 'token-registry', label: t('admin.notifications.nav.tokenRegistry') },
      { id: 'visual-builder', label: t('admin.notifications.nav.visualBuilder') },
    ],
    [t]
  );

  const scopeLabel = scope.kind === 'project' ? scope.name : t('admin.notifications.allWorkspaces');

  const stamp = () =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date());

  const updateTemplate = (updatedTemplate: NotificationTemplate) => {
    setTemplates((previous) =>
      previous.map((template) => (template.id === updatedTemplate.id ? updatedTemplate : template))
    );
  };

  const createEmptyTemplate = () => {
    const id = `tpl-${Date.now()}`;
    const template: NotificationTemplate = {
      id,
      name: t('admin.notifications.defaults.newTemplateName'),
      description: t('admin.notifications.defaults.newTemplateDescription'),
      status: 'Draft',
      lastModified: stamp(),
      notificationType: 'Email',
      subjectHtml: t('admin.notifications.defaults.newTemplateSubject'),
      bodyHtml: t('admin.notifications.defaults.newTemplateBody'),
    };

    setTemplates((previous) => [template, ...previous]);
    setSelectedTemplateId(id);
  };

  const duplicateTemplate = () => {
    const source = templates.find((template) => template.id === selectedTemplateId);
    if (!source) return;
    const id = `tpl-${Date.now()}`;
    const copy: NotificationTemplate = {
      ...source,
      id,
      name: t('admin.notifications.defaults.copyTemplateName', { name: source.name }),
      status: 'Draft',
      lastModified: stamp(),
    };
    setTemplates((previous) => [copy, ...previous]);
    setSelectedTemplateId(id);
  };

  const archiveTemplate = () => {
    setTemplates((previous) =>
      previous.map((template) =>
        template.id === selectedTemplateId
          ? {
              ...template,
              status: 'Archived',
              lastModified: stamp(),
            }
          : template
      )
    );
  };

  const deleteTemplate = () => {
    setTemplates((previous) => {
      const next = previous.filter((template) => template.id !== selectedTemplateId);
      if (next.length > 0) {
        setSelectedTemplateId(next[0].id);
      }
      return next;
    });
  };

  const saveTemplate = () => {
    setTemplates((previous) =>
      previous.map((template) =>
        template.id === selectedTemplateId
          ? {
              ...template,
              status: template.status === 'Archived' ? 'Archived' : 'Active',
              lastModified: stamp(),
            }
          : template
      )
    );
  };

  const saveAsTemplate = () => {
    duplicateTemplate();
  };

  return (
    <div
      data-component="page-shell"
      className="h-[calc(100vh-60px)] mt-[60px] overflow-y-auto p-4"
      style={{ backgroundColor: 'var(--main-bg-color, #EAEEF6)' }}
    >
      <LeftRail activeItem="admin" onItemClick={() => {}} />

      <AdminContextLayout
        title={t('admin.notifications.layout.title')}
        description={t('admin.notifications.layout.description', { scope: scopeLabel })}
        navTitle={t('admin.notifications.layout.navTitle')}
        navItems={templateNavItems}
        activeNavId={currentSection}
        onNavSelect={(id) => setSearchParams({ section: id })}
      >
        <NotificationTemplatesContent
          section={currentSection}
          scopeLabel={scopeLabel}
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={setSelectedTemplateId}
          onChangeTemplate={updateTemplate}
          onNewTemplate={createEmptyTemplate}
          onDuplicateTemplate={duplicateTemplate}
          onArchiveTemplate={archiveTemplate}
          onDeleteTemplate={deleteTemplate}
          onSaveTemplate={saveTemplate}
          onSaveAsTemplate={saveAsTemplate}
        />
      </AdminContextLayout>
    </div>
  );
}
