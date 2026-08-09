// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, cleanup, fireEvent } from '@testing-library/react';
import { VersionStack } from './VersionStack';
import type { VersionStackEntry } from '../types/journey';

// See DocumentJourney.test.tsx — `globals: false` means cleanup is manual.
afterEach(cleanup);

vi.mock('../contexts/LocalizationContext', () => ({
  useLocalization: () => ({ t: (key: string) => key, locale: 'en-GB', isReady: true }),
}));

const openViewer = vi.fn();
vi.mock('../contexts/ViewerContext', () => ({
  useViewer: () => ({ openViewer, closeViewer: vi.fn(), toggleMaximised: vi.fn(), target: null, isMaximised: false }),
}));

/** The version-stack shape from MDR_AND_PROGRESS.md §4: a placeholder awaiting
 *  the revised deliverable, sitting on top of the revision that has content. */
const STACK: VersionStackEntry[] = [
  {
    id: 'v-2', revision: 'R2', status: 'Placeholder', date: '2026-05-14',
    author: 'Metso Outotec', fileType: '', fileSize: '',
    contentState: 'placeholder', isCurrent: true, note: 'Awaiting revised content after review',
  },
  {
    id: 'v-1', revision: 'R1', status: 'Under Review', date: '2026-03-02',
    author: 'Mike Chen', fileType: 'PDF', fileSize: '3.0 MB',
    contentState: 'content', isCurrent: false,
  },
];

const VIEWER_BASE = { docId: 'MR-PRO-DWG-203-R1', title: 'Conveyor CV-104 Profile', pageImage: '/page.png' };

function row(revision: string) {
  return screen.getByText(revision).closest('li') as HTMLElement;
}

describe('<VersionStack />', () => {
  it('lists every revision with its status', () => {
    render(<VersionStack versions={STACK} viewerBase={VIEWER_BASE} />);

    expect(within(row('R2')).getByText('Placeholder')).toBeTruthy();
    expect(within(row('R1')).getByText('Under Review')).toBeTruthy();
  });

  it('marks the top of the stack as current, and only that one', () => {
    render(<VersionStack versions={STACK} viewerBase={VIEWER_BASE} />);
    expect(screen.getAllByText('versionStack.current')).toHaveLength(1);
    expect(within(row('R2')).getByText('versionStack.current')).toBeTruthy();
  });

  it('says a placeholder version has no content instead of inventing a file', () => {
    render(<VersionStack versions={STACK} viewerBase={VIEWER_BASE} />);

    expect(within(row('R2')).getByText(/versionStack.noContent/)).toBeTruthy();
    expect(within(row('R1')).getByText(/PDF · 3.0 MB/)).toBeTruthy();
  });

  it('shows a placeholder on top of revisions that still have their file', () => {
    // "No content" and "has history" are both true at once — the empty top row
    // must not read as an empty stack.
    render(<VersionStack versions={STACK} viewerBase={VIEWER_BASE} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(within(row('R2')).getByText('Awaiting revised content after review')).toBeTruthy();
  });

  it('disables view and download on a placeholder version', () => {
    render(<VersionStack versions={STACK} viewerBase={VIEWER_BASE} />);

    const placeholderRow = row('R2');
    within(placeholderRow).getAllByRole('button').forEach((button) => {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });
    // The revision that has content keeps both actions.
    within(row('R1')).getAllByRole('button').forEach((button) => {
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it('opens the framed viewer for the revision that was clicked', () => {
    openViewer.mockClear();
    render(<VersionStack versions={STACK} viewerBase={VIEWER_BASE} />);

    fireEvent.click(within(row('R1')).getAllByRole('button')[0]);

    expect(openViewer).toHaveBeenCalledTimes(1);
    expect(openViewer).toHaveBeenCalledWith(
      expect.objectContaining({ docId: VIEWER_BASE.docId, revision: 'R1', fileType: 'PDF' })
    );
  });

  it('disables viewing when there is no page to show', () => {
    // Download is unaffected — it does not need a rendered page.
    render(<VersionStack versions={STACK} />);
    const [view, download] = within(row('R1')).getAllByRole('button') as HTMLButtonElement[];

    expect(view.disabled).toBe(true);
    expect(download.disabled).toBe(false);
  });

  it('handles an empty stack without rendering a broken grid', () => {
    render(<VersionStack versions={[]} />);
    expect(screen.getByText('versionStack.empty')).toBeTruthy();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
