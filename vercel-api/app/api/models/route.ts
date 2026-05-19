import { availableModels } from '../../../lib/models';

export const runtime = 'edge';

const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(): Promise<Response> {
  const models = availableModels();
  return new Response(
    JSON.stringify({ models, default: models[0]?.id ?? null }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } },
  );
}
