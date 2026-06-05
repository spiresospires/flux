import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  SaveIcon,
  UnderlineIcon,
  EyeIcon,
  CopyPlusIcon,
} from 'lucide-react';
import type { NotificationTemplate, NotificationType } from './types';
import { useLocalization } from '../../../contexts/LocalizationContext';

interface TemplateEditorWorkspaceProps {
  template: NotificationTemplate;
  scopeLabel: string;
  onChangeTemplate: (updatedTemplate: NotificationTemplate) => void;
  onSaveTemplate: () => void;
  onSaveAsTemplate: () => void;
}

type TokenKind = 'inline' | 'region-start' | 'region-end';

interface TokenOption {
  key: string;
  label: string;
  kind?: TokenKind;
}

const PREVIEW_VALUES: Record<string, string> = {
  'recipient.displayName': 'Avery Walker',
  'document.number': 'DOC-4127-A',
  'workspace.name': 'The Shard, London',
  'activity.name': 'Approval Review',
  'date.today': '04 Jun 2026',
  'date.due': '06 Jun 2026',
  'entry.link': 'https://flux.example.com/entry/8472',
  'document.title': 'General Arrangement Plan',
  'document.revision': 'C02',
  'image.placeholder': '[Image Placeholder]',
};

function createTokenNode(token: string, label: string, kind: TokenKind = 'inline') {
  const chip = document.createElement('span');
  chip.setAttribute('contenteditable', 'false');
  chip.setAttribute('data-token', token);
  chip.setAttribute('data-token-kind', kind);
  chip.className =
    kind === 'inline'
      ? 'mx-[1px] inline-flex items-center rounded-full border border-[#BFD7F2] bg-[#E8F1FB] px-2 py-0.5 text-xs italic text-[#1B4B84]'
      : 'mx-[1px] inline-flex items-center rounded border border-[#C4D8EE] bg-[#F3F8FD] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#335D88]';
  chip.textContent = `[${label}]`;
  return chip;
}

function insertNodeAtCursor(editor: HTMLDivElement, node: Node) {
  editor.focus();
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  let range: Range;
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
  } else {
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
  }

  range.deleteContents();
  range.insertNode(node);
  const spacer = document.createTextNode(' ');
  node.after(spacer);

  range.setStartAfter(spacer);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function renderPreviewHtml(
  html: string,
  labels: {
    startDocumentList: string;
    endDocumentList: string;
  }
) {
  const container = document.createElement('div');
  container.innerHTML = html;

  container.querySelectorAll('span[data-token]').forEach((chip) => {
    const token = chip.getAttribute('data-token') || '';
    const kind = chip.getAttribute('data-token-kind') as TokenKind | null;

    if (kind === 'region-start') {
      chip.replaceWith(document.createTextNode(`----- ${labels.startDocumentList} -----`));
      return;
    }

    if (kind === 'region-end') {
      chip.replaceWith(document.createTextNode(`----- ${labels.endDocumentList} -----`));
      return;
    }

    chip.replaceWith(document.createTextNode(PREVIEW_VALUES[token] || `[${token}]`));
  });

  return container.innerHTML;
}

