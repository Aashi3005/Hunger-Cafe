export default function Home() {
  return (
    <main style={{ fontFamily: 'monospace', padding: '2rem' }}>
      <h1>HungerQuest API</h1>
      <p>POST /api/recipe — streaming recipe generation</p>
      <p>GET  /api/health — health check</p>
    </main>
  );
}
