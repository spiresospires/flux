// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import { DocumentJourney } from './DocumentJourney';
import type { JourneyStep } from '../types/journey';

// The suite runs with `globals: false` (see vitest.config.ts), so Testing
// Library does NOT auto-register its cleanup. Without this, renders accumulate
// in document.body and every query after the first test finds duplicates.
// Every component test file needs this line.
afterEach(cleanup);

// Localisation is mocked to return the key: the assertions below deliberately
// target the parts that are NOT translated — the stage labels, which come from
// workspace configuration via props, and the visual treatment.
vi.mock('../contexts/LocalizationContext', () => ({
  useLocalization: () => ({ t: (key: string) => key, locale: 'en-GB', isReady: true }),
}));

const STEPS: JourneyStep[] = [
  { key: 'placeholder', label: 'Placeholder', icon: 'placeholder', earnedPercent: 0, status: 'Placeholder', date: '2026-01-01', revision: 'R1', actor: 'Sarah Johnson' },
  { key: 'uploaded', label: 'Uploaded (New)', icon: 'upload', earnedPercent: 10, status: 'New', date: '2026-02-01', revision: 'R1', actor: 'Sarah Johnson' },
  { key: 'review', label: 'Issued for Review', icon: 'review', earnedPercent: 25, status: 'Under Review', date: '2026-03-01', revision: 'R2', actor: 'Marco Rossi' },
  { key: 'rejected', label: 'Rejected w/ Comments (Revision Required)', icon: 'rejected', branch: 'rejection', date: '2026-03-15', revision: 'R2', actor: 'Marco Rossi', note: 'Rejected with 6 comments' },
  { key: 'approval', label: 'Issued for Approval', icon: 'approval', earnedPercent: 50, status: 'Approved', date: '2026-04-01', revision: 'R3', actor: 'Lisa Wong' },
  { key: 'construction', label: 'Issued for Construction', icon: 'construction', earnedPercent: 85, status: 'Issued' },
  { key: 'asBuilt', label: 'As-Built', icon: 'asBuilt', earnedPercent: 100 },
];

function stepItem(label: string) {
  return screen.getByText(label).closest('li') as HTMLElement;
}

describe('<DocumentJourney />', () => {
  it('renders the workspace vocabulary it is handed, in order', () => {
    // The component must never impose a ladder — labels are configuration.
    render(<DocumentJourney steps={STEPS} currentStatus="Approved" />);
    const labels = screen.getAllByRole('listitem').map((li) => li.textContent);

    expect(labels[0]).toContain('Placeholder');
    expect(labels[2]).toContain('Issued for Review');
    expect(labels[6]).toContain('As-Built');
  });

  it('badges the step matching the document status as current', () => {
    render(<DocumentJourney steps={STEPS} currentStatus="Approved" />);
    const current = stepItem('Issued for Approval');
    expect(within(current).getByText('journey.currentStatus')).toBeTruthy();

    // Exactly one badge — the marker must never appear twice.
    expect(screen.getAllByText('journey.currentStatus')).toHaveLength(1);
  });

  it('moves the badge when the document state changes', () => {
    // The "accepts the document's state as an input property" requirement.
    const { rerender } = render(<DocumentJourney steps={STEPS} currentStatus="Under Review" />);
    expect(within(stepItem('Issued for Review')).getByText('journey.currentStatus')).toBeTruthy();

    rerender(<DocumentJourney steps={STEPS} currentStatus="Issued" />);
    expect(within(stepItem('Issued for Construction')).getByText('journey.currentStatus')).toBeTruthy();
  });

  it('shows an earned percentage on rungs but not on the rejection branch', () => {
    render(<DocumentJourney steps={STEPS} currentStatus="Approved" />);

    expect(within(stepItem('Issued for Review')).getByText('25%')).toBeTruthy();
    expect(within(stepItem('As-Built')).getByText('100%')).toBeTruthy();

    const rejection = stepItem('Rejected w/ Comments (Revision Required)');
    expect(within(rejection).queryByText(/%$/)).toBeNull();
  });

  it('confines red styling to the rejection path', () => {
    // "Apply strict red accents exclusively to the rejection path."
    const { container } = render(<DocumentJourney steps={STEPS} currentStatus="Approved" />);
    const rejection = stepItem('Rejected w/ Comments (Revision Required)');
    const reds = container.querySelectorAll('[class*="rose"]');

    expect(reds.length).toBeGreaterThan(0);
    reds.forEach((el) => expect(rejection.contains(el)).toBe(true));
  });

  it('carries the rejection reason', () => {
    render(<DocumentJourney steps={STEPS} currentStatus="Approved" />);
    expect(within(stepItem('Rejected w/ Comments (Revision Required)')).getByText('Rejected with 6 comments')).toBeTruthy();
  });

  it('shows revision and actor only on stages actually reached', () => {
    render(<DocumentJourney steps={STEPS} currentStatus="Approved" />);

    expect(within(stepItem('Issued for Review')).getByText(/Marco Rossi/)).toBeTruthy();
    // Still ahead of the document — no metadata line at all.
    expect(within(stepItem('As-Built')).queryByText(/Rev /)).toBeNull();
  });

  it('sets no width of its own, so it stays fluid inside the panel', () => {
    // The panel is user-resizable; a hard-coded width would clip or overflow.
    const { container } = render(<DocumentJourney steps={STEPS} currentStatus="Approved" />);
    const section = container.querySelector('section') as HTMLElement;

    expect(section.className).toContain('w-full');
    expect(section.getAttribute('style')).toBeNull();
  });

  it('renders nothing when there is no journey', () => {
    const { container } = render(<DocumentJourney steps={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
