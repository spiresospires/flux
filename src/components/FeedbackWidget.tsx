import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUpIcon, ThumbsDownIcon, XIcon, SendIcon, MessageSquareIcon } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Sentiment = 'positive' | 'negative';

interface FeedbackPayload {
  /** Human-readable page label e.g. "Dashboard", "Search" */
  context: string;
  /** URL pathname e.g. "/", "/search", "/documents" */
  route: string;
  sentiment: Sentiment;
  /** Free-text comment; empty string when not provided */
  comment: string;
  /** ISO 8601 UTC timestamp */
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE → CONTEXT KEY MAP
// Maps each app route to a localisation key under feedback.contexts.*
// Add new routes here as pages are added to the app.
// ─────────────────────────────────────────────────────────────────────────────

const ROUTE_CONTEXT_KEY: Record<string, string> = {
  '/':          'feedback.contexts.dashboard',
  '/documents': 'feedback.contexts.documentBrowsing',
  '/chat':      'feedback.contexts.chat',
  '/search':    'feedback.contexts.search',
  '/packages':  'feedback.contexts.packages',
};

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK SUBMISSION — PRODUCTION TODO
// ─────────────────────────────────────────────────────────────────────────────
//
// Currently: does nothing. The payload is logged to the browser console only
// so you can verify it looks right during development.
//
// TO WIRE FOR PRODUCTION — choose one approach:
//
// ── OPTION A: Backend API (recommended for production SaaS) ──────────────────
//
//   Replace the console.log below with:
//
//     import { apiClient } from '../api/client';
//     await apiClient.post('/feedback', payload);
//     // [API] POST /api/v1/feedback   [TODO-ENG]   [PHASE-1]
//
//   Then add a Spring Boot controller:
//     POST /api/v1/feedback  →  writes a row to the `user_feedback` table
//     or forwards to an internal notification service / Power Automate.
//
//   Benefits:
//     • Webhook URL stays server-side — never visible in the browser network tab.
//     • DevOps controls egress from one known API host.
//     • No CSP changes required.
//     • Can attach the authenticated user identity server-side.
//     • [AUTH] attach workspace token: headers: { Authorization: `Bearer ${token}` }
//
// ── OPTION B: Power Automate webhook (quick win, no backend needed) ───────────
//
//   1. In Power Automate: New flow → "When an HTTP request is received" trigger.
//   2. Add a step: "Add a row into a table" (Excel Online / SharePoint list).
//   3. Save and copy the generated HTTPS POST URL.
//   4. Add VITE_FEEDBACK_WEBHOOK_URL=<your-url> to .env.local
//   5. Replace the console.log with:
//
//     const webhookUrl = import.meta.env.VITE_FEEDBACK_WEBHOOK_URL;
//     if (webhookUrl) {
//       await fetch(webhookUrl, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
//     }
//
//   ⚠ CAUTION: The webhook URL will be visible in the browser network tab to any
//     user who opens DevTools. Acceptable for closed beta; move to Option A for
//     public launch or whenever the backend API is available.
//
// ── PAYLOAD CONTRACT (do not change field names without updating the backend) ──
//
//   {
//     context:   string             — page label ("Dashboard", "Search", …)
//     route:     string             — URL path ("/", "/search", "/documents", …)
//     sentiment: "positive" | "negative"
//     comment:   string             — free text; "" if none provided
//     timestamp: string             — ISO 8601 UTC, e.g. "2026-05-27T10:30:00.000Z"
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  // [MOCK] — swap this console.log for a real API call (see options above)
  console.log('[FeedbackWidget] Feedback captured (not submitted anywhere yet):', payload);

  // Simulate a short async pause so the UX transition feels deliberate,
  // not instantaneous. Remove once a real network call is in place.
  await new Promise<void>((resolve) => setTimeout(resolve, 350));
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function FeedbackWidget() {
  const { t } = useLocalization();
  const { pathname } = useLocation();

  const [isOpen, setIsOpen]         = useState(false);
  const [sentiment, setSentiment]   = useState<Sentiment | null>(null);
  const [comment, setComment]       = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDone, setIsDone]         = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resolve the human-readable context label for the current page.
  const contextKey = ROUTE_CONTEXT_KEY[pathname] ?? 'feedback.contexts.default';
  const contextLabel = t(contextKey);

