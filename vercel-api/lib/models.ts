import { createGateway } from '@ai-sdk/gateway';
import type { LanguageModel } from 'ai';

const gatewayProvider = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

interface ModelEntry {
  id: ModelPreference;
  label: string;
  requiredEnv: string;
  factory: () => LanguageModel;
  speedMs: number;
  costPer1kTokens: number;
}

const REGISTRY: ModelEntry[] = [
  {
    id: 'gateway-claude-haiku',
    label: 'Claude 3.5 Haiku via Gateway (fastest)',
    requiredEnv: 'AI_GATEWAY_API_KEY',
    factory: () => gatewayProvider('anthropic/claude-3-5-haiku-20241022'),
    speedMs: 700,
    costPer1kTokens: 0.0008,
  },
  {
    id: 'gateway-claude-sonnet',
    label: 'Claude 3.5 Sonnet via Gateway',
    requiredEnv: 'AI_GATEWAY_API_KEY',
    factory: () => gatewayProvider('anthropic/claude-3-5-sonnet-20241022'),
    speedMs: 1500,
    costPer1kTokens: 0.015,
  },
  {
    id: 'gateway-gemini',
    label: 'Gemini 2.0 Flash via Gateway',
    requiredEnv: 'AI_GATEWAY_API_KEY',
    factory: () => gatewayProvider('google/gemini-2.0-flash'),
    speedMs: 800,
    costPer1kTokens: 0.0,
  },
];

export type ModelPreference =
  | 'gateway-claude-haiku'
  | 'gateway-claude-sonnet'
  | 'gateway-gemini'
  | 'auto';

export interface SelectedModel {
  model: LanguageModel;
  id: string;
  label: string;
}

export function selectModel(preference: ModelPreference = 'auto'): SelectedModel {
  if (preference !== 'auto') {
    const entry = REGISTRY.find(m => m.id === preference);
    if (entry && process.env[entry.requiredEnv]) {
      return { model: entry.factory(), id: entry.id, label: entry.label };
    }
    console.warn(`[models] ${preference} unavailable, falling back to auto`);
  }

  for (const entry of REGISTRY) {
    if (process.env[entry.requiredEnv]) {
      return { model: entry.factory(), id: entry.id, label: entry.label };
    }
  }

  throw new Error('No AI provider configured. Set AI_GATEWAY_API_KEY in .env.local');
}

export function availableModels(): Array<{ id: string; label: string; speedMs: number }> {
  return REGISTRY
    .filter(m => !!process.env[m.requiredEnv])
    .map(({ id, label, speedMs }) => ({ id, label, speedMs }));
}
