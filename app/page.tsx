'use client';
import React, { useState, useEffect, useRef } from 'react';

const COLOURS: Record<string, string> = {
  emotions: '#C8A04A', mindfulness: '#534AB7', growth: '#3C6E5A',
  values: '#2A1F4A', empathy: '#7A6A9A', purpose: '#D85A30',
};

// Child-friendly world display names and icons
const WORLD_DISPLAY: Record<string, { emoji: string; childName: string }> = {
  emotions:     { emoji: '🌈', childName: 'My Feelings' },
  mindfulness:  { emoji: '🌿', childName: 'Being Calm' },
  growth:       { emoji: '🌱', childName: 'Growing & Learning' },
  values:       { emoji: '⭐', childName: 'What I Believe' },
  empathy:      { emoji: '🤝', childName: 'Caring for Others' },
  purpose:      { emoji: '🔭', childName: "What I'm For" },
};

const AVATAR_COLOURS = [
  '#534AB7', '#C8A04A', '#3C6E5A', '#D85A30',
  '#7A6A9A', '#2A7AB7', '#B7384A', '#4AB78A',
];

const AGE_BANDS = ['5-6', '7-8', '9-10', '11-13', '14-16'];
const AGE_BAND_LABELS: Record<string, string> = {
  '5-6': 'Ages 5–6', '7-8': 'Ages 7–8', '9-10': 'Ages 9–10',
  '11-13': 'Ages 11–13', '14-16': 'Ages 14–16',
};

// ── Age-aware UX configuration ────────────────────────────────────────────
interface AgeConfig {
  journalOneAtATime: boolean;
  journalPlaceholder: string;
  journalShowPrivacyNote: boolean;
  exploreReveal: boolean;
  activitiesHighlightFirst: boolean;
  parentSectionStyle: 'subtle' | 'strong';
}

function getAgeConfig(ageBand: string | null | undefined): AgeConfig {
  switch (ageBand || '5-6') {
    case '5-6':
      return { journalOneAtATime: true, journalPlaceholder: 'Ask a grown-up to write this for you 💛', journalShowPrivacyNote: false, exploreReveal: false, activitiesHighlightFirst: true, parentSectionStyle: 'subtle' };
    case '7-8':
      return { journalOneAtATime: true, journalPlaceholder: 'Write or draw your thoughts here…', journalShowPrivacyNote: false, exploreReveal: false, activitiesHighlightFirst: true, parentSectionStyle: 'subtle' };
    case '9-10':
      return { journalOneAtATime: false, journalPlaceholder: 'Your thoughts are private. Write what feels true. 🔒', journalShowPrivacyNote: true, exploreReveal: true, activitiesHighlightFirst: false, parentSectionStyle: 'strong' };
    case '11-13':
    case '14-16':
      return { journalOneAtATime: false, journalPlaceholder: 'Your thoughts stay between you and your family. Write honestly.', journalShowPrivacyNote: true, exploreReveal: true, activitiesHighlightFirst: false, parentSectionStyle: 'strong' };
    default:
      return { journalOneAtATime: true, journalPlaceholder: 'Ask a grown-up to write this for you 💛', journalShowPrivacyNote: false, exploreReveal: false, activitiesHighlightFirst: true, parentSectionStyle: 'subtle' };
  }
}

// Personalise journal prompts with child's name and pronoun
function personalisedPrompt(prompt: string, name: string, pronoun: string | null): string {
  // Only personalise prompts that start with generic "you" framing
  // Replace leading "you" / "your" with name-based equivalent
  let p = prompt;
  // "When do you feel..." → "When does Mia feel..."
  p = p.replace(/^When do you/i, `When does ${name}`);
  p = p.replace(/^What do you/i, `What does ${name}`);
  p = p.replace(/^How do you/i, `How does ${name}`);
  p = p.replace(/^Who do you/i, `Who does ${name}`);
  p = p.replace(/^What are you/i, `What is ${name}`);
  p = p.replace(/^What is your/i, `What is ${name}'s`);
  p = p.replace(/^What does your/i, `What does ${name}'s`);
  p = p.replace(/^Is there someone/i, `Is there someone ${name}`);
  // If the prompt wasn't transformed, return original unchanged
  // (most prompts address the child directly which is fine as-is)
  return p;
}

// Pronoun-aware child greeting
function getChildGreeting(name: string, pronoun: string | null): string {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  if (!pronoun) return `${name} is ready to explore ✨`;
  if (pronoun === 'she') return `She's ready for this ${time} ✨`;
  if (pronoun === 'he') return `He's ready for this ${time} ✨`;
  return `They're ready for this ${time} ✨`;
}

// Wonder age bands (5-10)
const WONDER_BANDS = ['5-6', '7-8', '9-10'];