  // Auto-focus the textarea when a sentiment is selected.
  useEffect(() => {
    if (sentiment && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [sentiment]);

  // After the "thank you" state, close the panel automatically.
  useEffect(() => {
    if (!isDone) return;
    const timer = setTimeout(() => {
      setIsOpen(false);
      // Reset state after the panel finishes its exit animation.
      setTimeout(reset, 300);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isDone]);

  function reset() {
    setSentiment(null);
    setComment('');
    setSubmitting(false);
    setIsDone(false);
  }

  function handleOpen() {
    reset();
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setTimeout(reset, 300);
  }

  function handleSentiment(s: Sentiment) {
    setSentiment(s);
  }

  async function handleSubmit() {
    if (!sentiment) return;
    setSubmitting(true);

    await submitFeedback({
      context:   contextLabel,
      route:     pathname,
      sentiment,
      comment:   comment.trim(),
      timestamp: new Date().toISOString(),
    });

    setSubmitting(false);
    setIsDone(true);
  }

  // Allow Escape to close the panel.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

      {/* ── Feedback panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="w-72 bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t('feedback.ariaLabel')}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#E8F1FB] flex items-center justify-center">
                  <MessageSquareIcon size={11} className="text-[#0461BA]" />
                </div>
                <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  {t('feedback.headerLabel')}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="text-neutral-400 hover:text-neutral-600 transition-colors rounded p-0.5"
                aria-label={t('common.close')}
              >
                <XIcon size={14} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isDone ? (
                /* ── Thank-you state ─────────────────────────────────────── */
                <motion.div
                  key="done"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{    opacity: 0 }}
                  className="flex flex-col items-center gap-2 px-4 py-6 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E8F1FB] flex items-center justify-center mb-1">
                    {sentiment === 'positive'
                      ? <ThumbsUpIcon  size={18} className="text-[#0461BA]" />
                      : <ThumbsDownIcon size={18} className="text-[#0461BA]" />
                    }
                  </div>
                  <p className="text-sm font-semibold text-neutral-800">
                    {t('feedback.thankYou')}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {t('feedback.thankYouSub')}
                  </p>
                </motion.div>

              ) : (
                /* ── Rating + comment state ──────────────────────────────── */
                <motion.div
                  key="rating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{    opacity: 0 }}
                  className="px-4 py-3 space-y-3"
                >
                  {/* Question */}
                  <p className="text-sm font-medium text-neutral-800 leading-snug">
                    {t('feedback.question')}{' '}
                    <span className="font-semibold text-[#0461BA]">{contextLabel}?</span>
                  </p>

                  {/* Thumbs */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSentiment('positive')}
                      aria-pressed={sentiment === 'positive'}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        sentiment === 'positive'
                          ? 'bg-[#E8F1FB] border-[#0461BA] text-[#0461BA]'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-[#F0F4F8] hover:border-neutral-300'
                      }`}
                    >
                      <ThumbsUpIcon
                        size={16}
                        strokeWidth={sentiment === 'positive' ? 2.5 : 2}
                      />
                      {t('feedback.positive')}
                    </button>
                    <button
                      onClick={() => handleSentiment('negative')}
                      aria-pressed={sentiment === 'negative'}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        sentiment === 'negative'
                          ? 'bg-[#FEF2F2] border-[#EF4444] text-[#DC2626]'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-[#F0F4F8] hover:border-neutral-300'
                      }`}
                    >
                      <ThumbsDownIcon
                        size={16}
                        strokeWidth={sentiment === 'negative' ? 2.5 : 2}
                      />
                      {t('feedback.negative')}
                    </button>
                  </div>

                  {/* Comment — slides in once a sentiment is chosen */}
                  <AnimatePresence>
                    {sentiment && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{    opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2 overflow-hidden"
                      >
                        <textarea
                          ref={textareaRef}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={t('feedback.commentPlaceholder')}
                          maxLength={500}
                          rows={3}
                          className="w-full text-sm text-neutral-800 placeholder-neutral-400 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent transition-all"
                        />
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0461BA] hover:bg-[#0353A4] text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <SendIcon size={13} />
                          {isSubmitting ? t('feedback.submitting') : t('feedback.submit')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger button ──────────────────────────────────────────────────── */}
      <motion.button
        onClick={isOpen ? handleClose : handleOpen}
        whileHover={{ scale: 1.04 }}
        whileTap={{   scale: 0.97 }}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-md text-xs font-semibold transition-colors ${
          isOpen
            ? 'bg-[#0461BA] border-[#0353A4] text-white'
            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-[#F0F4F8] hover:border-neutral-300'
        }`}
        aria-expanded={isOpen}
        aria-label={t('feedback.buttonAriaLabel')}
      >
        <MessageSquareIcon size={13} strokeWidth={2} />
        {t('feedback.buttonLabel')}
      </motion.button>
    </div>
  );
}
