'use client';
import { useState, useEffect } from 'react';

const COLOURS: Record<string, string> = {
  emotions: '#C8A04A', mindfulness: '#534AB7', growth: '#3C6E5A',
  values: '#2A1F4A', empathy: '#7A6A9A', purpose: '#D85A30',
};

const WONDER_BANDS = ['5-6', '7-8', '9-10'];
const BENEATH_BANDS = ['11-13', '14-16'];

function apiFetch(path: string, token: string, opts?: RequestInit) {
  return fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers },
  }).then(r => r.json());
}

const label: React.CSSProperties = { display: 'block', fontSize: 12, color: '#2A1F4A', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 };
const input: React.CSSProperties = { width: '100%', padding: 16, borderRadius: 12, border: '0.5px solid rgba(83,74,183,0.2)', background: '#fff', fontSize: 16, color: '#2A1F4A', outline: 'none', display: 'block' };
const btn: React.CSSProperties = { width: '100%', padding: 16, borderRadius: 14, background: '#534AB7', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer' };

function AuthScreen({ onAuth }: { onAuth: (token: string, user: any) => void }) {
  const [mode, setMode] = useState('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password || (mode === 'register' && !name)) { setError('Please fill in all fields'); return; }
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
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4FB', padding: '60px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 40, color: '#2A1F4A', fontWeight: 300, lineHeight: 1.2, marginBottom: 8 }}>
        {mode === 'register' ? 'Create your family account' : 'Welcome back'}
      </h1>
      <p style={{ color: '#7A6A9A', marginBottom: 32, fontSize: 15 }}>
        {mode === 'register' ? 'One account for the whole family.' : 'Sign in to continue your journey.'}
      </p>
      {mode === 'register' && (
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Your name</label>
          <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah" />
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Email</label>
        <input style={input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={label}>Password</label>
        <input style={input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
      </div>
      {error && <p style={{ color: '#C0392B', marginBottom: 16, fontSize: 14 }}>{error}</p>}
      <button onClick={submit} disabled={loading} style={btn}>{loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
      <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}
        style={{ marginTop: 20, width: '100%', padding: 16, color: '#534AB7', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
        {mode === 'register' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
      </button>
    </div>
  );
}

function HomeScreen({ user, worlds, onWorld, onSignOut }: any) {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F4FB', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '60px 24px 24px' }}>
        <p style={{ color: '#7A6A9A', fontSize: 15 }}>Good morning,</p>
        <h1 style={{ fontSize: 36, color: '#2A1F4A', fontWeight: 300, marginBottom: 32 }}>{user?.name}</h1>
        <p style={{ fontSize: 11, color: '#7A6A9A', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 16 }}>Your worlds</p>
        {worlds.map((w: any) => (
          <button key={w.slug} onClick={() => onWorld(w)}
            style={{ width: '100%', background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
              borderLeft: `4px solid ${COLOURS[w.slug] || '#534AB7'}`, textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', border: 'none',
              outline: `4px solid ${COLOURS[w.slug] || '#534AB7'}`, outlineOffset: -4 }}>
            <div style={{ fontSize: 16, color: '#2A1F4A', fontWeight: 500, marginBottom: 4 }}>{w.name}</div>
            <div style={{ fontSize: 13, color: '#7A6A9A' }}>{w.core_question}</div>
          </button>
        ))}
      </div>
      <div style={{ padding: '0 24px 40px' }}>
        <button onClick={onSignOut} style={{ padding: '12px 24px', borderRadius: 12, background: '#FDECEA', color: '#C0392B', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function LessonList({ world, token, onLesson, onBack }: any) {
  const [ageBand, setAgeBand] = useState('5-6');
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colour = COLOURS[world.slug] || '#534AB7';
  const isBeneath = ageBand === '11-13' || ageBand === '14-16';
  const bg = isBeneath ? '#1A1228' : '#F7F4FB';
  const cardBg = isBeneath ? '#2A1F4A' : '#fff';
  const textColor = isBeneath ? '#EDE8FC' : '#2A1F4A';

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/lessons?world=${world.slug}&age_band=${ageBand}`, token)
      .then(d => { setLessons(d.lessons || []); setLoading(false); });
  }, [world.slug, ageBand, token]);

  return (
    <div style={{ minHeight: '100vh', background: bg, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '20px 20px 16px', background: cardBg, borderLeft: `4px solid ${colour}`, borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        <button onClick={onBack} style={{ color: '#534AB7', fontSize: 15, fontWeight: 600, marginBottom: 12, background: 'none', border: 'none', cursor: 'pointer' }}>Back to worlds</button>
        <div style={{ fontSize: 22, color: textColor, fontWeight: 600, marginBottom: 4 }}>{world.name}</div>
        <div style={{ fontSize: 13, color: '#7A6A9A' }}>{world.core_question}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: cardBg, borderBottom: '0.5px solid rgba(0,0,0,0.08)', overflowX: 'auto' }}>
        {['5-6', '7-8', '9-10', '11-13', '14-16'].map(b => (
          <button key={b} onClick={() => setAgeBand(b)}
            style={{ whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: ageBand === b ? colour : '#EDE8F8', color: ageBand === b ? '#fff' : '#534AB7', border: 'none', cursor: 'pointer' }}>
            {b}
          </button>
        ))}
      </div>
      <div style={{ padding: 16 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#7A6A9A' }}>Loading...</div>
          : lessons.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#7A6A9A' }}>No lessons for ages {ageBand} yet.</div>
          : lessons.map((l: any) => (
            <button key={l.id} onClick={() => onLesson(l)}
              style={{ width: '100%', background: cardBg, borderRadius: 14, padding: 16, marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: colour + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: colour }}>{l.lesson_number}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, color: textColor, fontWeight: 500, marginBottom: 2 }}>{l.title}</div>
                <div style={{ fontSize: 12, color: '#7A6A9A' }}>{l.duration_mins} min</div>
              </div>
              <span style={{ color: '#7A6A9A', fontSize: 20 }}>›</span>
            </button>
          ))
        }
      </div>
    </div>
  );
}

function LessonDetail({ lesson, token, onBack }: any) {
  const [tab, setTab] = useState('Story');
  const [full, setFull] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/lessons/${lesson.id}`, token).then(d => { setFull(d.lesson); setLoading(false); });
  }, [lesson.id, token]);

  const l = full || lesson;
  const isBeneath = l.track === 'beneath';
  const bg = isBeneath ? '#1A1228' : '#F7F4FB';
  const cardBg = isBeneath ? '#2A1F4A' : '#fff';
  const textColor = isBeneath ? '#EDE8FC' : '#2A1F4A';

  return (
    <div style={{ minHeight: '100vh', background: bg, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '20px 20px 16px', background: cardBg, borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        <button onClick={onBack} style={{ color: '#534AB7', fontSize: 15, fontWeight: 600, marginBottom: 12, background: 'none', border: 'none', cursor: 'pointer' }}>Back</button>
        <div style={{ fontSize: 22, color: textColor, fontWeight: 600, marginBottom: 4 }}>{l.title}</div>
        <div style={{ fontSize: 12, color: '#7A6A9A', marginBottom: 8 }}>{l.age_band} · {l.duration_mins} min</div>
        {l.description && <div style={{ fontSize: 14, color: '#7A6A9A', lineHeight: 1.5 }}>{l.description}</div>}
      </div>
      <div style={{ display: 'flex', background: cardBg, borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        {['Story', 'Explore', 'Activities', 'Journal'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: 'none', color: tab === t ? '#534AB7' : '#7A6A9A',
              borderBottom: `2px solid ${tab === t ? '#534AB7' : 'transparent'}` }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: 20, paddingBottom: 60 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#7A6A9A' }}>Loading...</div> : (
          <>
            {tab === 'Story' && (l.story
              ? <>
                  <h2 style={{ fontSize: 22, color: textColor, fontWeight: 600, marginBottom: 16, lineHeight: 1.3 }}>{l.story.title}</h2>
                  <p style={{ fontSize: 16, color: textColor, lineHeight: 1.8, marginBottom: 24, whiteSpace: 'pre-wrap' }}>{l.story.body}</p>
                  {l.story.discussion_prompt && (
                    <div style={{ background: '#EDE8F8', borderRadius: 14, padding: 16 }}>
                      <div style={{ fontSize: 11, color: '#534AB7', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Talk together</div>
                      <p style={{ fontSize: 15, color: '#2A1F4A', lineHeight: 1.6, fontStyle: 'italic' }}>{l.story.discussion_prompt}</p>
                    </div>
                  )}
                </>
              : <p style={{ color: '#7A6A9A', textAlign: 'center', padding: 40 }}>No story yet.</p>
            )}
            {tab === 'Explore' && ((l.explore || []).length > 0
              ? (l.explore || []).map((item: any, i: number) => (
                  <div key={i} style={{ background: cardBg, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 16, color: textColor, fontWeight: 600, marginBottom: 10 }}>{item.question}</div>
                    <div style={{ fontSize: 15, color: textColor, lineHeight: 1.6 }}>{item.answer}</div>
                  </div>
                ))
              : <p style={{ color: '#7A6A9A', textAlign: 'center', padding: 40 }}>No explore content yet.</p>
            )}
            {tab === 'Activities' && ((l.activities || []).length > 0
              ? (l.activities || []).map((a: any, i: number) => (
                  <div key={i} style={{ background: cardBg, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'inline-block', background: '#EDE8F8', borderRadius: 999, padding: '3px 10px', fontSize: 11, color: '#534AB7', fontWeight: 700, marginBottom: 8 }}>{a.type}</div>
                    <div style={{ fontSize: 16, color: textColor, fontWeight: 600, marginBottom: 8 }}>{a.name}</div>
                    <div style={{ fontSize: 14, color: textColor, lineHeight: 1.6 }}>{a.description}</div>
                  </div>
                ))
              : <p style={{ color: '#7A6A9A', textAlign: 'center', padding: 40 }}>No activities yet.</p>
            )}
            {tab === 'Journal' && (
              <>
                {l.parent_guide && <div style={{ background: '#FBF0D8', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#C8A04A', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Parent guide</div>
                  <div style={{ fontSize: 14, color: '#2A1F4A', lineHeight: 1.6 }}>{l.parent_guide}</div>
                </div>}
                {(l.journal || []).length > 0
                  ? (l.journal || []).map((j: any, i: number) => (
                      <div key={i} style={{ background: j.is_parent_prompt ? '#F0F7FF' : cardBg, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                        {j.is_parent_prompt && <div style={{ fontSize: 11, color: '#534AB7', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>For you</div>}
                        <div style={{ fontSize: 15, color: textColor, lineHeight: 1.6, fontStyle: 'italic' }}>{j.prompt}</div>
                        {j.note && <div style={{ fontSize: 13, color: '#7A6A9A', marginTop: 8 }}>{j.note}</div>}
                      </div>
                    ))
                  : <p style={{ color: '#7A6A9A', textAlign: 'center', padding: 40 }}>No journal prompts yet.</p>
                }
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [worlds, setWorlds] = useState<any[]>([]);
  const [world, setWorld] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
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
  }, [token]);

  if (!ready) return null;
  if (!token) return <AuthScreen onAuth={(t, u) => { setToken(t); setUser(u); }} />;
  if (lesson) return <LessonDetail lesson={lesson} token={token} onBack={() => setLesson(null)} />;
  if (world) return <LessonList world={world} token={token} onLesson={setLesson} onBack={() => setWorld(null)} />;

  return (
    <HomeScreen user={user} worlds={worlds}
      onWorld={setWorld}
      onSignOut={() => { localStorage.removeItem('sonder_token'); localStorage.removeItem('sonder_user'); setToken(''); setUser(null); setWorld(null); setLesson(null); }}
    />
  );
}