function apiFetch(path: string, token: string, opts?: RequestInit) {
  return fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers },
  }).then(r => r.json());
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#2A1F4A', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 };
const inputStyle: React.CSSProperties = { width: '100%', padding: 16, borderRadius: 12, border: '0.5px solid rgba(83,74,183,0.2)', background: '#fff', fontSize: 16, color: '#2A1F4A', outline: 'none', display: 'block', marginBottom: 16 };
const btnPrimary: React.CSSProperties = { width: '100%', padding: 16, borderRadius: 14, background: '#534AB7', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer' };

// ── Auth ──────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (token: string, user: any) => void }) {
  const [mode, setMode] = useState('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const submit = async () => {
    if (!email || !password || (mode === 'register' && !name)) { setError('Please fill in all fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const data = await fetch(`/api/auth/${mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      }).then(r => r.json());
      if (data.error) { setError(data.error); return; }
      localStorage.setItem('sonder_token', data.accessToken);
      localStorage.setItem('sonder_user', JSON.stringify(data.user));
      onAuth(data.accessToken, data.user);
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  const sendReset = async () => {
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true); setError(''); setSuccess('');
    setTimeout(() => { setSuccess('If an account exists for this email, please contact support at ph2oconsult@gmail.com to reset your password.'); setLoading(false); }, 1000);
  };

  if (resetMode) return (
    <div style={{ minHeight: '100vh', background: '#2A1F4A', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}><h1 style={{ fontSize: 48, color: '#fff', fontWeight: 300, marginBottom: 8 }}>Sonder</h1></div>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24 }}>
        <h2 style={{ fontSize: 22, color: '#2A1F4A', fontWeight: 600, marginBottom: 8 }}>Reset your password</h2>
        <p style={{ fontSize: 14, color: '#7A6A9A', marginBottom: 20 }}>Enter your email and we will send you a reset link.</p>
        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoCapitalize="none" />
        {error && <p style={{ color: '#C0392B', marginBottom: 16, fontSize: 14, background: '#FDECEA', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
        {success && <p style={{ color: '#27AE60', marginBottom: 16, fontSize: 14, background: '#EAFAF1', padding: '10px 14px', borderRadius: 8 }}>{success}</p>}
        <button onClick={sendReset} disabled={loading} style={btnPrimary}>{loading ? 'Sending...' : 'Send reset link'}</button>
        <button onClick={() => { setResetMode(false); setError(''); setSuccess(''); }} style={{ marginTop: 16, width: '100%', padding: 12, color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to sign in</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#2A1F4A', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 48, color: '#fff', fontWeight: 300, marginBottom: 8 }}>Sonder</h1>
        <p style={{ color: '#7A6A9A', fontSize: 14, lineHeight: 1.6 }}>the realisation that every person has a life as vivid as your own.</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24 }}>
        <h2 style={{ fontSize: 22, color: '#2A1F4A', fontWeight: 600, marginBottom: 20 }}>{mode === 'register' ? 'Create your family account' : 'Welcome back'}</h2>
        <form onSubmit={e => { e.preventDefault(); submit(); }} autoComplete="on">
          {mode === 'register' && (
            <>
              <label style={labelStyle}>Your name</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah"
                autoComplete="name" name="name" />
            </>
          )}
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoCapitalize="none" autoCorrect="off"
            autoComplete={mode === 'register' ? 'email' : 'username'}
            name="email" />
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input style={{ ...inputStyle, marginBottom: 0, paddingRight: 52 }}
              type={showPassword ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              name="password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A6A9A', fontSize: 13, fontWeight: 600 }}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          {error && <p style={{ color: '#C0392B', marginBottom: 16, fontSize: 14, background: '#FDECEA', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnPrimary}>{loading ? 'Please wait...' : mode === 'register' ? 'Create account →' : 'Sign in →'}</button>
        </form>
        {mode === 'login' && (<button onClick={() => { setResetMode(true); setError(''); }} style={{ marginTop: 12, width: '100%', padding: 10, color: '#7A6A9A', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>Forgot your password?</button>)}
        <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }} style={{ marginTop: 4, width: '100%', padding: 12, color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
          {mode === 'register' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}

// ── Profile Setup ─────────────────────────────────────────────────────────
// ── Delete / Reset Profile ────────────────────────────────────────────────
function DeleteProfileSection({ token, profileId, onDeleted }: { token: string; profileId: string; onDeleted: () => void }) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const [error, setError] = useState('');

  const doDelete = async () => {
    setStep('deleting');
    try {
      const data = await fetch('/api/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: profileId }),
      }).then(r => r.json());
      if (data.error) { setError(data.error); setStep('confirm'); return; }
      onDeleted();
    } catch {
      setError('Something went wrong. Please try again.');
      setStep('confirm');
    }
  };

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('confirm')}
        style={{ marginTop: 24, width: '100%', padding: '10px 0', color: '#C0392B', fontSize: 13,
          background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}>
        Delete this profile
      </button>
    );
  }

  return (
    <div style={{ marginTop: 24, background: '#FDECEA', borderRadius: 14, padding: '16px 18px' }}>
      <p style={{ fontSize: 14, color: '#2A1F4A', fontWeight: 600, margin: '0 0 6px' }}>
        Delete this profile?
      </p>
      <p style={{ fontSize: 13, color: '#7A6A9A', lineHeight: 1.5, margin: '0 0 16px' }}>
        This will permanently remove the child profile and all their journal entries. This cannot be undone.
      </p>
      {error && <p style={{ fontSize: 13, color: '#C0392B', marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={doDelete}
          disabled={step === 'deleting'}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#C0392B', color: '#fff', fontSize: 14, fontWeight: 600 }}>
          {step === 'deleting' ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => { setStep('idle'); setError(''); }}
          disabled={step === 'deleting'}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#EDE8F8', color: '#534AB7', fontSize: 14, fontWeight: 600 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ProfileSetupScreen({ token, existingProfile, onDone, onSkip, onDelete }: { token: string; existingProfile?: any; onDone: (profile: any) => void; onSkip?: () => void; onDelete?: () => void; }) {
  const editing = !!existingProfile;
  const [name, setName] = useState(existingProfile?.name || '');
  const [dob, setDob] = useState(existingProfile?.date_of_birth || '');
  const [ageBand, setAgeBand] = useState(existingProfile?.age_band || '5-6');
  const [colour, setColour] = useState(existingProfile?.avatar_colour || '#534AB7');
  const [pronoun, setPronoun] = useState<string>(existingProfile?.pronoun || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteProfile = async () => {
    if (!existingProfile?.id) return;
    setDeleting(true);
    try {
      await fetch(`/api/profiles?id=${existingProfile.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete?.();
    } catch {
      setError('Could not delete profile. Please try again.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDobChange = (val: string) => {
    setDob(val);
    if (!val) return;
    const age = Math.floor((Date.now() - new Date(val).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age >= 14) setAgeBand('14-16');
    else if (age >= 11) setAgeBand('11-13');
    else if (age >= 9) setAgeBand('9-10');
    else if (age >= 7) setAgeBand('7-8');
    else setAgeBand('5-6');
  };

  const submit = async () => {
    if (!name.trim()) { setError('Please enter a name'); return; }
    setLoading(true); setError('');
    try {
      const method = editing ? 'PATCH' : 'POST';
      const body = editing
        ? { id: existingProfile.id, name: name.trim(), date_of_birth: dob || null, age_band: ageBand, avatar_colour: colour, pronoun: pronoun || null }
        : { name: name.trim(), date_of_birth: dob || null, age_band: ageBand, avatar_colour: colour, pronoun: pronoun || null };
      const data = await fetch('/api/profiles', {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }).then(r => r.json());
      if (data.error) { setError(data.error); return; }
      onDone(data.profile);
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  const initials = name.trim() ? name.trim()[0].toUpperCase() : '?';

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F7F4FB', padding: '32px 24px', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: colour, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 700, marginBottom: 16, boxShadow: `0 4px 20px ${colour}55` }}>
          {initials}
        </div>
        <h1 style={{ fontSize: 24, color: '#2A1F4A', fontWeight: 600, margin: 0, textAlign: 'center' }}>
          {editing ? 'Edit profile' : "Let's set up your child's space"}
        </h1>
        {!editing && <p style={{ fontSize: 14, color: '#7A6A9A', marginTop: 8, textAlign: 'center', lineHeight: 1.5, maxWidth: 280 }}>This helps Sonder show the right lessons at the right age.</p>}
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <label style={labelStyle}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mia"
          style={{ ...inputStyle, background: '#F7F4FB' }} />

        <label style={labelStyle}>Date of birth</label>
        <input type="date" value={dob} onChange={e => handleDobChange(e.target.value)}
          style={{ ...inputStyle, background: '#F7F4FB' }} />

        <label style={labelStyle}>Age group</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {AGE_BANDS.map(b => (
            <button key={b} onClick={() => setAgeBand(b)} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: ageBand === b ? colour : '#EDE8F8', color: ageBand === b ? '#fff' : '#534AB7', transition: 'all 0.15s' }}>
              {AGE_BAND_LABELS[b]}
            </button>
          ))}
        </div>

        {/* FIX: larger colour swatches — 48px for easy tap targets */}
        <label style={labelStyle}>Pick a colour</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {AVATAR_COLOURS.map(c => (
            <button key={c} onClick={() => setColour(c)} style={{ width: 48, height: 48, borderRadius: 24, background: c, border: colour === c ? '3px solid #2A1F4A' : '3px solid transparent', cursor: 'pointer', transition: 'transform 0.15s', transform: colour === c ? 'scale(1.15)' : 'scale(1)' }} />
          ))}
        </div>

        {/* Pronoun preference — optional, skippable */}
        <label style={{ ...labelStyle, marginTop: 4 }}>
          Pronouns <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#aaa', fontSize: 11 }}>(optional)</span>
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { value: 'she', label: 'She / Her' },
            { value: 'he', label: 'He / Him' },
            { value: 'they', label: 'They / Them' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setPronoun(pronoun === opt.value ? '' : opt.value)}
              style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: pronoun === opt.value ? colour : '#EDE8F8', color: pronoun === opt.value ? '#fff' : '#534AB7', transition: 'all 0.15s' }}>
              {opt.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 20, marginTop: -16, lineHeight: 1.5 }}>
          Used to personalise journal prompts. Tap to select, tap again to skip.
        </p>

        {error && <p style={{ color: '#C0392B', marginBottom: 16, fontSize: 14, background: '#FDECEA', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}

        <button onClick={submit} disabled={loading} style={{ ...btnPrimary, background: colour }}>
          {loading ? 'Saving...' : editing ? 'Save changes' : 'Create profile →'}
        </button>

        {onSkip && (
          <button onClick={onSkip} style={{ marginTop: 12, width: '100%', padding: 12, color: '#7A6A9A', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
            Skip for now
          </button>
        )}

        {/* Delete profile — only shown when editing an existing profile */}
        {editing && onDelete && (
          <DeleteProfileSection token={token} profileId={existingProfile.id} onDeleted={onDelete} />
        )}

        {/* Delete profile — edit mode only */}
        {editing && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)} style={{ marginTop: 16, width: '100%', padding: 12, color: '#C0392B', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', borderTop: '0.5px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>
            Remove this profile
          </button>
        )}

        {/* Confirm delete */}
        {editing && confirmDelete && (
          <div style={{ marginTop: 16, padding: '16px', background: '#FDECEA', borderRadius: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#2A1F4A', fontWeight: 600, margin: '0 0 4px' }}>Remove {existingProfile?.name || 'this profile'}?</p>
            <p style={{ fontSize: 13, color: '#7A6A9A', margin: '0 0 16px', lineHeight: 1.5 }}>This will delete all their journal entries and progress. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: '#2A1F4A', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={deleteProfile} disabled={deleting} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#C0392B', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {deleting ? 'Removing…' : 'Yes, remove'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── World Card — with emoji + child-friendly name for Wonder ──────────────
function WorldCard({ world, onClick, dark, childFriendly }: any) {
  const colour = COLOURS[world.slug] || '#534AB7';
  const display = WORLD_DISPLAY[world.slug];
  return (
    <button onClick={onClick} style={{ width: '100%', background: dark ? '#2A1F4A' : '#fff', borderRadius: 16, padding: 16, marginBottom: 10, textAlign: 'left', boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
      {/* Emoji icon */}
      <div style={{ width: 52, height: 52, borderRadius: 14, background: colour + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
        {display?.emoji || '◎'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, color: dark ? '#EDE8FC' : '#2A1F4A', fontWeight: 600, marginBottom: 2 }}>
          {childFriendly && display ? display.childName : world.name}
        </div>
        <div style={{ fontSize: 12, color: '#7A6A9A', lineHeight: 1.4 }}>{world.core_question}</div>
      </div>
      <span style={{ color: colour, fontSize: 20, fontWeight: 700 }}>›</span>
    </button>
  );
}

// ── Lesson List ───────────────────────────────────────────────────────────
function LessonList({ world, token, track, defaultBand, onLesson, onBack }: any) {
  const fallback = track === 'beneath' ? '11-13' : '5-6';
  const [ageBand, setAgeBand] = useState(defaultBand || fallback);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colour = COLOURS[world.slug] || '#534AB7';
  const dark = track === 'beneath';
  const bands = dark ? ['11-13', '14-16'] : ['5-6', '7-8', '9-10'];
  const bg = dark ? '#1A1228' : '#F7F4FB';
  const cardBg = dark ? '#2A1F4A' : '#fff';
  const textColor = dark ? '#EDE8FC' : '#2A1F4A';
  const display = WORLD_DISPLAY[world.slug];

  const [openedLessons, setOpenedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/lessons?world=${world.slug}&age_band=${ageBand}`, token).then(d => { setLessons(d.lessons || []); setLoading(false); });
  }, [world.slug, ageBand, token]);

  useEffect(() => {
    // Load opened lessons from sessionStorage
    const key = `opened_${world.slug}_${ageBand}`;
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) setOpenedLessons(new Set(JSON.parse(stored)));
    } catch(e) {}
  }, [world.slug, ageBand]);

  const markOpened = (lessonId: string) => {
    const key = `opened_${world.slug}_${ageBand}`;
    setOpenedLessons(prev => {
      const next = new Set(prev);
      next.add(lessonId);
      try { sessionStorage.setItem(key, JSON.stringify([...next])); } catch(e) {}
      return next;
    });
  };

  // FIX: friendly duration label
  const durationLabel = (mins: number) => {
    if (mins <= 8) return 'Quick';
    if (mins <= 11) return 'Medium';
    return 'Longer';
  };

  return (
    <div style={{ flex: 1, background: bg, overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px', background: cardBg, borderLeft: `4px solid ${colour}`, borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        <button onClick={onBack} style={{ color: dark ? '#9A8EC8' : '#534AB7', fontSize: 14, fontWeight: 600, marginBottom: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← All worlds</button>
        {(() => {
          const wj = getWorldJourney(world.slug, ageBand);
          return wj ? (<>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colour, marginBottom: 6 }}>
              {display?.emoji} Your journey
            </div>
            <div style={{ fontSize: 20, color: textColor, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{wj.journey_name}</div>
            <div style={{ fontSize: 13, color: dark ? '#9A8EC8' : '#7A6A9A', lineHeight: 1.6, marginBottom: 4 }}>{wj.about}</div>
            <div style={{ fontSize: 12, color: colour, fontWeight: 600, marginTop: 8 }}>{wj.by_end}</div>
          </>) : (<>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              {display && <span style={{ fontSize: 24 }}>{display.emoji}</span>}
              <div style={{ fontSize: 20, color: textColor, fontWeight: 600 }}>{world.name}</div>
            </div>
            <div style={{ fontSize: 13, color: '#7A6A9A' }}>{world.core_question}</div>
          </>);
        })()}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: cardBg, borderBottom: '0.5px solid rgba(0,0,0,0.08)', overflowX: 'auto' }}>
        {bands.map(b => (
          <button key={b} onClick={() => setAgeBand(b)} style={{ whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: ageBand === b ? colour : dark ? 'rgba(122,106,154,0.2)' : '#EDE8F8', color: ageBand === b ? '#fff' : '#534AB7', border: 'none', cursor: 'pointer' }}>Ages {b}</button>
        ))}
      </div>
      <div style={{ padding: 16 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#7A6A9A' }}>Loading...</div>
          : lessons.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#7A6A9A' }}>No lessons for ages {ageBand} yet.</div>
          : <>
            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: dark ? '#9A8EC8' : '#7A6A9A', fontWeight: 600 }}>
                  {openedLessons.size} of {lessons.length} days into your journey
                </span>
                {openedLessons.size === lessons.length && (
                  <span style={{ fontSize: 11, color: colour, fontWeight: 700 }}>Complete ✓</span>
                )}
              </div>
              <div style={{ height: 4, background: dark ? 'rgba(155,130,220,0.2)' : '#EDE8F8', borderRadius: 99 }}>
                <div style={{ height: 4, background: colour, borderRadius: 99, width: `${lessons.length > 0 ? (openedLessons.size / lessons.length) * 100 : 0}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            {lessons.map((l: any) => (
            <button key={l.id} onClick={() => { markOpened(l.id); onLesson(l); try { localStorage.setItem('sonder_last_lesson', JSON.stringify({ id: l.id, title: l.title, world: world.name, track: l.track || track, slug: l.slug })); } catch(e) {} }} style={{ width: '100%', background: cardBg, borderRadius: 14, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: openedLessons.has(l.id) ? colour : colour + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: openedLessons.has(l.id) ? '#fff' : colour }}>{openedLessons.has(l.id) ? '✓' : l.lesson_number}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: dark ? '#9A8EC8' : colour, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Day {l.lesson_number}</div>
                <div style={{ fontSize: 15, color: textColor, fontWeight: 500, marginBottom: 2 }}>{l.title}</div>
                <div style={{ fontSize: 12, color: '#7A6A9A' }}>
                  {durationLabel(l.duration_mins)}{l.is_guided ? ' · Guided' : ''}
                </div>
              </div>
              <span style={{ color: colour, fontSize: 22, fontWeight: 700 }}>›</span>
            </button>
          ))}
          </>
        }
      </div>
    </div>
  );
}

// ── Journal Writer — age-aware ────────────────────────────────────────────
function JournalWriter({ lessonId, prompts, token, isParentView, childName, ageConfig, childPronoun }: any) {
  const cfg: AgeConfig = ageConfig || getAgeConfig('5-6');
  const [entries, setEntries] = useState<Record<number, string>>({});
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);
  const [listeningIdx, setListeningIdx] = useState<number | null>(null);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const debounceRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const visiblePrompts = (prompts || []).filter((p: any) => isParentView ? p.is_parent_prompt : !p.is_parent_prompt);
  const indexMap: Record<number, number> = {};
  let vi = 0;
  (prompts || []).forEach((p: any, i: number) => { if (isParentView ? p.is_parent_prompt : !p.is_parent_prompt) { indexMap[vi++] = i; } });

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    if (!lessonId || !token) return;
    fetch(`/api/journal?lesson_id=${lessonId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        const map: Record<number, string> = {};
        (d.entries || []).forEach((e: any) => { map[e.prompt_index] = e.response; });
        setEntries(map);
      }).catch(() => {});
  }, [lessonId, token]);

  const handleChange = (vi: number, value: string) => {
    const oi = indexMap[vi];
    setEntries(prev => ({ ...prev, [oi]: value }));
    setSavedIdx(null);
    if (debounceRefs.current[vi]) clearTimeout(debounceRefs.current[vi]);
    debounceRefs.current[vi] = setTimeout(() => save(vi, oi, value), 1500);
  };

  const save = async (vi: number, oi: number, response: string) => {
    const prompt = prompts[oi];
    setSavingIdx(vi);
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lesson_id: lessonId, prompt_index: oi, prompt_text: prompt.prompt, response, is_parent_prompt: prompt.is_parent_prompt || false }),
      });
      setSavedIdx(vi);
    } catch {} finally { setSavingIdx(null); }
  };

  const startListening = (vi: number) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Stop any existing session
    if (recognitionRef.current) { recognitionRef.current.stop(); }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-AU';
    recognitionRef.current = recognition;

    const oi = indexMap[vi];
    const existing = entries[oi] || '';

    recognition.onstart = () => setListeningIdx(vi);

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const combined = existing + (existing ? ' ' : '') + transcript;
      setEntries(prev => ({ ...prev, [oi]: combined }));
    };

    recognition.onend = () => {
      setListeningIdx(null);
      // Save whatever was captured
      const currentVal = entries[oi] || '';
      if (currentVal) save(vi, oi, currentVal);
    };

    recognition.onerror = () => setListeningIdx(null);

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); }
    setListeningIdx(null);
  };

  if (visiblePrompts.length === 0) return null;

  // Age-aware: privacy note for 9+
  const privacyNote = !isParentView && cfg.journalShowPrivacyNote ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '8px 12px', background: '#F0F7FF', borderRadius: 10 }}>
      <span style={{ fontSize: 14 }}>🔒</span>
      <span style={{ fontSize: 12, color: '#2A7AB7', fontWeight: 600 }}>Only you and your family can see what you write here.</span>
    </div>
  ) : null;

  // Age-aware: determine which prompts to show
  const promptsToShow = (!isParentView && cfg.journalOneAtATime)
    ? [visiblePrompts[currentPromptIdx]].filter(Boolean)
    : visiblePrompts;

  const renderPrompt = (p: any, vi: number) => {
    const oi = indexMap[vi];
    const isListening = listeningIdx === vi;
    return (
      <div key={vi} style={{ marginBottom: 24, background: isParentView ? 'transparent' : '#fff', borderRadius: 14, padding: isParentView ? 0 : 16, boxShadow: isParentView ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, color: '#2A1F4A', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 10, fontWeight: 500 }}>
          {!isParentView && childName ? personalisedPrompt(p.prompt, childName, childPronoun) : p.prompt}
        </div>
        {p.note && <div style={{ fontSize: 12, color: '#7A6A9A', marginBottom: 8 }}>{p.note}</div>}
        <textarea
          value={entries[oi] || ''}
          onChange={e => handleChange(vi, e.target.value)}
          placeholder={isParentView ? 'Write your reflection here…' : cfg.journalPlaceholder}
          rows={3}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${isListening ? '#D85A30' : 'rgba(83,74,183,0.2)'}`, background: isListening ? '#FFF8F5' : '#F7F4FB', fontSize: 14, lineHeight: 1.6, color: '#2A1F4A', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, background 0.2s' }}
          onFocus={e => { if (!isListening) e.target.style.borderColor = '#534AB7'; }}
          onBlur={e => { if (!isListening) e.target.style.borderColor = 'rgba(83,74,183,0.2)'; }}
        />

            {/* Bottom row: save status + voice button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, minHeight: 32 }}>
              <div style={{ fontSize: 11, color: isListening ? '#D85A30' : '#aaa' }}>
                {isListening && <span>🎙 Listening… tap to stop</span>}
                {savingIdx === vi && !isListening && 'Saving…'}
                {savedIdx === vi && savingIdx !== vi && !isListening && <span style={{ color: '#3C6E5A' }}>✓ Saved</span>}
              </div>

              {/* Voice to text button */}
              {speechSupported && (
                <button
                  onClick={() => isListening ? stopListening() : startListening(vi)}
                  title={isListening ? 'Stop listening' : 'Speak your answer'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: isListening ? '#D85A30' : '#EDE8F8',
                    color: isListening ? '#fff' : '#534AB7',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                    boxShadow: isListening ? '0 0 0 3px rgba(216,90,48,0.25)' : 'none',
                  }}>
                  <span style={{ fontSize: 16 }}>{isListening ? '⏹' : '🎙'}</span>
                  {isListening ? 'Stop' : 'Speak'}
                </button>
              )}
            </div>
          </div>
        );
  };

  return (
    <div>
      {privacyNote}
      {promptsToShow.map((p: any, displayIdx: number) => {
        // In one-at-a-time mode, vi is currentPromptIdx; in all-at-once, vi is displayIdx
        const vi = (!isParentView && cfg.journalOneAtATime) ? currentPromptIdx : displayIdx;
        return renderPrompt(p, vi);
      })}
      {/* One-at-a-time navigation for younger ages */}
      {!isParentView && cfg.journalOneAtATime && visiblePrompts.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <button
            onClick={() => setCurrentPromptIdx(i => Math.max(0, i - 1))}
            disabled={currentPromptIdx === 0}
            style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: currentPromptIdx === 0 ? 'default' : 'pointer', background: currentPromptIdx === 0 ? '#eee' : '#EDE8F8', color: currentPromptIdx === 0 ? '#bbb' : '#534AB7', fontWeight: 600, fontSize: 13 }}>← Back</button>
          <span style={{ fontSize: 12, color: '#aaa' }}>{currentPromptIdx + 1} of {visiblePrompts.length}</span>
          <button
            onClick={() => setCurrentPromptIdx(i => Math.min(visiblePrompts.length - 1, i + 1))}
            disabled={currentPromptIdx === visiblePrompts.length - 1}
            style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: currentPromptIdx === visiblePrompts.length - 1 ? 'default' : 'pointer', background: currentPromptIdx === visiblePrompts.length - 1 ? '#eee' : '#534AB7', color: currentPromptIdx === visiblePrompts.length - 1 ? '#bbb' : '#fff', fontWeight: 600, fontSize: 13 }}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Beneath Reading List — supplementary podcasts and films per world ────
const BENEATH_SUPPLEMENTS: Record<string, Record<string, {podcasts: any[]; films: any[]}>> = {"emotions": {"11-13": {"podcasts": [{"title": "Unlocking Us", "creator": "Brené Brown", "why": "Honest conversations about vulnerability, shame, and connection — at a level that doesn't talk down to you."}, {"title": "Ten Percent Happier", "creator": "Dan Harris", "why": "Practical mindfulness for people who find the spiritual framing off-putting. Very grounded."}], "films": [{"title": "Inside Out", "year": 2015, "why": "Still the most accurate animated portrayal of how emotions actually work together. Worth watching again at this age."}, {"title": "The Perks of Being a Wallflower", "year": 2012, "why": "Honest portrayal of emotional complexity in adolescence. Sensitive themes handled carefully."}]}, "14-16": {"podcasts": [{"title": "Unlocking Us", "creator": "Brené Brown", "why": "The shame and vulnerability episodes are directly relevant to what you're exploring in this world."}, {"title": "The Happiness Lab", "creator": "Dr Laurie Santos", "why": "Research-based, sceptical of easy answers. Good on why emotions mislead us about what will make us happy."}], "films": [{"title": "Good Will Hunting", "year": 1997, "why": "One of the most honest portrayals of emotional avoidance and what it costs. The therapy scenes are worth studying."}, {"title": "Eternal Sunshine of the Spotless Mind", "year": 2004, "why": "Explores whether avoiding painful emotions is actually what we want — and what we'd lose."}]}}, "growth": {"11-13": {"podcasts": [{"title": "How I Built This", "creator": "Guy Raz", "why": "Real stories of failure and persistence from people who built something. The failures are usually the interesting part."}, {"title": "Radiolab", "creator": "WNYC", "why": "Intellectually playful science journalism. Good for people who want to understand how things actually work."}], "films": [{"title": "Billy Elliot", "year": 2000, "why": "About following what you're genuinely good at in the face of pressure to conform. The growth is real and earned."}, {"title": "Hidden Figures", "year": 2016, "why": "Persistence, identity, and excellence in the face of structural barriers. Based on a true story."}]}, "14-16": {"podcasts": [{"title": "Lex Fridman Podcast", "creator": "Lex Fridman", "why": "Long-form conversations with scientists, philosophers, and builders. Good for people comfortable with complexity."}, {"title": "Revisionist History", "creator": "Malcolm Gladwell", "why": "Challenges received wisdom about success, talent, and effort. Disagree with it productively."}], "films": [{"title": "Whiplash", "year": 2014, "why": "A brutal examination of the relationship between obsession, talent, and growth. Deliberately uncomfortable."}, {"title": "The Social Network", "year": 2010, "why": "What it actually looks like to build something — and what it costs personally. Not a straightforward success story."}]}}, "values": {"11-13": {"podcasts": [{"title": "Radiolab — Morality", "creator": "WNYC", "why": "Episodes on moral dilemmas, trolley problems, and how we actually make ethical decisions under pressure."}, {"title": "Story Corps", "creator": "NPR", "why": "Short recordings of real people talking about what matters most to them. Consistently moving."}], "films": [{"title": "To Kill a Mockingbird", "year": 1962, "why": "Integrity under social pressure. One of the clearest portrayals of what doing the right thing actually costs."}, {"title": "Schindler's List", "year": 1993, "why": "How values form under extreme pressure and what action they eventually demand. Mature content — watch together."}]}, "14-16": {"podcasts": [{"title": "Philosophize This!", "creator": "Stephen West", "why": "Accessible philosophy — covers the ethical frameworks from this world in real depth without being dry."}, {"title": "On Being", "creator": "Krista Tippett", "why": "Conversations about meaning, ethics, and how to live. Intellectually serious without being academic."}], "films": [{"title": "12 Angry Men", "year": 1957, "why": "One room, one jury, one question about truth and integrity. The best film ever made about moral reasoning under pressure."}, {"title": "A Man for All Seasons", "year": 1966, "why": "Thomas More refusing to compromise his values when it costs him everything. Slow, but extraordinary."}]}}, "empathy": {"11-13": {"podcasts": [{"title": "Hidden Brain", "creator": "Shankar Vedantam", "why": "Psychology research on how we understand (and misunderstand) each other. Accessible and genuinely surprising."}, {"title": "Dear Sugars", "creator": "Cheryl Strayed & Steve Almond", "why": "Real letters, real responses. One of the best models of empathetic listening you'll find anywhere."}], "films": [{"title": "Wonder", "year": 2017, "why": "Multiple perspectives on the same events — a good illustration of how differently people can experience the same situation."}, {"title": "The Blind Side", "year": 2009, "why": "Relationship across difference. Raises questions about who gets to tell whose story."}]}, "14-16": {"podcasts": [{"title": "Armchair Expert", "creator": "Dax Shepard", "why": "Long conversations that model genuine curiosity about other people's inner lives. Good for seeing what real listening looks like."}, {"title": "Hidden Brain", "creator": "Shankar Vedantam", "why": "The projection and bias episodes are directly relevant to what this world covers."}], "films": [{"title": "Crash", "year": 2004, "why": "Multiple intersecting lives — shows how thoroughly people misread each other and why. Mature and unflinching."}, {"title": "Moonlight", "year": 2016, "why": "A masterclass in showing an inner life without explaining it. Watch and practice reading what's not said."}]}}, "mindfulness": {"11-13": {"podcasts": [{"title": "Calm Masterclass", "creator": "Various", "why": "Short guided sessions from researchers and practitioners. Not spiritual — practical."}, {"title": "Ten Percent Happier", "creator": "Dan Harris", "why": "Harris is a sceptic who needed proof before believing any of this. His journey is a good entry point."}], "films": [{"title": "Koyaanisqatsi", "year": 1982, "why": "No dialogue. Just images of the world moving at different speeds. An hour of watching what you usually rush past."}, {"title": "My Neighbour Totoro", "year": 1988, "why": "A film about presence and wonder. Watch it properly — not on a phone."}]}, "14-16": {"podcasts": [{"title": "Making Sense", "creator": "Sam Harris", "why": "The mindfulness and consciousness episodes are philosophically rigorous. Good for people who want the science."}, {"title": "On Being — The Inner Life", "creator": "Krista Tippett", "why": "Conversations about contemplative practice that don't assume any particular tradition."}], "films": [{"title": "The Tree of Life", "year": 2011, "why": "Terrence Malick's meditation on time, presence, and meaning. Deliberately slow. Not for everyone — but worth trying."}, {"title": "Paterson", "year": 2016, "why": "A film about noticing the extraordinary in the ordinary. Nothing happens — that's the point."}]}}, "purpose": {"11-13": {"podcasts": [{"title": "How I Built This", "creator": "Guy Raz", "why": "What it actually looks like to follow a vocation — including the wrong turns and near-failures."}, {"title": "WorkLife", "creator": "Adam Grant", "why": "Research on meaning, motivation, and what makes work worth doing. Practical and evidence-based."}], "films": [{"title": "October Sky", "year": 1999, "why": "Based on a true story of a boy in a mining town who discovers what he's actually for. Straightforward and genuinely moving."}, {"title": "Soul", "year": 2020, "why": "The best film made for this age group about purpose — and why purpose isn't the same as a singular passion."}]}, "14-16": {"podcasts": [{"title": "The Tim Ferriss Show", "creator": "Tim Ferriss", "why": "Long conversations with world-class performers about how they found their direction. Skip the life-hack framing and go for the stories."}, {"title": "80,000 Hours Podcast", "creator": "Rob Wiblin", "why": "Serious, evidence-based thinking about how to have a meaningful career. Challenges assumptions productively."}], "films": [{"title": "Dead Poets Society", "year": 1989, "why": "What happens when you start taking your inner life seriously. O Captain, my Captain."}, {"title": "Into the Wild", "year": 2007, "why": "A radical pursuit of meaning and its costs. Worth arguing with — what did he get right? What did he miss?"}]}}};

function parseBookReferences(raw: string): Array<{author: string; title: string; note: string}> {
  const books: Array<{author: string; title: string; note: string}> = [];
  if (!raw || raw.includes('Whatever is next')) return books;
  const parts = raw.split(/\.?\s+Also:\s*/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const dashMatch = trimmed.match(/^([^\u2014]+)\u2014\s*([^.]+)\.?(.*)$/);
    if (dashMatch) {
      books.push({ author: dashMatch[1].trim(), title: dashMatch[2].trim(), note: dashMatch[3].trim() });
    } else {
      books.push({ author: '', title: trimmed.split('.')[0], note: '' });
    }
  }
  return books;
}

// ── World Journey Identity Layer ─────────────────────────────────────────
// Journey name, framing, and identity statement per world × age mode
const WORLD_JOURNEYS: Record<string, Record<string, {journey_name: string; about: string; by_end: string; becoming: string}>> = {"emotions": {"5-6": {"journey_name": "Meeting your feelings", "about": "This week you'll meet the feelings that visit every day — and find out they're all welcome.", "by_end": "By the end of this week, you'll have names for your feelings and know where they live in your body.", "becoming": "Someone who knows their feelings are friends, not enemies."}, "7-10": {"journey_name": "What your feelings are saying", "about": "Every feeling is a messenger. This week you'll learn to read the messages.", "by_end": "By the end of this week, you'll understand why you feel what you feel — and what to do with it.", "becoming": "Someone who listens to their feelings instead of fighting them."}, "11-13": {"journey_name": "Your inner life, honestly", "about": "Most people never really examine their emotional patterns. This week you will.", "by_end": "By the end of this week, you'll have a clearer map of your emotional life — where you're strong and where you avoid.", "becoming": "Someone who understands themselves rather than just reacting."}, "14-16": {"journey_name": "The honest audit", "about": "Your emotional life shapes everything — your relationships, your decisions, who you become. This week you look at it directly.", "by_end": "By the end of this week, you'll have named what you usually avoid and started to understand what it's costing you.", "becoming": "Someone with the emotional intelligence most adults never develop."}}, "mindfulness": {"5-6": {"journey_name": "Finding the quiet", "about": "This week you'll discover that there's a calm place inside you — always.", "by_end": "By the end of this week, you'll have a breathing trick and a calm place to go to whenever you need it.", "becoming": "Someone who knows how to find calm when things get loud."}, "7-10": {"journey_name": "Paying attention on purpose", "about": "This week you'll practise the one skill that makes everything else easier: noticing what's actually happening.", "by_end": "By the end of this week, you'll have a daily practice that takes less than five minutes and changes how you feel.", "becoming": "Someone who chooses where their attention goes."}, "11-13": {"journey_name": "The present is enough", "about": "Most anxiety lives in the future. Most regret lives in the past. This week you practise being here.", "by_end": "By the end of this week, you'll have a personal mindfulness practice that doesn't feel like a chore.", "becoming": "Someone who can be genuinely present — which is rarer than it sounds."}, "14-16": {"journey_name": "The examined mind", "about": "Not the spiritual version. The rigorous version — understanding how your mind works and learning to use it deliberately.", "by_end": "By the end of this week, you'll understand the difference between being your thoughts and observing them.", "becoming": "Someone who has a relationship with their own mind rather than being at its mercy."}}, "growth": {"5-6": {"journey_name": "Getting better at things", "about": "This week you'll find out that your brain actually grows when you try hard things.", "by_end": "By the end of this week, you'll know what to say to yourself when something feels too hard.", "becoming": "Someone who sees 'hard' as a sign they're learning, not failing."}, "7-10": {"journey_name": "How you actually get good at things", "about": "This week you'll find out the real secret behind getting good at anything — and it's not talent.", "by_end": "By the end of this week, you'll have a completely different relationship with the word 'yet'.", "becoming": "Someone who gets better at things by staying curious instead of giving up."}, "11-13": {"journey_name": "Who you're becoming", "about": "You're not fixed. This week you'll examine where you're growing and where you're holding back — and why.", "by_end": "By the end of this week, you'll have an honest picture of your growth mindset — where it's real and where it's a performance.", "becoming": "Someone who treats their own development as something worth taking seriously."}, "14-16": {"journey_name": "The work", "about": "Not motivation. Not inspiration. The actual mechanics of becoming who you want to be.", "by_end": "By the end of this week, you'll have examined your relationship with effort, failure, and identity — honestly.", "becoming": "Someone who understands that becoming is a practice, not an event."}}, "empathy": {"5-6": {"journey_name": "How other people feel", "about": "This week you'll start to see that everyone has a whole world of feelings inside them — just like you.", "by_end": "By the end of this week, you'll know how to ask what someone is feeling — and really listen to the answer.", "becoming": "Someone who notices how other people feel and wants to help."}, "7-10": {"journey_name": "Really listening", "about": "Most people are waiting to talk, not actually listening. This week you practise the real thing.", "by_end": "By the end of this week, you'll have a new way of listening that makes people feel genuinely heard.", "becoming": "Someone people feel safe talking to."}, "11-13": {"journey_name": "Getting people right", "about": "You misread people more than you think. This week you find out how — and start seeing more clearly.", "by_end": "By the end of this week, you'll understand why you get certain people wrong and have tools to do better.", "becoming": "Someone with genuine curiosity about other people's inner lives."}, "14-16": {"journey_name": "Other people's interiority", "about": "Every person you pass has a life as vivid and complex as yours. This week you take that seriously.", "by_end": "By the end of this week, you'll have examined your blind spots and started to close them.", "becoming": "Someone who sees people more fully than most people bother to."}}, "values": {"5-6": {"journey_name": "What matters to you", "about": "This week you'll find out what you care about most — and why it matters.", "by_end": "By the end of this week, you'll know the three things that matter most to you and be able to say why.", "becoming": "Someone who knows what they stand for."}, "7-10": {"journey_name": "What you stand for", "about": "Everyone says they value honesty, kindness, fairness. This week you find out what you actually do when it's hard.", "by_end": "By the end of this week, you'll know the difference between values you hold and values you live.", "becoming": "Someone whose actions match what they say they believe."}, "11-13": {"journey_name": "The examined life", "about": "Most people inherit their values without ever questioning them. This week you do the questioning.", "by_end": "By the end of this week, you'll know which of your values are genuinely yours and which you've never actually examined.", "becoming": "Someone who chooses what they believe instead of inheriting it."}, "14-16": {"journey_name": "What you actually believe", "about": "Not what you're supposed to believe. Not what sounds good. What you would stake something on.", "by_end": "By the end of this week, you'll have interrogated your most important values and know which ones survive scrutiny.", "becoming": "Someone with a moral compass they built themselves."}}, "purpose": {"5-6": {"journey_name": "What I love doing", "about": "This week you'll pay attention to the things that make you light up — and find out why they matter.", "by_end": "By the end of this week, you'll know three things you love doing and be able to say what makes them special.", "becoming": "Someone who knows what makes them come alive."}, "7-10": {"journey_name": "What you might be for", "about": "This week you'll follow the clues about what you're here to do — not a job, a direction.", "by_end": "By the end of this week, you'll have a sentence that points toward your direction — even if it changes later.", "becoming": "Someone with a sense of where they're heading."}, "11-13": {"journey_name": "Following the signal", "about": "Your interests, your anger, your fascination — they're all pointing at something. This week you find out what.", "by_end": "By the end of this week, you'll have connected the things you care about to something bigger than yourself.", "becoming": "Someone who understands the difference between a job and a vocation."}, "14-16": {"journey_name": "What you're building", "about": "Every choice you make is building something. This week you look at what it actually is.", "by_end": "By the end of this week, you'll have a direction — not a plan, a direction — that comes from what's genuinely true about you.", "becoming": "Someone who lives with intention rather than by default."}}};

function getWorldJourney(worldSlug: string, ageBand: string | null | undefined) {
  const modeKey = (!ageBand || ageBand === '5-6') ? '5-6'
    : (ageBand === '7-8' || ageBand === '9-10') ? '7-10'
    : ageBand === '11-13' ? '11-13'
    : '14-16';
  return WORLD_JOURNEYS[worldSlug]?.[modeKey] || null;
}

// ── Journey History System ────────────────────────────────────────────────

interface JourneyRecord {
  id: string;
  title: string;
  tagline: string;
  ageBand: string;
  startDate: string;
  completedDate: string;
  weekNum: number;
  reflectionText?: string;
  identityText?: string;
  selectedChip?: string;
}

function loadJourneyHistory(): JourneyRecord[] {
  try {
    const raw = localStorage.getItem('sonder_journey_history');
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function saveJourneyToHistory(record: JourneyRecord) {
  try {
    const history = loadJourneyHistory();
    // Avoid duplicates by id
    const existing = history.findIndex(h => h.id === record.id);
    if (existing >= 0) history[existing] = record;
    else history.unshift(record); // newest first
    localStorage.setItem('sonder_journey_history', JSON.stringify(history.slice(0, 52))); // keep 1 year
  } catch(e) {}
}

// ── Journey History View ──────────────────────────────────────────────────
function JourneyHistoryView({ onBack, onNewJourney, token }: { onBack: () => void; onNewJourney: () => void; token?: string }) {
  const history = loadJourneyHistory();
  const isEmpty = history.length === 0;
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [showFullBook, setShowFullBook] = useState(false);
  const [showFullVision, setShowFullVision] = useState(false);

  // Fetch recent journal entries if token available
  useEffect(() => {
    if (!token) return;
    fetch('/api/journal', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const entries = (d.entries || []).filter((e: any) => !e.is_parent_prompt && e.response?.trim());
        setRecentEntries(entries.slice(0, 3));
      })
      .catch(() => {});
  }, [token]);

  // 3 rotating vision attributes — keyed by week
  const VISION_ATTRS = [
    "You reach for the exact word — not just 'fine' or 'bad'. Disappointed, not sad.",
    "You find the gap before you react. There's a moment there. You've learned to find it.",
    "You listen to understand, not to reply.",
    "You treat setbacks as data, not proof of something.",
    "You catch what's good — even on a hard day.",
    "You know what you stand for. Not a list you were given — something you've tested.",
    "You notice your own patterns. And you're curious about them, not ashamed.",
    "You do the right thing when no one's watching — more often than before.",
    "You follow what genuinely fascinates you, even when it doesn't make sense yet.",
    "You know you can change. You've already seen it happen.",
  ];
  const weekNum = getISOWeek(new Date());
  const visibleAttrs = [
    VISION_ATTRS[weekNum % VISION_ATTRS.length],
    VISION_ATTRS[(weekNum + 3) % VISION_ATTRS.length],
    VISION_ATTRS[(weekNum + 7) % VISION_ATTRS.length],
  ];

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); }
    catch(e) { return ''; }
  };

  if (showFullBook) {
    // Inline full book view
    return (
      <div style={{ flex: 1, background: '#F7F4FB', overflowY: 'auto' }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setShowFullBook(false)} style={{ color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
        </div>
        <div style={{ padding: '20px 20px 48px' }}>
          <h2 style={{ fontSize: 22, color: '#2A1F4A', fontWeight: 600, margin: '0 0 4px' }}>Your words</h2>
          <p style={{ fontSize: 13, color: '#7A6A9A', margin: '0 0 24px' }}>In the order you wrote it.</p>
          {recentEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontSize: 15, color: '#2A1F4A', fontWeight: 600, lineHeight: 1.6, marginBottom: 12 }}>This is where your story will begin.</p>
              <p style={{ fontSize: 14, color: '#7A6A9A', lineHeight: 1.9 }}>
                Not the big moments —<br />the small things you start to notice.<br /><br />
                It won't feel like much at first.<br />Then one day, it will.
              </p>
            </div>
          ) : recentEntries.map((e: any, i: number) => (
            <div key={e.id || i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{e.lesson?.title} · {fmt(e.updated_at)}</div>
              <div style={{ fontSize: 13, color: '#7A6A9A', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>{e.prompt_text}</div>
              <div style={{ fontSize: 15, color: '#2A1F4A', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{e.response}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showFullVision) {
    return (
      <div style={{ flex: 1, background: '#F7F4FB', overflowY: 'auto' }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setShowFullVision(false)} style={{ color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>← Back</button>
          <h1 style={{ fontSize: 22, color: '#2A1F4A', fontWeight: 600, margin: 0 }}>Where this leads</h1>
          <p style={{ fontSize: 13, color: '#7A6A9A', margin: '4px 0 0' }}>Not a destination. A direction.</p>
        </div>
        <div style={{ padding: '20px 20px 48px' }}>
          <p style={{ fontSize: 14, color: '#2A1F4A', lineHeight: 1.7, marginBottom: 24, padding: '16px 18px', background: '#fff', borderRadius: 14, borderLeft: '3px solid #534AB7' }}>
            These aren't goals. They're directions — things you grow toward slowly, through ordinary moments.
          </p>
          {[
            { world: 'Emotions', colour: '#C8A04A', attrs: ["You reach for the exact word — not just 'fine' or 'bad'.", "You feel it without becoming it. Anger visits. It isn't who you are.", "You find the gap before you react.", "You got curious about your own patterns."] },
            { world: 'Mindfulness', colour: '#534AB7', attrs: ["You found your pause button.", "You know what being present feels like — and notice when you're somewhere else.", "You catch what's good, even on a hard day."] },
            { world: 'Growth', colour: '#3C6E5A', attrs: ["You know you can change. You've seen it happen.", "You treat setbacks as data, not verdict.", "You stopped measuring yourself against other people."] },
            { world: 'Empathy', colour: '#7A6A9A', attrs: ["You listen to understand, not to reply.", "You know how to repair things after conflict.", "You're genuinely curious about people different from you."] },
            { world: 'Values', colour: '#2A1F4A', attrs: ["You know what you stand for.", "You do the right thing when no one is watching.", "You can hold two values that conflict — and sit with that honestly."] },
            { world: 'Purpose', colour: '#D85A30', attrs: ["You have a sense of what you're for.", "You follow what genuinely fascinates you.", "You know you're writing your own story."] },
          ].map((w, wi) => (
            <div key={wi} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: w.colour, marginBottom: 10 }}>{w.world}</div>
              {w.attrs.map((attr, ai) => (
                <div key={ai} style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 8, borderLeft: `3px solid ${w.colour}33` }}>
                  <div style={{ fontSize: 14, color: '#2A1F4A', lineHeight: 1.55 }}>{attr}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, background: '#F7F4FB', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>← Back</button>
        <h1 style={{ fontSize: 22, color: '#2A1F4A', fontWeight: 600, margin: 0 }}>How you're growing</h1>
        {!isEmpty && <p style={{ fontSize: 13, color: '#7A6A9A', margin: '4px 0 0' }}>{history.length} {history.length === 1 ? 'week' : 'weeks'} in — you're building something that lasts.</p>}
      </div>

      <div style={{ padding: '20px 20px 48px' }}>

        {/* ── A. Progress Timeline ── */}
        {isEmpty ? (
          <div style={{ textAlign: 'center', padding: '48px 20px 32px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <p style={{ fontSize: 16, color: '#2A1F4A', fontWeight: 600, marginBottom: 8 }}>This is the beginning.</p>
            <p style={{ fontSize: 14, color: '#7A6A9A', lineHeight: 1.6 }}>Finish your first week — it'll be here when you do.</p>
          </div>
        ) : (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7A6A9A', marginBottom: 14 }}>Your weeks</div>
            {history.map((record, i) => {
              const colour = record.ageBand === '5-6' ? '#C8A04A'
                : (record.ageBand === '7-8' || record.ageBand === '9-10') ? '#3C6E5A'
                : record.ageBand === '11-13' ? '#534AB7' : '#2A1F4A';
              const reflection = record.identityText
                ? `"I'm someone who ${record.identityText.toLowerCase().replace(/^i'm someone who\s*/i, '')}"`
                : record.reflectionText ? `"${record.reflectionText.slice(0, 80)}${record.reflectionText.length > 80 ? '…' : ''}"`
                : record.selectedChip ? `You chose: ${record.selectedChip}`
                : 'You showed up.';
              return (
                <div key={record.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 10, borderLeft: `3px solid ${colour}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: colour, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Week {record.weekNum}</span>
                    <span style={{ fontSize: 11, color: '#ccc' }}>{fmt(record.completedDate)}</span>
                  </div>
                  <div style={{ fontSize: 15, color: '#2A1F4A', fontWeight: 600, marginBottom: 4 }}>{record.title}</div>
                  <div style={{ fontSize: 13, color: '#7A6A9A', fontStyle: 'italic', lineHeight: 1.5 }}>{reflection}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── B. Your Words (Book) ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7A6A9A' }}>Your words</div>
            {recentEntries.length > 0 && (
              <button onClick={() => setShowFullBook(true)} style={{ fontSize: 12, color: '#534AB7', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>See all →</button>
            )}
          </div>
          {recentEntries.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: '#2A1F4A', fontWeight: 600, lineHeight: 1.6, marginBottom: 10 }}>This is where your story will begin.</p>
              <p style={{ fontSize: 13, color: '#7A6A9A', lineHeight: 1.9, marginBottom: 20 }}>
                Not the big moments —<br />the small things you start to notice.<br /><br />
                It won't feel like much at first.<br />Then one day, it will.
              </p>
              <button onClick={onBack} style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Write your first reflection →
              </button>
            </div>
          ) : recentEntries.map((e: any, i: number) => (
            <div key={e.id || i} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{e.lesson?.title} · {fmt(e.updated_at)}</div>
              <div style={{ fontSize: 13, color: '#7A6A9A', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>{e.prompt_text}</div>
              <div style={{ fontSize: 14, color: '#2A1F4A', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{e.response.slice(0, 120)}{e.response.length > 120 ? '…' : ''}</div>
            </div>
          ))}
        </div>

        {/* ── C. Direction (Vision) ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7A6A9A', marginBottom: 14 }}>Where this leads</div>
          {visibleAttrs.map((attr, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 8, borderLeft: '3px solid rgba(83,74,183,0.25)' }}>
              <div style={{ fontSize: 14, color: '#2A1F4A', lineHeight: 1.55 }}>{attr}</div>
            </div>
          ))}
          <button onClick={() => setShowFullVision(true)} style={{ marginTop: 8, fontSize: 13, color: '#534AB7', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
            Read the full picture →
          </button>
        </div>

        {/* ── D. Keep going CTA ── */}
        <div style={{ background: '#2A1F4A', borderRadius: 16, padding: '20px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#EDE8FC', fontWeight: 600, margin: '0 0 4px' }}>Keep going</p>
          <p style={{ fontSize: 13, color: '#9A8EC8', margin: '0 0 16px', lineHeight: 1.5 }}>Each week picks up where the last one left off.</p>
          <button onClick={onNewJourney} style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Start next week →
          </button>
        </div>
      </div>
    </div>
  );
}


// ── New Journey Screen ────────────────────────────────────────────────────
function NewJourneyScreen({ onBack, onBegin, ageBand }: { onBack: () => void; onBegin: () => void; ageBand: string | null | undefined }) {
  const [reflection, setReflection] = useState('');
  const [step, setStep] = useState<'confirm' | 'prompt'>('confirm');
  const dark = false;

  if (step === 'confirm') return (
    <div style={{ flex: 1, background: '#F7F4FB', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        <button onClick={onBack} style={{ color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px' }}>
        <h1 style={{ fontSize: 26, color: '#2A1F4A', fontWeight: 600, lineHeight: 1.3, marginBottom: 16 }}>Begin a new journey</h1>
        <p style={{ fontSize: 16, color: '#7A6A9A', lineHeight: 1.7, marginBottom: 8 }}>
          You won't lose anything.
        </p>
        <p style={{ fontSize: 16, color: '#7A6A9A', lineHeight: 1.7, marginBottom: 40 }}>
          This lets you begin again — with everything you've learned.
        </p>
        <button onClick={() => setStep('prompt')} style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 20px', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>
          Begin again →
        </button>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A6A9A', fontSize: 14, padding: '10px 0' }}>
          Not yet
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, background: '#F7F4FB', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        <button onClick={() => setStep('confirm')} style={{ color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px' }}>
        <h2 style={{ fontSize: 22, color: '#2A1F4A', fontWeight: 600, lineHeight: 1.4, marginBottom: 24 }}>
          What would you do differently this time?
        </h2>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="Optional — just for you."
          rows={4}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid rgba(83,74,183,0.2)', background: '#fff', fontSize: 15, lineHeight: 1.6, color: '#2A1F4A', fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 24 }}
        />
        <button onClick={() => {
          // Save the intention if they wrote something
          if (reflection.trim()) {
            try { localStorage.setItem('sonder_new_journey_intention', reflection.trim()); } catch(e) {}
          }
          onBegin();
        }} style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 20px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          {reflection.trim() ? 'Begin with this in mind →' : 'Begin →'}
        </button>
      </div>
    </div>
  );
}

// ── Entry Card — age-mode hook screen shown before lesson content ─────────
// ── Entry Section — inline, no overlay, no buttons ───────────────────────
// Derives age-appropriate hook text from existing lesson data.
// Rendered as the first section in the lesson scroll — lesson flows directly below.

function getEntryHook(lesson: any, ageBand: string | null | undefined): {
  mode: string; headline: string; subline: string | null;
} {
  const band = ageBand || '5-6';
  const story = lesson?.story;
  const discussion = (story?.discussion_prompt || '').trim();
  const activities = lesson?.activities || [];
  const firstAct = activities[0];
  const title = (lesson?.title || '').trim();

  const mode = band === '5-6' ? 'play'
    : (band === '7-8' || band === '9-10') ? 'guided'
    : band === '11-13' ? 'discovery'
    : 'insight';

  // ── Shared helper: first sentence/question from discussion prompt ───────
  const firstClause = (str: string, maxLen = 80): string => {
    const trimmed = str.replace(/\s+/g, ' ').trim();
    // Split on first ? or . but keep the punctuation
    const match = trimmed.match(/^(.{10,}?[.?])\s/);
    const raw = match ? match[1] : trimmed;
    // If still too long, break at last word before maxLen
    if (raw.length <= maxLen) return raw;
    const cut = raw.lastIndexOf(' ', maxLen);
    return cut > 20 ? raw.slice(0, cut) + '…' : raw.slice(0, maxLen) + '…';
  };

  if (mode === 'play') {
    // Physical, derived from lesson. Use first activity name as the action.
    // If no activity, fall back to the discussion prompt's core verb.
    if (firstAct?.name) {
      const action = firstAct.name.charAt(0).toUpperCase() + firstAct.name.slice(1);
      return { mode, headline: action + '.', subline: 'Do this together now.' };
    }
    if (discussion) {
      // Turn discussion prompt into a physical cue: strip question, make imperative
      const q = firstClause(discussion, 60).replace(/\?$/, '');
      return { mode, headline: q + '.', subline: null };
    }
    return { mode, headline: title + '.', subline: null };
  }

  if (mode === 'guided') {
    // The discussion prompt as a direct question — nothing else
    if (discussion) {
      const q = firstClause(discussion, 90);
      return { mode, headline: q.endsWith('?') ? q : q.replace(/\.$/, '') + '?', subline: null };
    }
    return { mode, headline: `What do you already know about ${title.toLowerCase()}?`, subline: null };
  }

  if (mode === 'discovery') {
    // Relatable hook — first clause of discussion prompt, stated not questioned
    if (discussion) {
      const raw = firstClause(discussion, 85);
      return { mode, headline: raw.endsWith('.') ? raw : raw.replace(/\?$/, '.'), subline: null };
    }
    return { mode, headline: title + '.', subline: null };
  }

  // insight — identity-level, fewest words possible
  // For beneath (no story), pull from first explore question instead
  const explore = lesson?.explore || [];
  const firstExploreQ = (explore[0]?.question || '').trim();

  if (firstExploreQ) {
    const raw = firstClause(firstExploreQ, 72);
    const stripped = raw.replace(/[.?]$/, '');
    return { mode, headline: stripped + '.', subline: null };
  }
  if (discussion) {
    const raw = firstClause(discussion, 72);
    const stripped = raw.replace(/[.?]$/, '');
    return { mode, headline: stripped + '.', subline: null };
  }
  return { mode, headline: title + '.', subline: null };
}

function EntrySection({ lesson, ageBand }: any) {
  const { mode, headline, subline } = getEntryHook(lesson, ageBand);

  const configs: Record<string, {
    bg: string; textColor: string; subColor: string; fontSize: number; minHeight: number;
  }> = {
    play:      { bg: '#C8A04A', textColor: '#fff',    subColor: 'rgba(255,255,255,0.75)', fontSize: 26, minHeight: 180 },
    guided:    { bg: '#3C6E5A', textColor: '#fff',    subColor: 'rgba(255,255,255,0.65)', fontSize: 22, minHeight: 160 },
    discovery: { bg: '#2A1F4A', textColor: '#EDE8FC', subColor: 'rgba(237,232,252,0.55)', fontSize: 21, minHeight: 160 },
    insight:   { bg: '#1A1228', textColor: '#EDE8FC', subColor: 'rgba(237,232,252,0.45)', fontSize: 19, minHeight: 150 },
  };

  const cfg = configs[mode] || configs.guided;

  return (
    <div style={{
      background: cfg.bg,
      padding: '48px 28px 64px',
      minHeight: cfg.minHeight,
      // Gradient fade into lesson — seamless scroll into content below
      WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
      maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
      marginBottom: -40,
      position: 'relative',
      zIndex: 1,
    }}>
      <p style={{
        fontSize: cfg.fontSize,
        fontWeight: 600,
        color: cfg.textColor,
        lineHeight: 1.3,
        margin: '0 0 12px',
        letterSpacing: mode === 'insight' ? '0.01em' : 'normal',
      }}>{headline}</p>
      {subline && (
        <p style={{
          fontSize: cfg.fontSize - 6,
          fontWeight: 400,
          color: cfg.subColor,
          lineHeight: 1.5,
          margin: 0,
        }}>{subline}</p>
      )}
      {/* Scroll nudge — subtle downward arrow */}
      <div style={{
        position: 'absolute',
        bottom: 52,
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 20,
        lineHeight: 1,
        userSelect: 'none',
      }}>↓</div>
    </div>
  );
}

// ── Lesson Detail ─────────────────────────────────────────────────────────

function LessonDetail({ lesson, token, onBack, childName, childAgeBand, childPronoun }: any) {
  const cfg = getAgeConfig(childAgeBand);
  const isBeneath = lesson.track === 'beneath';
  const [tab, setTab] = useState<'Story' | 'Explore' | 'Activities' | 'Try' | 'Journal' | 'Read'>(isBeneath ? 'Explore' : 'Story');
  const [full, setFull] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedExplore, setExpandedExplore] = useState<Set<number>>(new Set());
  const [expandedActivities, setExpandedActivities] = useState(false);
  // Entry section: show once per day per lesson
  // Delay marking as seen by 4 seconds — ensures it stays visible long enough to read
  const today = new Date().toISOString().slice(0, 10);
  const sessionKey = `entry_seen_${lesson.id}_${today}`;
  const alreadySeen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey);
  const showEntry = !alreadySeen;
  useEffect(() => {
    if (!showEntry) return;
    const timer = setTimeout(() => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(sessionKey, '1');
      }
    }, 4000); // 4s — enough to read and act before it stops showing on next open
    return () => clearTimeout(timer);
  }, [sessionKey, showEntry]);

  useEffect(() => { apiFetch(`/api/lessons/${lesson.id}`, token).then(d => { setFull(d.lesson); setLoading(false); }); }, [lesson.id, token]);

  const l = full || lesson;
  const dark = l.track === 'beneath';
  const bg = dark ? '#1A1228' : '#F7F4FB';
  const cardBg = dark ? '#2A1F4A' : '#fff';
  const textColor = dark ? '#EDE8FC' : '#2A1F4A';

  // Beneath has no story — show only relevant tabs
  const tabs = dark
    ? [
        { id: 'Explore',    icon: '💬' },
        { id: 'Try',        icon: '⚡' },
        { id: 'Journal',    icon: '✏️' },
        { id: 'Read',       icon: '📚' },
      ]
    : [
        { id: 'Story',      icon: '📖' },
        { id: 'Explore',    icon: '🔍' },
        { id: 'Activities', icon: '🎨' },
        { id: 'Journal',    icon: '✏️' },
      ];

  return (
    <div style={{ flex: 1, background: bg, overflowY: 'auto' }}>
      {/* Entry section — inline, top of scroll, flows into lesson content */}
      {showEntry && (
        <EntrySection
          lesson={{ ...l, world_slug: lesson.world_slug || l.world_slug }}
          ageBand={childAgeBand}
        />
      )}
      <div style={{ padding: '16px 20px', background: cardBg, borderBottom: '0.5px solid rgba(0,0,0,0.08)', position: 'relative', zIndex: 2 }}>
        <button onClick={onBack} style={{ color: dark ? '#9A8EC8' : '#534AB7', fontSize: 14, fontWeight: 600, marginBottom: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
        {(() => {
          const wj = getWorldJourney(l.worlds?.slug || '', childAgeBand);
          return wj && (
            <div style={{ fontSize: 11, color: dark ? '#9A8EC8' : '#7A6A9A', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Day {l.lesson_number} of 8 · {wj.journey_name}
            </div>
          );
        })()}
        <div style={{ fontSize: 22, color: textColor, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{l.title}</div>
        {dark
          ? l.description && <div style={{ fontSize: 15, color: dark ? '#C4B8E8' : '#7A6A9A', lineHeight: 1.6, marginTop: 8 }}>{l.description}</div>
          : <>
              {l.description && <div style={{ fontSize: 13, color: '#7A6A9A', lineHeight: 1.5 }}>{l.description}</div>}
            </>
        }
      </div>

      {/* FIX: tabs with icons */}
      <div style={{ display: 'flex', background: cardBg, borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{ flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'none', color: tab === t.id ? '#534AB7' : '#7A6A9A', borderBottom: `2px solid ${tab === t.id ? '#534AB7' : 'transparent'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span>{t.id}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: 20, paddingBottom: 40 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#7A6A9A' }}>Loading...</div> : (<>

          {tab === 'Story' && (l.story ? <>
            {/* FIX: read-aloud cue */}
            <div style={{ background: '#EDE8F8', borderRadius: 12, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📖</span>
              <span style={{ fontSize: 13, color: '#534AB7', fontWeight: 600 }}>Read this story together</span>
            </div>
            <h2 style={{ fontSize: 22, color: textColor, fontWeight: 600, marginBottom: 16, lineHeight: 1.3 }}>{l.story.title}</h2>
            <p style={{ fontSize: 17, color: textColor, lineHeight: 1.9, marginBottom: 24, whiteSpace: 'pre-wrap' }}>{l.story.body}</p>
            {l.story.discussion_prompt && <div style={{ background: '#EDE8F8', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#534AB7', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>💬 Talk together</div>
              <p style={{ fontSize: 15, color: '#2A1F4A', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>{l.story.discussion_prompt}</p>
            </div>}
          </> : <p style={{ color: '#7A6A9A', textAlign: 'center', padding: 40 }}>No story yet.</p>)}

          {tab === 'Explore' && (<>
            {!dark && cfg.exploreReveal && (
              <p style={{ fontSize: 13, color: '#7A6A9A', marginBottom: 16, textAlign: 'center' }}>Tap a question to reveal the answer.</p>
            )}
            {(l.explore || []).length > 0
              ? (l.explore || []).map((item: any, i: number) => {
                const isOpen = !cfg.exploreReveal || dark || expandedExplore.has(i);
                // Beneath: skip parent mirror items in child view (is_parent_mirror)
                if (dark && item.is_parent_mirror) return null;
                return (
                  <div key={i}
                    onClick={() => { if (cfg.exploreReveal && !dark) setExpandedExplore(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; }); }}
                    style={{ background: cardBg, borderRadius: 14, padding: dark ? 20 : 16, marginBottom: 16, boxShadow: dark ? 'none' : '0 2px 6px rgba(0,0,0,0.04)', cursor: cfg.exploreReveal && !dark ? 'pointer' : 'default', borderLeft: dark ? '3px solid rgba(155,130,220,0.4)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: dark ? 17 : 16, color: textColor, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{item.question}</div>
                      {cfg.exploreReveal && !dark && <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{isOpen ? '▾' : '▸'}</span>}
                    </div>
                    {isOpen && <div style={{ fontSize: dark ? 16 : 15, color: dark ? '#C4B8E8' : textColor, lineHeight: 1.7, marginTop: 12, paddingTop: dark ? 0 : 10, borderTop: dark ? 'none' : '0.5px solid rgba(0,0,0,0.06)' }}>{item.answer}</div>}
                  </div>
                );
              })
              : <p style={{ color: '#7A6A9A', textAlign: 'center', padding: 40 }}>No content yet.</p>
            }
            {/* Beneath: parent mirror questions shown in a separate section */}
            {dark && (l.explore || []).some((e: any) => e.is_parent_mirror) && (
              <div style={{ marginTop: 8, background: 'rgba(42,31,74,0.5)', borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, color: '#9A8EC8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>Go deeper</div>
                {(l.explore || []).filter((e: any) => e.is_parent_mirror).map((item: any, i: number) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, color: '#C4B8E8', fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{item.question}</div>
                    <div style={{ fontSize: 14, color: '#9A8EC8', lineHeight: 1.6 }}>{item.answer}</div>
                  </div>
                ))}
              </div>
            )}
          </>)}

          {(tab === 'Activities' || tab === 'Try') && (<>
            {(l.activities || []).length > 0 ? (<>
              {/* Age-aware: highlight first activity for younger ages */}
              {(l.activities || []).map((a: any, i: number) => {
                const typeIcon: Record<string, string> = { Game: '🎮', Creative: '🎨', Mindful: '🧘', Reflection: '💭', Discussion: '💬', Practice: '✨' };
                const typeLabel: Record<string, string> = dark ? { Reflection: 'Think', Discussion: 'Talk', Practice: 'Do it', Game: 'Try', Creative: 'Make', Mindful: 'Notice' } : {};
                const displayType = typeLabel[a.type] || a.type;
                const isHighlighted = cfg.activitiesHighlightFirst && i === 0;
                const isCollapsed = cfg.activitiesHighlightFirst && i > 0 && !expandedActivities;
                if (isCollapsed) return null;
                return (
                  <div key={i} style={{ background: isHighlighted ? '#EDE8F8' : cardBg, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: isHighlighted ? '0 2px 12px rgba(83,74,183,0.15)' : '0 2px 6px rgba(0,0,0,0.04)', border: isHighlighted ? '1.5px solid rgba(83,74,183,0.2)' : 'none' }}>
                    {isHighlighted && <div style={{ fontSize: 11, color: '#534AB7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>⭐ Try this one</div>}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: isHighlighted ? '#fff' : '#EDE8F8', borderRadius: 999, padding: '4px 12px', fontSize: 12, color: '#534AB7', fontWeight: 700, marginBottom: 10 }}>
                      <span>{typeIcon[a.type] || '✨'}</span>
                      <span>{displayType}</span>
                    </div>
                    <div style={{ fontSize: 16, color: textColor, fontWeight: 600, marginBottom: 8 }}>{a.name}</div>
                    <div style={{ fontSize: 14, color: textColor, lineHeight: 1.6 }}>{a.description}</div>
                  </div>
                );
              })}
              {/* Show more toggle for younger ages */}
              {cfg.activitiesHighlightFirst && (l.activities || []).length > 1 && (
                <button onClick={() => setExpandedActivities(v => !v)}
                  style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1.5px solid rgba(83,74,183,0.2)', background: 'none', color: '#534AB7', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                  {expandedActivities ? '▲ Show less' : `▾ ${(l.activities || []).length - 1} more ${(l.activities || []).length - 1 === 1 ? 'activity' : 'activities'}`}
                </button>
              )}
            </>) : <p style={{ color: '#7A6A9A', textAlign: 'center', padding: 40 }}>No activities yet.</p>}
          </>)}

          {tab === 'Journal' && (<>
            {l.parent_guide && !dark && (<div style={{ background: '#FBF0D8', borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#C8A04A', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Parent guide</div>
              <div style={{ fontSize: 14, color: '#2A1F4A', lineHeight: 1.6 }}>{l.parent_guide}</div>
            </div>)}
            {(l.journal || []).length === 0
              ? <p style={{ color: '#7A6A9A', textAlign: 'center', padding: 40 }}>No journal prompts yet.</p>
              : <>
                {/* FIX: child section header with name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>✏️</span>
                  <span style={{ fontSize: 14, color: '#534AB7', fontWeight: 700 }}>
                    {childName ? `${childName}'s journal` : 'Journal'}
                  </span>
                </div>
                <JournalWriter lessonId={l.id} prompts={l.journal} token={token} isParentView={false} childName={childName} ageConfig={cfg} childPronoun={childPronoun} />

                {(l.journal || []).some((j: any) => j.is_parent_prompt) && !dark && (<>
                  {cfg.parentSectionStyle === 'strong' ? (
                    <div style={{ background: '#F0F7FF', borderRadius: 16, padding: 20, marginTop: 28, border: '1px solid rgba(42,122,183,0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: 20 }}>🌿</span>
                        <div>
                          <div style={{ fontSize: 14, color: '#2A7AB7', fontWeight: 700 }}>For you — parent reflection</div>
                          <div style={{ fontSize: 11, color: '#7A6A9A', marginTop: 2 }}>Your child won't see this section.</div>
                        </div>
                      </div>
                      <JournalWriter lessonId={l.id} prompts={l.journal} token={token} isParentView={true} childName={childName} ageConfig={cfg} />
                    </div>
                  ) : (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(83,74,183,0.12)' }} />
                        <span style={{ fontSize: 11, color: '#7A6A9A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>🌿 For you</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(83,74,183,0.12)' }} />
                      </div>
                      <JournalWriter lessonId={l.id} prompts={l.journal} token={token} isParentView={true} childName={childName} ageConfig={cfg} />
                    </div>
                  )}
                </>)}
              </>
            }

          </>)}

          {tab === 'Read' && (
            <div style={{ paddingBottom: 20 }}>
              {(() => {
                const worldSlug = (l.worlds as any)?.slug || '';
                const ageBandKey = childAgeBand === '11-13' ? '11-13' : '14-16';
                const supp = BENEATH_SUPPLEMENTS[worldSlug]?.[ageBandKey] || { podcasts: [], films: [] };

                const allBooks: Array<{author: string; title: string; note: string}> = [];
                (l.parallel || []).forEach((p: any) => {
                  if (p.reading && !p.reading.includes('Whatever is next')) {
                    parseBookReferences(p.reading).forEach(b => {
                      if (!allBooks.find(x => x.title === b.title)) allBooks.push(b);
                    });
                  }
                });

                return (<>
                  {allBooks.length > 0 && (<>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9A8EC8', marginBottom: 14 }}>📖 Reading</div>
                    {allBooks.map((book, i) => (
                      <div key={i} style={{ background: '#2A1F4A', borderRadius: 14, padding: 16, marginBottom: 10, borderLeft: '3px solid rgba(155,130,220,0.5)' }}>
                        {book.author && <div style={{ fontSize: 12, color: '#9A8EC8', fontWeight: 600, marginBottom: 4 }}>{book.author}</div>}
                        <div style={{ fontSize: 15, color: '#EDE8FC', fontWeight: 600, lineHeight: 1.3, marginBottom: book.note ? 8 : 0 }}>{book.title}</div>
                        {book.note && <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.6 }}>{book.note}</div>}
                      </div>
                    ))}
                    <div style={{ height: 1, background: 'rgba(155,130,220,0.15)', margin: '20px 0' }} />
                  </>)}

                  {supp.podcasts.length > 0 && (<>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9A8EC8', marginBottom: 14 }}>🎧 Podcasts</div>
                    {supp.podcasts.map((pod: any, i: number) => (
                      <div key={i} style={{ background: '#2A1F4A', borderRadius: 14, padding: 16, marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: '#9A8EC8', fontWeight: 600, marginBottom: 4 }}>{pod.creator}</div>
                        <div style={{ fontSize: 15, color: '#EDE8FC', fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>{pod.title}</div>
                        <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.6 }}>{pod.why}</div>
                      </div>
                    ))}
                    <div style={{ height: 1, background: 'rgba(155,130,220,0.15)', margin: '20px 0' }} />
                  </>)}

                  {supp.films.length > 0 && (<>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9A8EC8', marginBottom: 14 }}>🎬 Films</div>
                    {supp.films.map((film: any, i: number) => (
                      <div key={i} style={{ background: '#2A1F4A', borderRadius: 14, padding: 16, marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: '#9A8EC8', fontWeight: 600, marginBottom: 4 }}>{film.year}</div>
                        <div style={{ fontSize: 15, color: '#EDE8FC', fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>{film.title}</div>
                        <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.6 }}>{film.why}</div>
                      </div>
                    ))}
                  </>)}

                  {allBooks.length === 0 && supp.podcasts.length === 0 && supp.films.length === 0 && (
                    <p style={{ color: '#7A6A9A', textAlign: 'center', padding: 40 }}>No resources for this session yet.</p>
                  )}
                </>);
              })()}
            </div>
          )}

        </>)}
      </div>
    </div>
  );
}

// ── Tab screens ───────────────────────────────────────────────────────────
function WonderTab({ worlds, token, childProfile }: any) {
  const [world, setWorld] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const defaultBand = childProfile?.age_band && WONDER_BANDS.includes(childProfile.age_band) ? childProfile.age_band : '5-6';
  const childName = childProfile?.name || null;
  const childPronoun = childProfile?.pronoun || null;

  if (lesson) return <LessonDetail lesson={lesson} token={token} onBack={() => setLesson(null)} childName={childName} childAgeBand={defaultBand} childPronoun={childPronoun} />;
  if (world) return <LessonList world={world} token={token} track="wonder" defaultBand={defaultBand} onLesson={setLesson} onBack={() => setWorld(null)} />;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <h2 style={{ fontSize: 28, color: '#2A1F4A', fontWeight: 300, marginBottom: 4 }}>Wonder ✨</h2>
      <p style={{ fontSize: 14, color: '#7A6A9A', marginBottom: 24 }}>Six worlds of guided lessons for ages 5–10.</p>
      {worlds.map((w: any) => <WorldCard key={w.slug} world={w} onClick={() => setWorld(w)} childFriendly />)}
    </div>
  );
}

function BeneathTab({ worlds, token, childProfile }: any) {
  const [world, setWorld] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const defaultBand = childProfile?.age_band && ['11-13','14-16'].includes(childProfile.age_band) ? childProfile.age_band : '11-13';
  const childName = childProfile?.name || null;
  const childPronoun = childProfile?.pronoun || null;

  if (lesson) return <LessonDetail lesson={lesson} token={token} onBack={() => setLesson(null)} childName={childName} childAgeBand={defaultBand} childPronoun={childPronoun} />;
  if (world) return <LessonList world={world} token={token} track="beneath" defaultBand={defaultBand} onLesson={setLesson} onBack={() => setWorld(null)} />;
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#1A1228', padding: 20 }}>
      <h2 style={{ fontSize: 28, color: '#EDE8FC', fontWeight: 300, marginBottom: 4 }}>Beneath</h2>
      <p style={{ fontSize: 14, color: '#7A6A9A', marginBottom: 24 }}>Deeper sessions for ages 11–16.</p>
      {worlds.map((w: any) => <WorldCard key={w.slug} world={w} onClick={() => setWorld(w)} dark />)}
    </div>
  );
}

// ── Book Tab ──────────────────────────────────────────────────────────────
function BookTab({ token, childName, setTab }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<'child' | 'parent'>('child');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/journal', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        const e = d.entries || [];
        setEntries(e);
        const slugs = new Set<string>(e.map((x: any) => x.lesson?.world?.slug).filter(Boolean));
        setExpanded(slugs);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const groups: Record<string, { world: any; child: any[]; parent: any[] }> = {};
  entries.forEach(e => {
    const w = e.lesson?.world; if (!w) return;
    if (!groups[w.slug]) groups[w.slug] = { world: w, child: [], parent: [] };
    if (e.is_parent_prompt) groups[w.slug].parent.push(e); else groups[w.slug].child.push(e);
  });

  const visibleGroups = Object.values(groups).filter(g => section === 'child' ? g.child.length > 0 : g.parent.length > 0);
  const childTotal = entries.filter(e => !e.is_parent_prompt).length;
  const parentTotal = entries.filter(e => e.is_parent_prompt).length;
  const toggle = (slug: string) => setExpanded(prev => { const next = new Set(prev); next.has(slug) ? next.delete(slug) : next.add(slug); return next; });
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  // FIX: use child name in toggle labels
  const childLabel = childName ? `${childName}'s thoughts` : 'Their thoughts';

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F7F4FB', padding: 20, paddingBottom: 40 }}>
      <h2 style={{ fontSize: 28, color: '#2A1F4A', fontWeight: 300, marginBottom: 2 }}>📖 The Book</h2>
      <p style={{ fontSize: 14, color: '#7A6A9A', marginBottom: 20 }}>Your family's reflections.</p>

      {/* FIX: child name in toggle */}
      <div style={{ display: 'flex', background: '#EDE8F8', borderRadius: 12, padding: 3, marginBottom: 20 }}>
        {(['child', 'parent'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)} style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: section === s ? '#fff' : 'transparent', color: section === s ? '#2A1F4A' : '#7A6A9A', boxShadow: section === s ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {s === 'child' ? childLabel : 'Your reflections'}
            {((s === 'child' ? childTotal : parentTotal) > 0) && (<span style={{ background: '#534AB7', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>{s === 'child' ? childTotal : parentTotal}</span>)}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#7A6A9A' }}>Loading…</div>
        : visibleGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>📝</div>
            <div style={{ fontSize: 16, color: '#2A1F4A', fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>This is where your story will live.</div>
            <div style={{ fontSize: 14, color: '#7A6A9A', lineHeight: 1.9, marginBottom: 24 }}>
              Every time you pause and reflect,<br />
              you'll start to see patterns.<br /><br />
              Not today.<br />
              But soon.
            </div>
            <button onClick={() => setTab && setTab('wonder')} style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Start your first reflection →
            </button>
          </div>
        ) : visibleGroups.map(({ world, child, parent }) => {
          const colour = COLOURS[world.slug] || '#534AB7';
          const display = WORLD_DISPLAY[world.slug];
          const currentEntries = section === 'child' ? child : parent;
          const isOpen = expanded.has(world.slug);
          return (
            <div key={world.slug} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
              <button onClick={() => toggle(world.slug)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', borderLeft: `4px solid ${colour}`, textAlign: 'left', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  {display && <span style={{ fontSize: 20 }}>{display.emoji}</span>}
                  <div>
                    <div style={{ fontSize: 15, color: '#2A1F4A', fontWeight: 600 }}>{world.title || world.name}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{currentEntries.length} {currentEntries.length === 1 ? 'entry' : 'entries'}</div>
                  </div>
                </div>
                <span style={{ color: '#bbb', fontSize: 18 }}>{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (<div style={{ borderTop: '0.5px solid #f0ede8' }}>
                {currentEntries.map((e: any) => (
                  <div key={e.id} style={{ padding: '16px 16px', borderBottom: '0.5px solid #f5f3f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: colour, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{e.lesson?.title}</span>
                      <span style={{ fontSize: 11, color: '#ccc' }}>{fmt(e.updated_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>{e.prompt_text}</div>
                    {/* FIX: larger, warmer response text */}
                    <div style={{ fontSize: 16, color: '#2A1F4A', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontWeight: 400 }}>{e.response}</div>
                  </div>
                ))}
              </div>)}
            </div>
          );
        })
      }
    </div>
  );
}

// ── Home Tab ──────────────────────────────────────────────────────────────
// ── Daily Moment Card ─────────────────────────────────────────────────────
// Picks one moment per day based on date + age band.
// Fetches moments.json from /moments.json (place in /public).
// Maps app age bands (5-6, 7-8, 9-10, 11-13, 14-16) to moment modes.

function getMomentAgeMode(ageBand: string | null | undefined): string {
  if (!ageBand) return '7-10';
  if (ageBand === '5-6') return '5-6';
  if (ageBand === '7-8' || ageBand === '9-10') return '7-10';
  if (ageBand === '11-13') return '11-13';
  return '14-16';
}

function getDailyMomentIndex(total: number): number {
  // Deterministic: changes once per day, consistent across sessions
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return parseInt(today, 10) % total;
}

// ── Daily Moment — 5-step core loop ─────────────────────────────────────
// Steps: entry → experience → action → reflection → close
// Target: <30 seconds, no writing required

function DailyMomentCard({ ageBand }: { ageBand: string | null | undefined }) {
  const today = new Date().toISOString().slice(0, 10);
  const storageKey = `moment_loop_${today}`;

  // Restore today's state from localStorage
  const getInitialState = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return { step: 'entry', reflection: '', completed: false };
  };

  const init = getInitialState();
  const [moment, setMoment] = useState<any>(null);
  const [step, setStep] = useState<'entry'|'experience'|'action'|'reflection'|'close'>(init.completed ? 'close' : 'entry');
  const [reflection, setReflection] = useState<string>(init.reflection || '');
  const [completed, setCompleted] = useState<boolean>(init.completed || false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/moments.json')
      .then(r => r.json())
      .then((data: any[]) => {
        const idx = getDailyMomentIndex(data.length);
        const m = data[idx];
        const mode = getMomentAgeMode(ageBand);
        const modeData = m?.age_modes?.[mode];
        if (m && modeData) setMoment({ attribute: m.attribute, ...modeData });
      })
      .catch(() => {});
  }, [ageBand]);

  // Fade in on step change
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [step]);

  const persist = (updates: any) => {
    try { localStorage.setItem(storageKey, JSON.stringify({ step, reflection, completed, ...updates })); }
    catch(e) {}
  };

  const advance = (next: typeof step, updates: any = {}) => {
    persist({ step: next, ...updates });
    setStep(next);
  };

  const selectReflection = (val: string) => {
    setReflection(val);
    persist({ reflection: val });
    setTimeout(() => advance('close', { reflection: val, completed: true }), 300);
    setCompleted(true);
  };

  const finish = () => {
    persist({ completed: true, step: 'close' });
    setCompleted(true);
    advance('close');
  };

  if (!moment) return null;

  const fade: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  };

  // ── CLOSE — already done today ────────────────────────────────────────
  if (step === 'close' || completed) {
    const closes = [
      "You showed up today.",
      "That's enough.",
      "You noticed. That's the whole thing.",
      "Small things add up.",
      "Something landed. Let it.",
      "Good. You were here.",
    ];
    const closeMsg = closes[getDailyMomentIndex(closes.length)];
    const reflectionLabels: Record<string, string> = {
      'noticed': 'You noticed something.',
      'handled': 'You handled something better.',
      'unsure': 'Still sitting with it.',
    };
    return (
      <div style={{ ...fade, background: '#fff', borderRadius: 18, border: '1.5px solid #EDE8F8', marginBottom: 20, padding: '20px 20px 18px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#534AB7', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: '#2A1F4A', fontWeight: 600, lineHeight: 1.4 }}>{closeMsg}</div>
            {reflection && <div style={{ fontSize: 12, color: '#7A6A9A', marginTop: 3 }}>{reflectionLabels[reflection] || ''}</div>}
          </div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>Today ✓</div>
        </div>
      </div>
    );
  }

  // ── ENTRY ─────────────────────────────────────────────────────────────
  if (step === 'entry') return (
    <div style={{ ...fade, background: 'linear-gradient(160deg, #534AB7 0%, #2A1F4A 100%)', borderRadius: 18, marginBottom: 20, overflow: 'hidden', cursor: 'pointer' }} onClick={() => advance('experience')}>
      <div style={{ padding: '20px 20px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Today's moment</div>
        <div style={{ fontSize: 17, color: '#fff', lineHeight: 1.55, fontWeight: 500, marginBottom: 20 }}>
          {moment.situation}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Begin</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>→</div>
        </div>
      </div>
    </div>
  );

  // ── EXPERIENCE ────────────────────────────────────────────────────────
  if (step === 'experience') return (
    <div style={{ ...fade, background: '#fff', borderRadius: 18, border: '1.5px solid #EDE8F8', marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '22px 20px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>This week's idea</div>
        <div style={{ fontSize: 18, color: '#2A1F4A', lineHeight: 1.6, fontWeight: 400, fontStyle: 'italic', marginBottom: 24, borderLeft: '2.5px solid #534AB7', paddingLeft: 14 }}>
          "{moment.micro_insight}"
        </div>
        <button onClick={() => advance('action')} style={{ width: '100%', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Got it →
        </button>
      </div>
    </div>
  );

  // ── ACTION ────────────────────────────────────────────────────────────
  if (step === 'action') return (
    <div style={{ ...fade, background: '#F7F4FB', borderRadius: 18, border: '1.5px solid #EDE8F8', marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '22px 20px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7A6A9A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Today</div>
        <div style={{ fontSize: 16, color: '#2A1F4A', lineHeight: 1.65, fontWeight: 500, marginBottom: 24 }}>
          {moment.try_this}
        </div>
        <button onClick={() => advance('reflection')} style={{ width: '100%', background: '#2A1F4A', color: '#EDE8FC', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          I'll try this →
        </button>
      </div>
    </div>
  );

  // ── REFLECTION ────────────────────────────────────────────────────────
  if (step === 'reflection') {
    const options = [
      { id: 'noticed', label: 'I noticed something' },
      { id: 'handled', label: 'I handled something better' },
      { id: 'unsure', label: 'Still sitting with it' },
    ];
    return (
      <div style={{ ...fade, background: '#fff', borderRadius: 18, border: '1.5px solid #EDE8F8', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ padding: '22px 20px 20px' }}>
          <div style={{ fontSize: 15, color: '#2A1F4A', fontWeight: 600, marginBottom: 18 }}>What stayed with you?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {options.map(opt => (
              <button key={opt.id} onClick={() => selectReflection(opt.id)}
                style={{ width: '100%', background: reflection === opt.id ? '#534AB7' : '#F7F4FB', color: reflection === opt.id ? '#fff' : '#2A1F4A', border: `1.5px solid ${reflection === opt.id ? '#534AB7' : '#EDE8F8'}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                {opt.label}
              </button>
            ))}
          </div>
          {!noteOpen ? (
            <button onClick={() => setNoteOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#aaa', padding: 0, textDecoration: 'underline' }}>
              Add a few words
            </button>
          ) : (
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Just for you…" rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #EDE8F8', background: '#F7F4FB', fontSize: 13, color: '#2A1F4A', fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          )}
          <button onClick={finish} style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#aaa', padding: '4px 0' }}>
            Skip →
          </button>
        </div>
      </div>
    );
  }

  return null;
}


// ── Journey System ────────────────────────────────────────────────────────
// Picks one journey per week based on ISO week number + age mode
// Journeys live in /public/journeys.json

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getCurrentDayInJourney(): number {
  // Day 1 = Monday of the current week
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon...
  return day === 0 ? 7 : day; // Sunday becomes day 7
}

function getJourneyAgeMode(ageBand: string | null | undefined): string {
  if (!ageBand) return '7-10';
  if (ageBand === '5-6') return '5-6';
  if (ageBand === '7-8' || ageBand === '9-10') return '7-10';
  if (ageBand === '11-13') return '11-13';
  return '14-16';
}

function JourneyCard({ ageBand, onOpen }: { ageBand: string | null | undefined; onOpen: (journey: any, dayNum: number) => void }) {
  const [journey, setJourney] = useState<any>(null);
  const [dayNum, setDayNum] = useState(1);

  useEffect(() => {
    fetch('/journeys.json')
      .then(r => r.json())
      .then((all: any[]) => {
        const mode = getJourneyAgeMode(ageBand);
        const filtered = all.filter(j => j.age_mode === mode);
        if (!filtered.length) return;
        const week = getISOWeek(new Date());
        const idx = week % filtered.length;
        const j = filtered[idx];
        const d = getCurrentDayInJourney();
        const clampedDay = Math.min(d, j.days.length);
        setJourney(j);
        setDayNum(clampedDay);
      })
      .catch(() => {});
  }, [ageBand]);

  if (!journey) return null;

  const todayData = journey.days[dayNum - 1];
  if (!todayData) return null;

  const totalDays = journey.days.length;
  const accentColour = getJourneyAgeMode(ageBand) === '5-6' ? '#C8A04A'
    : getJourneyAgeMode(ageBand) === '7-10' ? '#3C6E5A'
    : getJourneyAgeMode(ageBand) === '11-13' ? '#534AB7'
    : '#2A1F4A';

  return (
    <button onClick={() => onOpen(journey, dayNum)} style={{
      width: '100%', background: '#fff', borderRadius: 18, marginBottom: 16,
      border: `1.5px solid ${accentColour}22`, cursor: 'pointer', textAlign: 'left',
      overflow: 'hidden', display: 'block', padding: 0,
    }}>
      {/* Progress strip */}
      <div style={{ height: 3, background: '#EDE8F8', borderRadius: '18px 18px 0 0' }}>
        <div style={{ height: 3, background: accentColour, width: `${(dayNum / totalDays) * 100}%`, borderRadius: '18px 18px 0 0', transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ padding: '14px 18px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColour }}>
            This week · Day {dayNum} of {totalDays}
          </span>
          <span style={{ fontSize: 12, color: '#aaa' }}>›</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#2A1F4A', marginBottom: 4, lineHeight: 1.3 }}>{journey.title}</div>
        <div style={{ fontSize: 13, color: '#7A6A9A', lineHeight: 1.5 }}>{todayData.focus}</div>
      </div>
    </button>
  );
}

// ── Day 5 Completion Experience ──────────────────────────────────────────

function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

function FadeStep({ children, delay = 0, style = {} }: any) {
  const visible = useFadeIn(delay);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Day5 sub-components (must be outside Day5Completion for SWC) ─────────
function D5Fade({ children, delay = 0, style = {} }: any) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.5s ease, transform 0.5s ease', ...style }}>
      {children}
    </div>
  );
}

function D5CTA({ onClick, label, secondary = false, accentColour, mutedColor, dark }: any) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
      background: secondary ? 'transparent' : accentColour,
      color: secondary ? mutedColor : '#fff',
      fontSize: 16, fontWeight: 600, marginTop: secondary ? 8 : 0,
      borderTop: secondary ? `0.5px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` : 'none',
    }}>{label}</button>
  );
}

function Day5Completion({ journey, ageBand, onBack, onDone, nextJourney }: any) {
  const mode = getJourneyAgeMode(ageBand);
  const isYounger = mode === '5-6' || mode === '7-10';
  const dark = mode === '14-16' || mode === '11-13';
  const accentColour = mode === '5-6' ? '#C8A04A'
    : mode === '7-10' ? '#3C6E5A'
    : mode === '11-13' ? '#534AB7'
    : '#2A1F4A';
  const bg = dark ? '#1A1228' : '#F7F4FB';
  const cardBg = dark ? '#2A1F4A' : '#fff';
  const textColor = dark ? '#EDE8FC' : '#2A1F4A';
  const mutedColor = dark ? '#9A8EC8' : '#7A6A9A';

  const STEPS = ['arrival', 'reflection', 'identity', 'summary', 'complete', 'next'];
  const [stepIdx, setStepIdx] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [identityText, setIdentityText] = useState('');
  const [selectedChip, setSelectedChip] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const step = STEPS[stepIdx];
  const theme = journey.title;
  const weekId = `week_${getISOWeek(new Date())}_${mode}`;

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  useEffect(() => {
    if (step !== 'arrival') return;
    const t = setTimeout(() => setShowCTA(true), 2000);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step === 'summary') {
      try { localStorage.setItem(`week_completed_${weekId}`, '1'); } catch(e) {}
    }
  }, [step, weekId]);

  const advance = () => setStepIdx(i => Math.min(i + 1, STEPS.length - 1));

  const startListening = (setter: (v: string) => void, current: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (recognitionRef.current) recognitionRef.current.stop();
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = 'en-AU';
    recognitionRef.current = r;
    r.onstart = () => setListening(true);
    r.onresult = (e: any) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setter(current + (current ? ' ' : '') + t);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };



  const chips = ['kind', 'brave', 'patient', 'honest', 'helpful', 'curious'];

  const renderStep = () => {
    if (step === 'arrival') return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 28px' }}>
        <D5Fade delay={200}><p style={{ fontSize: 26, fontWeight: 600, color: textColor, lineHeight: 1.35, margin: '0 0 20px' }}>You made it to the end of the week.</p></D5Fade>
        <D5Fade delay={900}><p style={{ fontSize: 16, color: mutedColor, lineHeight: 1.7, margin: '0 0 48px' }}>Take a breath. Something's different — even if you can't name it yet.</p></D5Fade>
        <D5Fade delay={showCTA ? 200 : 99999}>
          {showCTA && <D5CTA onClick={advance} label="Continue →" accentColour={accentColour} mutedColor={mutedColor} dark={dark} />}
        </D5Fade>
      </div>
    );

    if (step === 'reflection') return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 28px' }}>
        <D5Fade delay={100}>
          <p style={{ fontSize: 22, fontWeight: 600, color: textColor, lineHeight: 1.4, margin: '0 0 24px' }}>
            {isYounger
              ? `This week was about ${theme.toLowerCase()}. Can you think of one moment you did that?`
              : `This week was about ${theme.toLowerCase()}. What did you notice about how you show up?`}
          </p>
        </D5Fade>
        <D5Fade delay={400} style={{ flex: 1 }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <textarea value={reflectionText} onChange={e => setReflectionText(e.target.value)}
              placeholder={isYounger ? 'Something that happened...' : 'Write honestly — this is just for you.'}
              rows={4}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(83,74,183,0.2)'}`, background: dark ? 'rgba(255,255,255,0.05)' : '#fff', color: textColor, fontSize: 15, lineHeight: 1.6, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
            {speechSupported && (
              <button onClick={() => listening ? stopListening() : startListening(setReflectionText, reflectionText)}
                style={{ position: 'absolute', right: 10, bottom: 10, background: listening ? accentColour : dark ? 'rgba(255,255,255,0.1)' : '#EDE8F8', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: listening ? '#fff' : mutedColor, fontSize: 13, fontWeight: 600 }}>
                {listening ? '⏹ Stop' : '🎙 Speak'}
              </button>
            )}
          </div>
        </D5Fade>
        <D5Fade delay={600}><D5CTA onClick={advance} label={reflectionText.trim() ? 'Continue →' : 'Skip →'} accentColour={accentColour} mutedColor={mutedColor} dark={dark} /></D5Fade>
      </div>
    );

    if (step === 'identity') return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 28px' }}>
        {isYounger ? (
          <>
            <D5Fade delay={100}><p style={{ fontSize: 22, fontWeight: 600, color: textColor, lineHeight: 1.4, margin: '0 0 24px' }}>This week, which word feels most like you?</p></D5Fade>
            <D5Fade delay={300} style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                {chips.map((c: string) => (
                  <button key={c} onClick={() => setSelectedChip(c)} style={{ padding: '10px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', background: selectedChip === c ? accentColour : dark ? 'rgba(255,255,255,0.08)' : '#EDE8F8', color: selectedChip === c ? '#fff' : textColor, fontSize: 16, fontWeight: 600, transition: 'all 0.2s' }}>{c}</button>
                ))}
              </div>
              {selectedChip && <p style={{ fontSize: 16, color: mutedColor, fontStyle: 'italic', lineHeight: 1.7 }}>That's already in you.</p>}
            </D5Fade>
            <D5Fade delay={400}><D5CTA onClick={advance} label={selectedChip ? 'Continue →' : 'Skip →'} accentColour={accentColour} mutedColor={mutedColor} dark={dark} /></D5Fade>
          </>
        ) : (
          <>
            <D5Fade delay={100}><p style={{ fontSize: 22, fontWeight: 600, color: textColor, lineHeight: 1.4, margin: '0 0 12px' }}>One sentence to finish:</p></D5Fade>
            <D5Fade delay={300}><p style={{ fontSize: 18, color: accentColour, fontWeight: 600, margin: '0 0 16px' }}>"I'm someone who…"</p></D5Fade>
            <D5Fade delay={500} style={{ flex: 1 }}>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <textarea value={identityText} onChange={e => setIdentityText(e.target.value)}
                  placeholder="finish the sentence"
                  rows={3}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(83,74,183,0.2)'}`, background: dark ? 'rgba(255,255,255,0.05)' : '#fff', color: textColor, fontSize: 15, lineHeight: 1.6, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                {speechSupported && (
                  <button onClick={() => listening ? stopListening() : startListening(setIdentityText, identityText)}
                    style={{ position: 'absolute', right: 10, bottom: 10, background: listening ? accentColour : dark ? 'rgba(255,255,255,0.1)' : '#EDE8F8', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: listening ? '#fff' : mutedColor, fontSize: 13, fontWeight: 600 }}>
                    {listening ? '⏹ Stop' : '🎙 Speak'}
                  </button>
                )}
              </div>
              {identityText.trim() && <p style={{ fontSize: 15, color: mutedColor, fontStyle: 'italic', lineHeight: 1.7 }}>Hold on to that.</p>}
            </D5Fade>
            <D5Fade delay={600}><D5CTA onClick={advance} label={identityText.trim() ? 'Continue →' : 'Skip →'} accentColour={accentColour} mutedColor={mutedColor} dark={dark} /></D5Fade>
          </>
        )}
      </div>
    );

    if (step === 'summary') return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 28px' }}>
        {isYounger ? (
          <>
            <D5Fade delay={100}><p style={{ fontSize: 22, color: textColor, fontWeight: 600, lineHeight: 1.5, margin: '0 0 16px' }}>You practised {theme.toLowerCase()} this week.</p></D5Fade>
            <D5Fade delay={600}><p style={{ fontSize: 18, color: mutedColor, lineHeight: 1.7, margin: '0 0 12px' }}>You noticed things.</p></D5Fade>
            <D5Fade delay={1100}><p style={{ fontSize: 18, color: mutedColor, lineHeight: 1.7, margin: '0 0 12px' }}>You tried.</p></D5Fade>
            <D5Fade delay={1600}><p style={{ fontSize: 18, color: textColor, lineHeight: 1.7, margin: '0 0 40px' }}>That's exactly how it works.</p></D5Fade>
            <D5Fade delay={2200}><D5CTA onClick={advance} label="Continue →" accentColour={accentColour} mutedColor={mutedColor} dark={dark} /></D5Fade>
          </>
        ) : (
          <>
            <D5Fade delay={100}><p style={{ fontSize: 22, color: textColor, fontWeight: 600, lineHeight: 1.5, margin: '0 0 16px' }}>You did the week.</p></D5Fade>
            <D5Fade delay={700}><p style={{ fontSize: 18, color: mutedColor, lineHeight: 1.7, margin: '0 0 12px' }}>Not every day. But enough.</p></D5Fade>
            <D5Fade delay={1100}><p style={{ fontSize: 18, color: mutedColor, lineHeight: 1.7, margin: '0 0 12px' }}>You paid attention where most people don't.</p></D5Fade>
            <D5Fade delay={1600}><p style={{ fontSize: 18, color: textColor, lineHeight: 1.7, margin: '0 0 40px' }}>That's how change starts.</p></D5Fade>
            <D5Fade delay={2200}><D5CTA onClick={advance} label="See what this added up to →" accentColour={accentColour} mutedColor={mutedColor} dark={dark} /></D5Fade>
          </>
        )}
      </div>
    );

    if (step === 'complete') {
      // Generate 1-2 personalised observations from journey + what user did
      const observations: string[] = [];
      if (reflectionText.trim()) observations.push("You put it into words. That takes something.");
      else if (selectedChip) observations.push(`You named it: ${selectedChip}. That's not nothing.`);
      else if (identityText.trim()) observations.push("You finished that sentence. Most people never do.");
      
      // Journey-derived observation based on final day insight
      const finalInsight = journey.days[journey.days.length - 1]?.insight || '';
      if (finalInsight) {
        const derived = finalInsight.length > 60 ? finalInsight.slice(0, 58) + '…' : finalInsight;
        observations.push(`"${derived}"`);
      }
      // Always have at least one
      if (observations.length === 0) observations.push("You showed up every day this was available to you.");
      const shownObs = observations.slice(0, 2);

      // Days completed — count how many day views were opened (approximate from journey length)
      const daysLabel = journey.days.length === 5 ? 'five days' : `${journey.days.length} days`;

      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 28px' }}>
          <D5Fade delay={150}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColour, margin: '0 0 20px' }}>
              Week complete
            </p>
          </D5Fade>
          <D5Fade delay={350}>
            <p style={{ fontSize: 28, color: textColor, fontWeight: 600, lineHeight: 1.3, margin: '0 0 32px' }}>
              You showed up this week.
            </p>
          </D5Fade>
          <D5Fade delay={700}>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 13, color: mutedColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>
                {daysLabel} of {journey.title.toLowerCase()}
              </p>
              {shownObs.map((obs, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${accentColour}`, paddingLeft: 16, marginBottom: 14 }}>
                  <p style={{ fontSize: 15, color: textColor, lineHeight: 1.6, margin: 0, fontStyle: obs.startsWith('"') ? 'italic' : 'normal' }}>{obs}</p>
                </div>
              ))}
            </div>
          </D5Fade>
          <D5Fade delay={1200}>
            <p style={{ fontSize: 16, color: mutedColor, lineHeight: 1.7, margin: '0 0 40px' }}>
              You don't lose this.<br />You take it with you.
            </p>
          </D5Fade>
          <D5Fade delay={1800} style={{ width: '100%' }}>
            <D5CTA onClick={advance} label={nextJourney ? "Ready for what's next? →" : "Back to home →"} accentColour={accentColour} mutedColor={mutedColor} dark={dark} />
            <D5CTA onClick={onDone} label="Not yet" secondary accentColour={accentColour} mutedColor={mutedColor} dark={dark} />
          </D5Fade>
        </div>
      );
    }

    if (step === 'next') {
      if (!nextJourney) { onDone(); return null; }
      // Generate emotional hook from next journey tagline — not just a title
      const hookPrefix = isYounger
        ? 'Next week, you\'ll explore'
        : 'Next week:';
      // Derive a hook from the tagline — take the core idea, make it feel like anticipation
      const taglineLower = (nextJourney.tagline || '').toLowerCase();
      const emotionalHook = isYounger
        ? nextJourney.title
        : taglineLower.startsWith('a week of ')
          ? taglineLower.replace(/^a week of /, 'what happens when you start ')
          : taglineLower.replace(/^a week /, '');
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 28px' }}>
          <D5Fade delay={100}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColour, margin: '0 0 20px' }}>Coming next week</p>
          </D5Fade>
          <D5Fade delay={300}>
            <p style={{ fontSize: 26, color: textColor, fontWeight: 600, lineHeight: 1.3, margin: '0 0 16px' }}>{nextJourney.title}</p>
          </D5Fade>
          <D5Fade delay={600}>
            <p style={{ fontSize: 16, color: mutedColor, lineHeight: 1.7, margin: '0 0 12px', fontStyle: 'italic' }}>
              {hookPrefix} {emotionalHook}.
            </p>
          </D5Fade>
          <D5Fade delay={900}>
            <p style={{ fontSize: 14, color: mutedColor, lineHeight: 1.6, margin: '0 0 48px' }}>
              It starts Monday.
            </p>
          </D5Fade>
          <D5Fade delay={1300} style={{ width: '100%' }}>
            <D5CTA onClick={onDone} label={isYounger ? 'I\'m ready →' : 'Continue →'} accentColour={accentColour} mutedColor={mutedColor} dark={dark} />
          </D5Fade>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {renderStep()}
    </div>
  );
}


// ── Journey Day View ──────────────────────────────────────────────────────
function JourneyDayView({ journey, dayNum, ageBand, onBack, onNextDay, nextJourney }: any) {
  const todayData = journey.days[dayNum - 1];
  if (!todayData) return null;

  const totalDays = journey.days.length;
  const isFinalDay = dayNum === totalDays;
  const [showCompletion, setShowCompletion] = useState(false);

  const mode = getJourneyAgeMode(ageBand);
  const accentColour = mode === '5-6' ? '#C8A04A'
    : mode === '7-10' ? '#3C6E5A'
    : mode === '11-13' ? '#534AB7'
    : '#2A1F4A';
  const dark = mode === '14-16' || mode === '11-13';
  const bg = dark ? '#1A1228' : '#F7F4FB';
  const cardBg = dark ? '#2A1F4A' : '#fff';
  const textColor = dark ? '#EDE8FC' : '#2A1F4A';
  const mutedColor = dark ? '#9A8EC8' : '#7A6A9A';

  if (showCompletion) return (
    <Day5Completion
      journey={journey}
      ageBand={ageBand}
      onBack={() => setShowCompletion(false)}
      onDone={onBack}
      nextJourney={nextJourney}
    />
  );

  return (
    <div style={{ flex: 1, background: bg, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ background: cardBg, padding: '16px 20px', borderBottom: `0.5px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
        <button onClick={onBack} style={{ color: accentColour, fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>← Back</button>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {journey.days.map((_: any, i: number) => (
            <div key={i} style={{
              width: i < dayNum ? 24 : 8, height: 8, borderRadius: 4,
              background: i < dayNum ? accentColour : dark ? 'rgba(255,255,255,0.15)' : '#EDE8F8',
              transition: 'width 0.3s ease',
            }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: mutedColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Day {dayNum} of {totalDays} · {journey.title}
        </div>
        <div style={{ fontSize: 20, color: textColor, fontWeight: 600, lineHeight: 1.3 }}>{todayData.focus}</div>
      </div>

      <div style={{ padding: '24px 20px 48px' }}>
        {/* Builds on */}
        {todayData.builds_on && (
          <div style={{ background: dark ? 'rgba(255,255,255,0.05)' : '#F7F4FB', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: mutedColor, fontStyle: 'italic', lineHeight: 1.6, borderLeft: `2px solid ${accentColour}55` }}>
            {todayData.builds_on}
          </div>
        )}

        {/* Entry */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColour, marginBottom: 8 }}>Today</div>
          <p style={{ fontSize: 17, color: textColor, lineHeight: 1.7, margin: 0, fontWeight: 400 }}>{todayData.entry}</p>
        </div>

        {/* Action */}
        <div style={{ background: cardBg, borderRadius: 16, padding: '18px 20px', marginBottom: 20, border: `1.5px solid ${accentColour}33` }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColour, marginBottom: 10 }}>Try this</div>
          <p style={{ fontSize: 16, color: textColor, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{todayData.action}</p>
        </div>

        {/* Insight */}
        <div style={{ borderLeft: `3px solid ${accentColour}`, paddingLeft: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 15, color: mutedColor, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{todayData.insight}"</p>
        </div>

        {/* Reflection */}
        {todayData.reflection && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: mutedColor, marginBottom: 8 }}>Reflect</div>
            <p style={{ fontSize: 15, color: textColor, lineHeight: 1.6, margin: 0 }}>{todayData.reflection}</p>
          </div>
        )}

        {/* Next day or final day CTA */}
        {!isFinalDay ? (
          <div style={{ background: dark ? 'rgba(255,255,255,0.05)' : '#F7F4FB', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: mutedColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tomorrow</div>
              <div style={{ fontSize: 14, color: textColor, fontWeight: 600, marginTop: 2 }}>{journey.days[dayNum]?.focus}</div>
            </div>
            <span style={{ color: mutedColor, fontSize: 18 }}>›</span>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16, padding: '14px 18px', background: dark ? 'rgba(255,255,255,0.04)' : accentColour + '12', borderRadius: 12, borderLeft: `3px solid ${accentColour}` }}>
              <p style={{ fontSize: 14, color: dark ? '#C4B8E8' : textColor, lineHeight: 1.7, margin: 0 }}>
                This week wasn't just about {journey.title.toLowerCase()}.<br />
                It was about noticing who you are in it.
              </p>
            </div>
            <button
              onClick={() => setShowCompletion(true)}
              style={{ width: '100%', background: accentColour, color: '#fff', border: 'none', borderRadius: 14, padding: '16px 20px', fontSize: 16, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
              Finish the week →
            </button>
          </>
        )}
      </div>
    </div>
  );
}


// ── This Week Block — primary home screen unit ───────────────────────────
function ThisWeekBlock({ ageBand, childName, colour, onOpenJourney, setTab }: any) {
  const [journey, setJourney] = useState<any>(null);
  const [dayNum, setDayNum] = useState(1);
  const [lastLesson, setLastLesson] = useState<any>(null);

  useEffect(() => {
    // Load journey
    fetch('/journeys.json')
      .then(r => r.json())
      .then((all: any[]) => {
        const mode = getJourneyAgeMode(ageBand);
        const filtered = all.filter((j: any) => j.age_mode === mode);
        if (!filtered.length) return;
        const week = getISOWeek(new Date());
        const j = filtered[week % filtered.length];
        const d = Math.min(getCurrentDayInJourney(), j.days.length);
        setJourney(j);
        setDayNum(d);
      })
      .catch(() => {});

    // Load last lesson
    try {
      const raw = localStorage.getItem('sonder_last_lesson');
      if (raw) setLastLesson(JSON.parse(raw));
    } catch(e) {}
  }, [ageBand]);

  // Determine week number for display (ISO week mod 52 + 1)
  const weekNum = (getISOWeek(new Date()) % 52) + 1;
  const todayData = journey?.days[dayNum - 1];
  const totalDays = journey?.days.length || 7;
  const accentColour = getJourneyAgeMode(ageBand) === '5-6' ? '#C8A04A'
    : getJourneyAgeMode(ageBand) === '7-10' ? '#3C6E5A'
    : getJourneyAgeMode(ageBand) === '11-13' ? '#534AB7'
    : '#1A1228';
  const isDark = getJourneyAgeMode(ageBand) === '14-16' || getJourneyAgeMode(ageBand) === '11-13';

  // Next journey preview — next week's journey
  const [nextJourney, setNextJourney] = useState<any>(null);
  useEffect(() => {
    fetch('/journeys.json')
      .then(r => r.json())
      .then((all: any[]) => {
        const mode = getJourneyAgeMode(ageBand);
        const filtered = all.filter((j: any) => j.age_mode === mode);
        if (filtered.length < 2) return;
        const week = getISOWeek(new Date());
        const nextIdx = (week + 1) % filtered.length;
        setNextJourney(filtered[nextIdx]);
      })
      .catch(() => {});
  }, [ageBand]);

  if (!journey || !todayData) {
    // Fallback: just show continue card if we have a last lesson
    if (lastLesson) {
      return (
        <button onClick={() => setTab(lastLesson.track === 'beneath' ? 'beneath' : 'wonder')}
          style={{ width: '100%', background: '#2A1F4A', borderRadius: 18, padding: '18px 20px', marginBottom: 16, border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#9A8EC8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Continue · {lastLesson.world}</div>
            <div style={{ fontSize: 16, color: '#EDE8FC', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastLesson.title}</div>
          </div>
          <span style={{ color: '#9A8EC8', fontSize: 22, flexShrink: 0 }}>›</span>
        </button>
      );
    }
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* ── Main journey block ── */}
      <div style={{
        background: isDark ? '#1A1228' : accentColour + '14',
        borderRadius: 20,
        overflow: 'hidden',
        border: `1.5px solid ${accentColour}30`,
        marginBottom: 10,
      }}>
        {/* Progress strip */}
        <div style={{ height: 3, background: isDark ? 'rgba(255,255,255,0.08)' : accentColour + '22' }}>
          <div style={{ height: 3, background: accentColour, width: `${(dayNum / totalDays) * 100}%`, transition: 'width 0.5s ease' }} />
        </div>

        <div style={{ padding: '18px 20px 20px' }}>
          {/* Week + day label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColour }}>
              Week {weekNum} · Day {dayNum} of {totalDays}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalDays }).map((_, i) => (
                <div key={i} style={{
                  width: i < dayNum ? 16 : 6, height: 6, borderRadius: 3,
                  background: i < dayNum ? accentColour : isDark ? 'rgba(255,255,255,0.12)' : accentColour + '30',
                  transition: 'width 0.3s ease',
                }} />
              ))}
            </div>
          </div>

          {/* Journey name */}
          <div style={{ fontSize: 22, color: isDark ? '#EDE8FC' : '#2A1F4A', fontWeight: 600, lineHeight: 1.25, marginBottom: 8 }}>
            {journey.title}
          </div>

          {/* Today's hook */}
          <div style={{ fontSize: 14, color: isDark ? '#C4B8E8' : '#7A6A9A', lineHeight: 1.6, marginBottom: 20 }}>
            {todayData.entry}
          </div>

          {/* CTA */}
          <button
            onClick={() => onOpenJourney(journey, dayNum, nextJourney)}
            style={{
              background: accentColour,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '13px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
            }}>
            {dayNum === 1 ? 'Begin today →' : dayNum === totalDays ? 'The last day →' : `Continue — Day ${dayNum} →`}
          </button>

          {/* Last lesson continue — subtle secondary */}
          {lastLesson && (
            <button
              onClick={() => setTab(lastLesson.track === 'beneath' ? 'beneath' : 'wonder')}
              style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: isDark ? '#9A8EC8' : accentColour, fontWeight: 600, padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>↩</span> Back to {lastLesson.title}
            </button>
          )}
        </div>
      </div>

      {/* ── Why this week matters ── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7A6A9A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Why this week</div>
        <div style={{ fontSize: 13, color: '#2A1F4A', lineHeight: 1.65 }}>{journey.tagline}</div>
      </div>

      {/* ── Progression signal ── */}
      {(() => {
        const completedCount = (() => {
          try {
            const h = localStorage.getItem('sonder_journey_history');
            return h ? JSON.parse(h).length : 0;
          } catch(e) { return 0; }
        })();
        if (completedCount === 0) return null;
        return (
          <div style={{ padding: '10px 4px', marginBottom: 4 }}>
            <p style={{ fontSize: 12, color: isDark ? '#9A8EC8' : '#7A6A9A', margin: 0, letterSpacing: '0.01em', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700, color: isDark ? '#C4B8E8' : '#534AB7' }}>{completedCount} {completedCount === 1 ? 'week' : 'weeks'} in.</span> You're building something that lasts.
            </p>
          </div>
        );
      })()}

      {/* ── Next week preview ── */}
      {nextJourney && dayNum >= Math.ceil(totalDays * 0.6) && (
        <div style={{ background: '#F7F4FB', borderRadius: 14, padding: '12px 16px', border: '0.5px solid rgba(83,74,183,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Coming next week</div>
            <div style={{ fontSize: 14, color: '#534AB7', fontWeight: 600 }}>{nextJourney.title}</div>
            <div style={{ fontSize: 12, color: '#7A6A9A', marginTop: 2, lineHeight: 1.5 }}>{nextJourney.tagline}</div>
          </div>
          <span style={{ color: '#C4B8E8', fontSize: 20 }}>›</span>
        </div>
      )}
    </div>
  );
}

function HomeTab({ user, childProfile, onSignOut, setTab, onEditProfile, token }: any) {
  const colour = childProfile?.avatar_colour || '#534AB7';
  const initials = childProfile?.name?.[0]?.toUpperCase() || '';
  const childName = childProfile?.name || null;
  const [activeJourney, setActiveJourney] = useState<any>(null);
  const [activeJourneyDay, setActiveJourneyDay] = useState(1);
  const [activeNextJourney, setActiveNextJourney] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showNewJourney, setShowNewJourney] = useState(false);
  const isWonderAge = childProfile?.age_band && WONDER_BANDS.includes(childProfile.age_band);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (showHistory) return (
    <JourneyHistoryView
      onBack={() => setShowHistory(false)}
      onNewJourney={() => { setShowHistory(false); setShowNewJourney(true); }}
      token={token}
    />
  );

  if (showNewJourney) return (
    <NewJourneyScreen
      onBack={() => setShowNewJourney(false)}
      onBegin={() => { setShowNewJourney(false); }}
      ageBand={childProfile?.age_band}
    />
  );

  if (activeJourney) {
    return (
      <JourneyDayView
        journey={activeJourney}
        dayNum={activeJourneyDay}
        ageBand={childProfile?.age_band}
        onBack={() => setActiveJourney(null)}
        onNextDay={() => setActiveJourneyDay(d => Math.min(d + 1, activeJourney.days.length))}
        nextJourney={activeNextJourney}
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>

      {/* ── Header ── */}
      <div style={{ padding: '28px 20px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#7A6A9A', fontSize: 13, margin: 0 }}>{greeting}</p>
          <h1 style={{ fontSize: 32, color: '#2A1F4A', fontWeight: 300, margin: '2px 0 0', lineHeight: 1.2 }}>{user?.name}</h1>
        </div>
        {childProfile?.id && (
          <button onClick={onEditProfile} style={{ width: 44, height: 44, borderRadius: 22, background: colour, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#fff', fontWeight: 700, flexShrink: 0, marginTop: 12, boxShadow: `0 2px 8px ${colour}44` }}>
            {initials}
          </button>
        )}
      </div>

      <div style={{ padding: '0 16px 32px' }}>

        {/* ── No profile prompt ── */}
        {!childProfile?.id && (
          <button onClick={onEditProfile} style={{ width: '100%', background: '#EDE8F8', borderRadius: 16, padding: 16, marginBottom: 16, border: '2px dashed rgba(83,74,183,0.3)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(83,74,183,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>+</div>
            <div>
              <div style={{ fontSize: 15, color: '#534AB7', fontWeight: 600 }}>Add your child's profile</div>
              <div style={{ fontSize: 12, color: '#7A6A9A', marginTop: 2 }}>Personalise the journey for their age</div>
            </div>
          </button>
        )}

        {/* ── THIS WEEK — primary block ── */}
        {childProfile?.id && (
          <ThisWeekBlock
            ageBand={childProfile?.age_band}
            childName={childName}
            colour={colour}
            onOpenJourney={(j: any, d: number, next: any) => { setActiveJourney(j); setActiveJourneyDay(d); setActiveNextJourney(next || null); }}
            setTab={setTab}
          />
        )}

        {/* ── Today's moment — secondary ── */}
        {childProfile?.id && (
          <DailyMomentCard ageBand={childProfile?.age_band} />
        )}

        {/* ── Explore section ── */}
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 11, color: '#7A6A9A', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>Explore</p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button onClick={() => setTab('wonder')} style={{ flex: 1, background: '#EDE8F8', borderRadius: 16, padding: '18px 16px', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 15, color: '#534AB7', fontWeight: 600, marginBottom: 2 }}>Wonder</div>
              <div style={{ fontSize: 11, color: '#7A6A9A', lineHeight: 1.4 }}>Ages 5–10 · with family</div>
            </button>
            <button onClick={() => setTab('beneath')} style={{ flex: 1, background: '#2A1F4A', borderRadius: 16, padding: '18px 16px', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>∿</div>
              <div style={{ fontSize: 15, color: '#EDE8FC', fontWeight: 600, marginBottom: 2 }}>Beneath</div>
              <div style={{ fontSize: 11, color: '#7A6A9A', lineHeight: 1.4 }}>Ages 11–16 · self-led</div>
            </button>
          </div>

          {/* Single entry point — replaces Book + Vision + History tiles */}
          <button onClick={() => setTab('journey')} style={{ width: '100%', background: '#fff', borderRadius: 16, padding: '16px 18px', border: '1.5px solid #EDE8F8', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: '#EDE8F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>↗</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#2A1F4A', fontWeight: 600 }}>How you're growing</div>
              <div style={{ fontSize: 12, color: '#7A6A9A', marginTop: 2 }}>
                {(() => {
                  const h = loadJourneyHistory();
                  return h.length > 0
                    ? `${h.length} ${h.length === 1 ? 'week' : 'weeks'} in — your words, your progress`
                    : 'Your weeks, your words, where you're heading';
                })()}
              </div>
            </div>
            <span style={{ color: '#aaa', fontSize: 16 }}>›</span>
          </button>
        </div>
        <button onClick={onSignOut} style={{ padding: '10px 18px', borderRadius: 12, background: '#FDECEA', color: '#C0392B', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Sign out</button>
      </div>
    </div>
  );
}


// ── Bottom Nav ────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab }: any) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'wonder', label: 'Wonder', icon: '✨' },
    { id: 'beneath', label: 'Beneath', icon: '∿' },
    { id: 'journey', label: 'Growing', icon: '↗' },
  ];
  const dark = tab === 'beneath';
  return (
    <div style={{ display: 'flex', borderTop: `0.5px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, background: dark ? '#1A1228' : '#fff', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 0 12px', border: 'none', background: 'none', cursor: 'pointer', color: tab === t.id ? '#534AB7' : '#7A6A9A', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>{t.label.toLowerCase()}</span>
        </button>
      ))}
    </div>
  );
}


// ── Vision Tab — Our vision & graduate attributes ─────────────────────────
function VisionTab({ onBack }: any) {
  const worlds = [
    { name: 'Emotions', colour: '#C8A04A', bg: '#faf6ec', attrs: [
      { title: 'You reach for the exact word', desc: 'Not "fine" or "bad" — disappointed, not sad. Nervous, not scared. The more specific the word, the clearer the need.' },
      { title: "You feel it without becoming it", desc: "Anger visits. It isn't who you are. You're the sky, not the storm — and you know the difference now." },
      { title: 'You find the gap before you react', desc: "There's a moment between the trigger and what you do next. You've learned to find it. Not always. But more than before." },
      { title: 'You got curious about your own patterns', desc: `When the same feeling keeps showing up, you ask "why does this happen?" instead of "what's wrong with me?"` },
    ]},
    { name: 'Mindfulness', colour: '#534AB7', bg: '#f2f1fb', attrs: [
      { title: 'You found your pause button', desc: "A breath, a moment — a way back to yourself when things get loud. You know where it is. You reach for it." },
      { title: 'You know what being present feels like', desc: "Not always there. But you notice when you're somewhere else. That noticing is the practice." },
      { title: 'You catch what's good — even on a hard day', desc: "Not forced gratitude. Real, specific things. You trained your attention to look — and it started to find them." },
    ]},
    { name: 'Growth', colour: '#3C6E5A', bg: '#eef4f1', attrs: [
      { title: "You know you're not fixed", desc: '"I can't do this yet" became a real thought, not a performance. You've seen yourself change.' },
      { title: 'You treat failure as data, not verdict', desc: "What did I find out? What would I do differently? You've practised being wrong without it meaning you're broken." },
      { title: "You stopped comparing yourself to other people", desc: "Better than yesterday's version of you. That's the only comparison worth making — and you have evidence it's possible." },
    ]},
    { name: 'Empathy', colour: '#7A6A9A', bg: '#f4f2f8', attrs: [
      { title: 'You listen to understand, not to reply', desc: "Not waiting for your turn. You ask what someone needs before offering what you think they should do." },
      { title: "You know how to repair things", desc: "Disagreements don't have to end things. You have words for a genuine apology — and you've seen repair build trust, not weaken it." },
      { title: "You're actually curious about people different from you", desc: "Not politely tolerant — genuinely curious. What is their life like? What do they know that you don't?" },
    ]},
    { name: 'Values', colour: '#2A1F4A', bg: '#eeedf4', attrs: [
      { title: 'You know what you stand for', desc: "Not a list someone gave you — a compass you've tested. You feel the difference when you act against it." },
      { title: 'You do the right thing when no one is watching', desc: 'More often than before. With less internal debate. "What do I actually believe?" has started to matter more than "what would someone think?"' },
      { title: 'You can hold two values that conflict', desc: "Honesty and kindness. Loyalty and fairness. You know moral life is complicated — and you don't need an easy answer to take the question seriously." },
    ]},
    { name: 'Purpose', colour: '#D85A30', bg: '#faf0eb', attrs: [
      { title: "You have a sense of what you're for", desc: 'Not a career — a direction. The things you love, keep returning to, and want to contribute. They point somewhere.' },
      { title: 'You follow what genuinely fascinates you', desc: `"I don't know — let's find out" became something you actually say. Curiosity stopped being a trait and started being a choice.` },
      { title: "You know you're writing your own story", desc: 'Every choice is a sentence. You're not the only author — but you're the central one. You take that seriously now.' },
    ]},
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F7F4FB' }}>
      <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>← Back</button>
        <h1 style={{ fontSize: 22, color: '#2A1F4A', fontWeight: 600, margin: 0 }}>Where this is leading</h1>
        <p style={{ fontSize: 13, color: '#7A6A9A', margin: '4px 0 0', lineHeight: 1.5 }}>Not a checklist. A direction.</p>
      </div>
      <div style={{ padding: '20px 20px 40px' }}>
        <p style={{ fontSize: 14, color: '#2A1F4A', lineHeight: 1.7, marginBottom: 28, padding: '16px 18px', background: '#fff', borderRadius: 14, borderLeft: '3px solid #534AB7' }}>
          These aren't goals to hit. They're directions to grow toward — slowly, over years of small moments. The most powerful thing you'll ever do is let your child watch you try.
        </p>
        {worlds.map((w, wi) => (
          <div key={wi} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: w.colour, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: w.colour }}>{w.name}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 18 }}>
              {w.attrs.map((a, ai) => (
                <div key={ai} style={{ background: w.bg, borderRadius: 12, padding: '12px 14px', borderLeft: `2.5px solid ${w.colour}` }}>
                  <div style={{ fontSize: 14, color: '#2A1F4A', fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: '#7A6A9A', lineHeight: 1.6 }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 8, padding: '16px 18px', background: '#2A1F4A', borderRadius: 14 }}>
          <p style={{ fontSize: 13, color: '#EDE8FC', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: '#fff', fontWeight: 600 }}>For parents.</strong> Your child is watching what you do when it's hard. When you choose honesty over comfort. When you stay present instead of reaching for your phone. When you admit you were wrong. That's the real lesson — and it's one only you can teach.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [worlds, setWorlds] = useState<any[]>([]);
  const [childProfile, setChildProfile] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [tab, setTab] = useState('home');
  const [editingProfile, setEditingProfile] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('sonder_token');
    const u = localStorage.getItem('sonder_user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/lessons/worlds', token).then(d => setWorlds(d.worlds || []));
    apiFetch('/api/profiles', token).then(d => {
      const profiles = d.profiles || [];
      setChildProfile(profiles[0] || null);
      setProfileLoaded(true);
    });
  }, [token]);

  if (!ready) return null;
  if (!token) return <AuthScreen onAuth={(t, u) => { setToken(t); setUser(u); }} />;

  if (profileLoaded && childProfile === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}>
        <ProfileSetupScreen token={token} onDone={p => { setChildProfile(p); setTab('home'); }} onSkip={() => { setChildProfile({ skipped: true }); setTab('home'); }} />
      </div>
    );
  }

  if (editingProfile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <button onClick={() => setEditingProfile(false)} style={{ color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
        </div>
        <ProfileSetupScreen token={token} existingProfile={childProfile?.id ? childProfile : undefined} onDone={p => { setChildProfile(p); setEditingProfile(false); }} onDelete={() => { setChildProfile(null); setProfileLoaded(false); setEditingProfile(false); apiFetch('/api/profiles', token).then(d => { const profiles = d.profiles || []; setChildProfile(profiles[0] || null); setProfileLoaded(true); }); }} />
      </div>
    );
  }

  const signOut = () => { localStorage.removeItem('sonder_token'); localStorage.removeItem('sonder_user'); setToken(''); setUser(null); setChildProfile(null); setProfileLoaded(false); setTab('home'); };
  const childName = childProfile?.id ? childProfile.name : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 480, margin: '0 auto', background: tab === 'beneath' ? '#1A1228' : '#F7F4FB', overflow: 'hidden' }}>
      {tab === 'home' && <HomeTab user={user} childProfile={childProfile?.id ? childProfile : null} onSignOut={signOut} setTab={setTab} onEditProfile={() => setEditingProfile(true)} token={token} />}
      {tab === 'wonder' && <WonderTab worlds={worlds} token={token} childProfile={childProfile} />}
      {tab === 'beneath' && <BeneathTab worlds={worlds} token={token} childProfile={childProfile} />}
      {tab === 'book' && <BookTab token={token} childName={childName} setTab={setTab} />}
      {tab === 'journey' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <JourneyHistoryView
            onBack={() => setTab('home')}
            onNewJourney={() => setTab('home')}
            token={token}
          />
        </div>
      )}
      {tab === 'vision' && <VisionTab onBack={() => setTab('home')} />}
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
