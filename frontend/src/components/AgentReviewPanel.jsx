import React, { useState, useEffect } from 'react';

const API_BASE = '';

// ─── Helper: pretty-print JSON or return raw string ──────────────────────────
function prettyPrint(val) {
  if (typeof val === 'object' && val !== null) {
    try { return JSON.stringify(val, null, 2); } catch { return String(val); }
  }
  return String(val ?? '');
}

function tryParseJSON(str) {
  try { return JSON.parse(str); } catch { return str; }
}

// ─── Editable output section ──────────────────────────────────────────────────
function EditableSection({ label, icon, outputEntry, onSave }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (outputEntry?.data) {
      setText(prettyPrint(outputEntry.data));
    }
  }, [outputEntry]);

  const handleChange = (val) => {
    setText(val);
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!outputEntry?.id) return;
    setSaving(true);
    try {
      const parsed = tryParseJSON(text);
      const res = await fetch(`${API_BASE}/update-review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output_id: outputEntry.id, edited_output: typeof parsed === 'object' ? parsed : { value: parsed } })
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setDirty(false);
      onSave && onSave(parsed);
    } catch (err) {
      console.error('Review save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (outputEntry?.data) {
      setText(prettyPrint(outputEntry.data));
      setDirty(false);
      setSaved(false);
    }
  };

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        {outputEntry?.id && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>id: {outputEntry.id}</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={e => handleChange(e.target.value)}
        disabled={!outputEntry?.id}
        placeholder={outputEntry?.id ? 'Agent output will appear here...' : 'Not yet generated'}
        style={{
          width: '100%',
          flex: 1,
          minHeight: 300,
          padding: '12px 14px',
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: 1.6,
          background: outputEntry?.id ? '#f8fafc' : '#f1f5f9',
          border: `1.5px solid ${dirty ? '#6366f1' : '#e2e8f0'}`,
          borderRadius: 12,
          color: '#334155',
          resize: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s'
        }}
      />
      {outputEntry?.id && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 8,
              border: 'none',
              background: dirty ? '#6366f1' : '#e2e8f0',
              color: dirty ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: 12,
              cursor: dirty ? 'pointer' : 'default',
              transition: 'all 0.15s'
            }}
          >
            {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Edits'}
          </button>
          <button
            onClick={handleReset}
            disabled={!dirty}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: '1.5px solid #e2e8f0',
              background: '#fff',
              color: '#64748b',
              fontWeight: 700,
              fontSize: 12,
              cursor: dirty ? 'pointer' : 'default',
              transition: 'all 0.15s'
            }}
          >
            🔄 Reset
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Panel (Modal) ────────────────────────────────────────────────────────
export default function AgentReviewPanel({
  isOpen,
  onClose,
  agentOutputs = {},
  onConfirm,
  onSave,
  isGeneratingPages = false,
  pagesGeneratedCount = 0,
  similarityInfo = null,
  onStop,
  totalPages = 0,
  textModel = 'ollama'
}) {
  if (!isOpen) return null;

  const handleSave = (section, data) => {
    console.log(`[Review Panel] Saved edits for section: ${section}`, data);
    if (onSave) {
      onSave(section, data);
    }
  };

  const TEXT_MODEL_LABELS = {
    ollama: 'Ollama',
    openrouter: 'OpenRouter'
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
              🤖 Review Core Agents Result
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Verify and customize your scene plan and visual character identity before generating storybook pages.
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

        {/* Cache hit badge */}
        {similarityInfo?.found && (
          <div style={{
            margin: '14px 24px 0',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            border: '1.5px solid #93c5fd',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
                Similar story found in knowledge base!
              </div>
              <div style={{ fontSize: 11, color: '#3b82f6' }}>
                Similarity: {Math.round((similarityInfo.similarity_score || 0) * 100)}% match
              </div>
            </div>
          </div>
        )}

        {/* Content Area (Scrollable or Side-by-Side) */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Column 1: Planner Agent */}
            <div style={{
              background: '#fafafa',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <EditableSection
                label="Scene Plan"
                icon="📋"
                outputEntry={agentOutputs.scene_plan}
                onSave={(data) => handleSave('scene_plan', data)}
              />
            </div>

            {/* Column 2: Character Agent */}
            <div style={{
              background: '#fafafa',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <EditableSection
                label="Character Sheet"
                icon="🎨"
                outputEntry={agentOutputs.character_sheet}
                onSave={(data) => handleSave('character_sheet', data)}
              />
            </div>
          </div>
        </div>

        {/* Footer: Confirm & Generate Story Pages Action */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          {isGeneratingPages ? (
            <>
              <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#6366f1',
                  animation: 'pulse 1.5s infinite'
                }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Generating Pages ({TEXT_MODEL_LABELS[textModel] || textModel}): {pagesGeneratedCount} {totalPages ? `/ ${totalPages}` : ''}
                </span>
              </div>
              {onStop && (
                <button
                  onClick={onStop}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.15s'
                  }}
                >
                  🛑 Stop Generation
                </button>
              )}
            </>
          ) : (
            <>
              {pagesGeneratedCount === 0 ? (
                onConfirm && (
                  <button
                    onClick={onConfirm}
                    disabled={!agentOutputs.scene_plan?.id}
                    style={{
                      padding: '12px 28px',
                      borderRadius: 12,
                      border: 'none',
                      background: agentOutputs.scene_plan?.id ? '#6366f1' : '#cbd5e1',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: agentOutputs.scene_plan?.id ? 'pointer' : 'not-allowed',
                      boxShadow: agentOutputs.scene_plan?.id ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    🚀 Confirm &amp; Generate Story Pages
                  </button>
                )
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                    ✓ {pagesGeneratedCount} Pages Generated &amp; Confirmed!
                  </span>
                  {onConfirm && (
                    <button
                      onClick={onConfirm}
                      disabled={!agentOutputs.scene_plan?.id}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 10,
                        border: '1.5px solid #6366f1',
                        background: '#fff',
                        color: '#6366f1',
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: agentOutputs.scene_plan?.id ? 'pointer' : 'not-allowed',
                        transition: 'all 0.15s'
                      }}
                    >
                      🔄 Regenerate Pages
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: translate(-50%, -47%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
      `}</style>
    </>
  );
}
