// Proxy to backend for token generation
export async function POST(request: Request) {
  try {
    const response = await fetch('http://localhost:3002/api/agent/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: msg },
      { status: 500 }
    );
  }
}