export function TemplateEditorWorkspace({
  template,
  scopeLabel,
  onChangeTemplate,
  onSaveTemplate,
  onSaveAsTemplate,
}: TemplateEditorWorkspaceProps) {
  const { t } = useLocalization();
  const [showPreview, setShowPreview] = useState(false);
  const subjectRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const subjectTokens = useMemo<TokenOption[]>(() => [
    { key: 'recipient.displayName', label: t('admin.notifications.tokens.subject.recipient') },
    { key: 'document.number', label: t('admin.notifications.tokens.subject.documentProperty') },
    { key: 'workspace.name', label: t('admin.notifications.tokens.subject.workspace') },
    { key: 'activity.name', label: t('admin.notifications.tokens.subject.activity') },
    { key: 'date.today', label: t('admin.notifications.tokens.subject.date') },
  ], [t]);

  const bodyTokens = useMemo<TokenOption[]>(() => [
    { key: 'recipient.displayName', label: t('admin.notifications.tokens.body.recipient') },
    { key: 'entry.link', label: t('admin.notifications.tokens.body.entryLink') },
    { key: 'document.list.region', label: t('admin.notifications.tokens.body.documentList') },
    { key: 'document.number', label: t('admin.notifications.tokens.body.documentProperty') },
    { key: 'image.placeholder', label: t('admin.notifications.tokens.body.image') },
  ], [t]);

  useEffect(() => {
    if (subjectRef.current && subjectRef.current.innerHTML !== template.subjectHtml) {
      subjectRef.current.innerHTML = template.subjectHtml;
    }
    if (bodyRef.current && bodyRef.current.innerHTML !== template.bodyHtml) {
      bodyRef.current.innerHTML = template.bodyHtml;
    }
  }, [template]);

  const previewSubject = useMemo(
    () =>
      renderPreviewHtml(template.subjectHtml, {
        startDocumentList: t('admin.notifications.tokens.body.startDocumentList'),
        endDocumentList: t('admin.notifications.tokens.body.endDocumentList'),
      }),
    [template.subjectHtml, t]
  );
  const previewBody = useMemo(
    () =>
      renderPreviewHtml(template.bodyHtml, {
        startDocumentList: t('admin.notifications.tokens.body.startDocumentList'),
        endDocumentList: t('admin.notifications.tokens.body.endDocumentList'),
      }),
    [template.bodyHtml, t]
  );

  const updateTemplate = (updates: Partial<NotificationTemplate>) => {
    onChangeTemplate({
      ...template,
      ...updates,
      lastModified: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
  };

  const insertSubjectToken = (token: TokenOption) => {
    if (!subjectRef.current) return;
    const chip = createTokenNode(token.key, token.label, token.kind || 'inline');
    insertNodeAtCursor(subjectRef.current, chip);
    updateTemplate({ subjectHtml: subjectRef.current.innerHTML });
  };

  const insertBodyToken = (token: TokenOption) => {
    if (!bodyRef.current) return;

    if (token.key === 'document.list.region') {
      insertNodeAtCursor(bodyRef.current, createTokenNode('document.list.start', t('admin.notifications.tokens.body.startDocumentList'), 'region-start'));
      insertNodeAtCursor(bodyRef.current, document.createElement('br'));
      insertNodeAtCursor(bodyRef.current, createTokenNode('document.list.end', t('admin.notifications.tokens.body.endDocumentList'), 'region-end'));
    } else {
      insertNodeAtCursor(bodyRef.current, createTokenNode(token.key, token.label, token.kind || 'inline'));
    }

    updateTemplate({ bodyHtml: bodyRef.current.innerHTML });
  };

  const runBodyCommand = (command: string, value?: string) => {
    bodyRef.current?.focus();
    document.execCommand(command, false, value);
    if (bodyRef.current) {
      updateTemplate({ bodyHtml: bodyRef.current.innerHTML });
    }
  };

  const insertHeading = () => runBodyCommand('formatBlock', 'h3');

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{t('admin.notifications.editor.detailsTitle')}</h2>
          <p className="mt-1 text-xs text-neutral-600">
            {t('admin.notifications.editor.detailsDescription')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onSaveTemplate} className="inline-flex items-center gap-1 rounded-md bg-[#0461BA] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0353A0]">
            <SaveIcon size={12} />
            {t('admin.notifications.editor.actions.save')}
          </button>
          <button type="button" onClick={onSaveAsTemplate} className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
            <CopyPlusIcon size={12} />
            {t('admin.notifications.editor.actions.saveAs')}
          </button>
          <button type="button" onClick={() => setShowPreview((prev) => !prev)} className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
            <EyeIcon size={12} />
            {t('admin.notifications.editor.actions.preview')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-xs font-medium text-neutral-700">
            {t('admin.notifications.editor.fields.templateName')}
            <input
              type="text"
              value={template.name}
              onChange={(event) => updateTemplate({ name: event.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:border-[#0461BA] focus:outline-none focus:ring-2 focus:ring-[#0461BA]/20"
            />
          </label>

          <label className="text-xs font-medium text-neutral-700">
            {t('admin.notifications.editor.fields.description')}
            <input
              type="text"
              value={template.description}
              onChange={(event) => updateTemplate({ description: event.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:border-[#0461BA] focus:outline-none focus:ring-2 focus:ring-[#0461BA]/20"
            />
          </label>

          <label className="text-xs font-medium text-neutral-700">
            {t('admin.notifications.editor.fields.notificationType')}
            <select
              value={template.notificationType}
              onChange={(event) => updateTemplate({ notificationType: event.target.value as NotificationType })}
              className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:border-[#0461BA] focus:outline-none focus:ring-2 focus:ring-[#0461BA]/20"
            >
              <option value="Email">{t('admin.notifications.editor.types.email')}</option>
              <option value="Digest">{t('admin.notifications.editor.types.digest')}</option>
              <option value="Push (Planned)">{t('admin.notifications.editor.types.pushPlanned')}</option>
            </select>
          </label>
        </div>

        <div className="rounded-lg border border-neutral-200 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('admin.notifications.editor.subjectTitle')}</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {subjectTokens.map((token) => (
                <button
                  key={token.key}
                  type="button"
                  onClick={() => insertSubjectToken(token)}
                  className="rounded-md border border-[#D6E6F7] bg-[#F2F8FF] px-2 py-1 text-[11px] font-medium text-[#1F5E9E] hover:bg-[#E8F1FB]"
                >
                  + {token.label}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={subjectRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={t('admin.notifications.editor.subjectAria')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
              }
            }}
            onInput={(event) => updateTemplate({ subjectHtml: event.currentTarget.innerHTML })}
            className="min-h-[42px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#0461BA]/20"
          />
        </div>

        <div className="rounded-lg border border-neutral-200 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('admin.notifications.editor.bodyTitle')}</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {bodyTokens.map((token) => (
                <button
                  key={token.key}
                  type="button"
                  onClick={() => insertBodyToken(token)}
                  className="rounded-md border border-[#D6E6F7] bg-[#F2F8FF] px-2 py-1 text-[11px] font-medium text-[#1F5E9E] hover:bg-[#E8F1FB]"
                >
                  + {token.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-1">
            <button type="button" onClick={() => runBodyCommand('bold')} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"><BoldIcon size={13} /></button>
            <button type="button" onClick={() => runBodyCommand('italic')} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"><ItalicIcon size={13} /></button>
            <button type="button" onClick={() => runBodyCommand('underline')} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"><UnderlineIcon size={13} /></button>
            <button type="button" onClick={insertHeading} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white">{t('admin.notifications.editor.toolbar.heading')}</button>
            <button type="button" onClick={() => runBodyCommand('insertUnorderedList')} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"><ListIcon size={13} /></button>
            <button type="button" onClick={() => runBodyCommand('insertOrderedList')} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"><ListOrderedIcon size={13} /></button>
            <button type="button" onClick={() => runBodyCommand('justifyLeft')} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"><AlignLeftIcon size={13} /></button>
            <button type="button" onClick={() => runBodyCommand('justifyCenter')} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"><AlignCenterIcon size={13} /></button>
            <button type="button" onClick={() => runBodyCommand('justifyRight')} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"><AlignRightIcon size={13} /></button>
            <button
              type="button"
              onClick={() => {
                const url = window.prompt(t('admin.notifications.editor.linkPrompt'));
                if (url) {
                  runBodyCommand('createLink', url);
                }
              }}
              className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"
            >
              <LinkIcon size={13} />
            </button>
            <button type="button" onClick={() => insertBodyToken({ key: 'image.placeholder', label: t('admin.notifications.tokens.body.image') })} className="rounded px-2 py-1 text-xs text-neutral-700 hover:bg-white"><ImageIcon size={13} /></button>
          </div>

          <div
            ref={bodyRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={t('admin.notifications.editor.bodyAria')}
            onInput={(event) => updateTemplate({ bodyHtml: event.currentTarget.innerHTML })}
            className="min-h-[260px] rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm leading-6 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#0461BA]/20"
          />
        </div>

        {showPreview ? (
          <section className="rounded-lg border border-[#D6E6F7] bg-[#F7FBFF] p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#245B90]">{t('admin.notifications.editor.previewTitle')}</h3>
            <div className="mt-2 space-y-2 text-sm text-neutral-800">
              <p><span className="font-semibold">{t('admin.notifications.editor.previewSubject')}</span> <span dangerouslySetInnerHTML={{ __html: previewSubject }} /></p>
              <div>
                <p className="font-semibold">{t('admin.notifications.editor.previewBody')}</p>
                <div className="mt-1 rounded border border-[#D6E6F7] bg-white p-3" dangerouslySetInnerHTML={{ __html: previewBody }} />
              </div>
            </div>
          </section>
        ) : null}

        <footer className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          {t('admin.notifications.editor.footerGuidance')}
          <span className="ml-2 font-medium text-neutral-700">{t('admin.notifications.editor.scopeLabel', { scope: scopeLabel })}</span>
        </footer>
      </div>
    </section>
  );
}
