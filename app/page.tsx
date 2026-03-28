export default function Home() {
  return (
    <main style={{ fontFamily: 'Georgia, serif', padding: '4rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#2A1F4A', letterSpacing: '-1px', fontStyle: 'italic', marginBottom: '0.5rem' }}>Sonder</h1>
      <p style={{ color: '#7A6A9A', fontSize: '1rem' }}>API is running. <a href="/api/health" style={{ color: '#534AB7' }}>Health check →</a></p>
    </main>
  );
}
