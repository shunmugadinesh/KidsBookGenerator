import React, { useState, useEffect } from 'react';

const API_BASE = '';

// ─── Star Rating component ────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 28,
            color: star <= (hovered || value) ? '#f59e0b' : '#e2e8f0',
            transition: 'color 0.15s, transform 0.1s',
            padding: '0 2px',
            outline: 'none'
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PagePromptModal({
  isOpen,
  onClose,
  pageKey,
  promptText,
  onPromptChange,
  rating = 0,
  onRatingChange,
  onBookRating,
  projectId = null,
  totalPages = 0
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [bookRatingDone, setBookRatingDone] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setText(promptText || '');
      setDirty(false);
    }
  }, [isOpen, promptText]);

  if (!isOpen) return null;

  const handleSave = async () => {
    onPromptChange(text);
    setDirty(false);
    onClose();
  };

  const handlePageRating = async (score) => {
    onRatingChange(pageKey, score);
    if (!projectId) return;
    try {
      await fetch(`${API_BASE}/save-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, page_name: pageKey, score, is_book_level: false })
      });
    } catch (err) {
      console.error('Rating save error:', err);
    }
  };

  const handleBookRate = async (score) => {
    onBookRating(score);
    setBookRatingDone(score === 5 ? 'up' : 'down');
    if (!projectId) return;
    try {
      await fetch(`${API_BASE}/save-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          page_name: 'all',
          score,
          is_book_level: true,
          feedback_text: score === 5 ? 'Book-level thumbs up' : 'Book-level thumbs down'
        })
      });
    } catch (err) {
      console.error('Book rating error:', err);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          zIndex: 40,
          backdropFilter: 'blur(4px)',
          transition: 'all 0.2s'
        }}
      />

      {/* Centered Modal Popup */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '960px',
        maxHeight: '90vh',
        background: '#ffffff',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 18,
        overflow: 'hidden',
        animation: 'fadeInScale 0.2s ease-out',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>
              📝 Edit Image Prompt &amp; Rate: <span style={{ color: '#4f46e5' }}>{pageKey}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Inspect and customize the image generation prompt and submit rating feedback.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              color: '#64748b',
              cursor: 'pointer',
              fontWeight: 750,
              transition: 'background 0.15s'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Content Area (Scrollable or Side-by-Side) */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Prompt Section */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🎨 Text-to-Image Prompt
            </div>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setDirty(true); }}
              placeholder="Prompt text..."
              style={{
                width: '100%',
                minHeight: '260px',
                padding: '14px 16px',
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: 1.65,
                background: '#f8fafc',
                border: `1.5px solid ${dirty ? '#6366f1' : '#e2e8f0'}`,
                borderRadius: 14,
                color: '#334155',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          {/* Rating Section (Per-Page + Book-Level) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
            
            {/* Page-level rating */}
            <div style={{
              background: '#fafafa',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '16px'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ⭐ Per-Page Rating for {pageKey}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StarRating value={rating} onChange={handlePageRating} />
                <span style={{ fontSize: 13, fontWeight: 650, color: rating > 0 ? '#d97706' : '#94a3b8' }}>
                  {rating > 0 ? `${rating} Stars` : 'Unrated'}
                </span>
              </div>
            </div>

            {/* Book-level rating */}
            {onBookRating && (
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                borderRadius: 14,
                padding: '16px'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  👍 Rate All Pages at Once
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleBookRate(5)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: 9,
                      border: 'none',
                      background: bookRatingDone === 'up' ? '#16a34a' : '#22c55e',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {bookRatingDone === 'up' ? '✅ Rated 5⭐' : '👍 Thumbs Up All'}
                  </button>
                  <button
                    onClick={() => handleBookRate(1)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: 9,
                      border: 'none',
                      background: bookRatingDone === 'down' ? '#dc2626' : '#ef4444',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {bookRatingDone === 'down' ? '❌ Rated 1⭐' : '👎 Thumbs Down'}
                  </button>
                </div>
                {totalPages > 0 && (
                  <div style={{ fontSize: 9, color: '#166534', marginTop: 6, textAlign: 'center' }}>
                    Applies the same score across all {totalPages} pages
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1.5px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
            }}
          >
            Save &amp; Close
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: translate(-50%, -47%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
