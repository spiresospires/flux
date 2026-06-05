import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRingIcon,
  BotIcon,
  FileTextIcon,
  FolderCogIcon,
  KeyRoundIcon,
  ScrollTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SignatureIcon,
  SparklesIcon,
  UserCogIcon,
  WorkflowIcon,
  EyeIcon,
  BlocksIcon,
  CopyPlusIcon,
  SearchIcon,
} from 'lucide-react';
import { LeftRail } from '../components/LeftRail';
import { AdminSection, type AdminSectionItem } from '../components/admin/AdminSection';
import { useScope } from '../contexts/ScopeContext';
import { useLocalization } from '../contexts/LocalizationContext';

interface AdminGroup {
  id: string;
  title: string;
  description: string;
  items: AdminSectionItem[];
}

export function Admin() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { scope } = useScope();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  // Placeholder until role context is implemented.
  const isEnterpriseAdmin = true;
  const isAllWorkspaces = scope.kind === 'enterprise';

  const headingSuffix = useMemo(() => {
    if (isAllWorkspaces && isEnterpriseAdmin) {
      return { label: t('admin.landing.enterpriseLabel'), accent: true };
    }

    if (scope.kind === 'project') {
      return { label: scope.name, accent: false };
    }

    return null;
  }, [isAllWorkspaces, isEnterpriseAdmin, scope, t]);

  const quickSuggestions = useMemo(
    () => [
      t('admin.landing.quickSuggestions.notifications'),
      t('admin.landing.quickSuggestions.activityTypes'),
      t('admin.landing.quickSuggestions.metadata'),
      t('admin.landing.quickSuggestions.renditions'),
      t('admin.landing.quickSuggestions.aiSettings'),
      t('admin.landing.quickSuggestions.permissions'),
    ],
    [t]
  );

  const adminGroups = useMemo<AdminGroup[]>(() => {
    const workspaceItems: AdminSectionItem[] = [
      {
        id: 'workspace-settings',
        icon: FolderCogIcon,
        title: t('admin.landing.groups.workspaceConfig.items.workspaceSettings.title'),
        description: t('admin.landing.groups.workspaceConfig.items.workspaceSettings.description'),
        status: t('admin.landing.status.active'),
      },
      {
        id: 'metadata-properties',
        icon: BlocksIcon,
        title: t('admin.landing.groups.workspaceConfig.items.metadataProperties.title'),
        description: t('admin.landing.groups.workspaceConfig.items.metadataProperties.description'),
        status: t('admin.landing.status.active'),
      },
      {
        id: 'workspace-cloning',
        icon: CopyPlusIcon,
        title: t('admin.landing.groups.workspaceConfig.items.workspaceCloning.title'),
        description: t('admin.landing.groups.workspaceConfig.items.workspaceCloning.description'),
        status: isAllWorkspaces
          ? t('admin.landing.status.workspaceScopeRequired')
          : t('admin.landing.status.overview'),
        disabled: isAllWorkspaces,
      },
    ];

    return [
      {
        id: 'workspace-config',
        title: t('admin.landing.groups.workspaceConfig.title'),
        description: t('admin.landing.groups.workspaceConfig.description'),
        items: workspaceItems,
      },
      {
        id: 'communication',
        title: t('admin.landing.groups.communication.title'),
        description: t('admin.landing.groups.communication.description'),
        items: [
          {
            id: 'notification-templates',
            icon: BellRingIcon,
            title: t('admin.landing.groups.communication.items.notificationTemplates.title'),
            description: t('admin.landing.groups.communication.items.notificationTemplates.description'),
            status: t('admin.landing.status.foundation'),
            onClick: () => navigate('/admin/notification-templates'),
          },
          {
            id: 'distribution-rules',
            icon: WorkflowIcon,
            title: t('admin.landing.groups.communication.items.distributionRules.title'),
            description: t('admin.landing.groups.communication.items.distributionRules.description'),
            status: t('admin.landing.status.planned'),
          },
          {
            id: 'delivery-channels',
            icon: FileTextIcon,
            title: t('admin.landing.groups.communication.items.deliveryChannels.title'),
            description: t('admin.landing.groups.communication.items.deliveryChannels.description'),
            status: t('admin.landing.status.planned'),
          },
          {
            id: 'email-configuration',
            icon: SignatureIcon,
            title: t('admin.landing.groups.communication.items.emailConfiguration.title'),
            description: t('admin.landing.groups.communication.items.emailConfiguration.description'),
            comingSoon: true,
          },
        ],
      },
      {
        id: 'activity-management',
        title: t('admin.landing.groups.activityManagement.title'),
        description: t('admin.landing.groups.activityManagement.description'),
        items: [
          {
            id: 'activity-types',
            icon: ScrollTextIcon,
            title: t('admin.landing.groups.activityManagement.items.activityTypes.title'),
            description: t('admin.landing.groups.activityManagement.items.activityTypes.description'),
            status: t('admin.landing.status.active'),
          },
          {
            id: 'workflow-rules',
            icon: Settings2Icon,
            title: t('admin.landing.groups.activityManagement.items.workflowRules.title'),
            description: t('admin.landing.groups.activityManagement.items.workflowRules.description'),
            status: t('admin.landing.status.planned'),
          },
          {
            id: 'automation',
            icon: SparklesIcon,
            title: t('admin.landing.groups.activityManagement.items.automation.title'),
            description: t('admin.landing.groups.activityManagement.items.automation.description'),
            comingSoon: true,
          },
        ],
      },
      {
        id: 'viewer-docs',
        title: t('admin.landing.groups.viewerDocs.title'),
        description: t('admin.landing.groups.viewerDocs.description'),
        items: [
          {
            id: 'viewer-settings',
            icon: EyeIcon,
            title: t('admin.landing.groups.viewerDocs.items.viewerSettings.title'),
            description: t('admin.landing.groups.viewerDocs.items.viewerSettings.description'),
            status: t('admin.landing.status.planned'),
          },
          {
            id: 'renditions',
            icon: FileTextIcon,
            title: t('admin.landing.groups.viewerDocs.items.renditions.title'),
            description: t('admin.landing.groups.viewerDocs.items.renditions.description'),
            status: t('admin.landing.status.planned'),
          },
          {
            id: 'markups',
            icon: SignatureIcon,
            title: t('admin.landing.groups.viewerDocs.items.markups.title'),
            description: t('admin.landing.groups.viewerDocs.items.markups.description'),
            comingSoon: true,
          },
        ],
      },
      {
        id: 'ai-automation',
        title: t('admin.landing.groups.aiAutomation.title'),
        description: t('admin.landing.groups.aiAutomation.description'),
        items: [
          {
            id: 'indexable-workspaces',
            icon: BotIcon,
            title: t('admin.landing.groups.aiAutomation.items.indexableWorkspaces.title'),
            description: t('admin.landing.groups.aiAutomation.items.indexableWorkspaces.description'),
            status: t('admin.landing.status.foundation'),
          },
          {
            id: 'ai-settings',
            icon: SparklesIcon,
            title: t('admin.landing.groups.aiAutomation.items.aiSettings.title'),
            description: t('admin.landing.groups.aiAutomation.items.aiSettings.description'),
            comingSoon: true,
          },
        ],
      },
      {
        id: 'security-access',
        title: t('admin.landing.groups.securityAccess.title'),
        description: t('admin.landing.groups.securityAccess.description'),
        items: [
          {
            id: 'users-roles',
            icon: UserCogIcon,
            title: t('admin.landing.groups.securityAccess.items.usersRoles.title'),
            description: t('admin.landing.groups.securityAccess.items.usersRoles.description'),
            comingSoon: true,
          },
          {
            id: 'permissions',
            icon: ShieldCheckIcon,
            title: t('admin.landing.groups.securityAccess.items.permissions.title'),
            description: t('admin.landing.groups.securityAccess.items.permissions.description'),
            comingSoon: true,
          },
          {
            id: 'sso-audit',
            icon: KeyRoundIcon,
            title: t('admin.landing.groups.securityAccess.items.ssoAudit.title'),
            description: t('admin.landing.groups.securityAccess.items.ssoAudit.description'),
            comingSoon: true,
          },
        ],
      },
    ];
  }, [isAllWorkspaces, navigate, t]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedSearch) {
      return adminGroups;
    }

    return adminGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const haystack = `${group.title} ${group.description} ${item.title} ${item.description}`.toLowerCase();
          return haystack.includes(normalizedSearch);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [adminGroups, normalizedSearch]);

  return (
    <div
      data-component="page-shell"
      className="h-[calc(100vh-60px)] mt-[60px] overflow-y-auto p-4"
      style={{ backgroundColor: 'var(--main-bg-color, #EAEEF6)' }}
    >
      <LeftRail activeItem="admin" onItemClick={() => {}} />

      <main className="ml-[var(--left-rail-width,88px)]">
        <div className="space-y-4">
          <header className="rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-md">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">
                {t('admin.landing.title')}
                {headingSuffix ? (
                  <span className={headingSuffix.accent ? 'text-[#0461BA]' : 'text-neutral-900'}> - {headingSuffix.label}</span>
                ) : null}
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                {t('admin.landing.subtitle')}
              </p>
            </div>
          </header>

          <section className="rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
            <div className="space-y-2">
              <div className="relative max-w-xl">
                <SearchIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSelectedSuggestion(null);
                  }}
                  placeholder={t('admin.landing.searchPlaceholder')}
                  className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#0461BA] focus:outline-none focus:ring-2 focus:ring-[#0461BA]/20"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion) => {
                  const isActive = selectedSuggestion === suggestion;
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setSelectedSuggestion(suggestion);
                        setSearchTerm(suggestion);
                      }}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#E8F1FB] text-[#0461BA]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {suggestion}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="space-y-4 pb-4">
            {filteredGroups.map((group) => (
              <AdminSection
                key={group.id}
                title={group.title}
                description={group.description}
                items={group.items}
              />
            ))}

            {filteredGroups.length === 0 ? (
              <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-neutral-900">{t('admin.landing.empty.title')}</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {t('admin.landing.empty.description')}
                </p>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
