/**
 * FarmIQ AI provider smoke test — verifies the TokenHarbor gateway end-to-end
 * through FarmIQ's own adapter (the same OpenAI-compatible API opencode uses),
 * with no curl. Loads .env.local automatically.
 *
 * Run: npm run test:provider
 * Makes real network calls; never part of `npm test`.
 */

import * as fs from 'fs';
import * as path from 'path';

// sucrase-node does not load .env files; parse .env.local into process.env.
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

function mask(value: string | undefined): string {
  if (!value) return '(not set)';
  return `${value.slice(0, 10)}...${value.slice(-4)} (length ${value.length})`;
}

async function main(): Promise<void> {
  const { describeProviderStatus, classifyIntentLabel, generateAnswer } = await import(
    '../lib/integrations/ai'
  );

  const status = describeProviderStatus();
  console.log('--- Provider status ---');
  console.log('base URL:        ', process.env.AI_BASE_URL || 'https://tokenharbor.ai/v1 (default)');
  console.log('API key:         ', mask(process.env.AI_API_KEY));
  console.log('generation model:', status.generationModel);
  console.log('intent model:    ', status.intentModel);
  console.log('configured:      ', status.generationConfigured);

  if (!status.generationConfigured) {
    throw new Error('AI_API_KEY is not set — provider cannot be tested.');
  }

  console.log('\n--- Test 1: intent classification ---');
  const label = await classifyIntentLabel('Will it rain this week in Ludhiana?', []);
  console.log('raw label:', JSON.stringify(label));
  if (label !== 'weather_query') {
    throw new Error(`Expected weather_query, got ${JSON.stringify(label)}`);
  }
  console.log('✔ classification OK');

  console.log('\n--- Test 2: generation ---');
  const started = Date.now();
  const result = await generateAnswer(
    'You are FarmIQ Assistant. Answer ONLY from the <context> block. Cite the source label.\n' +
      '<context>\n[CHUNK 1 — source: kb_agronomy (Agronomy Guides)]\n' +
      'Optimal soil pH for high-yield wheat ranges between 6.0 and 7.5, targeting 6.2 to 6.8.\n</context>',
    [],
    'What soil pH does wheat need?'
  );
  const elapsed = Date.now() - started;
  if (!result) {
    throw new Error('generateAnswer returned null');
  }
  console.log(`model:  ${result.modelUsed} (${elapsed} ms)`);
  console.log(`answer: ${result.text.slice(0, 400)}`);
  if (result.text.trim().length === 0) {
    throw new Error('Empty generation result');
  }
  console.log('✔ generation OK');

  console.log('\nAll provider smoke tests passed.');
}

main().catch((error) => {
  console.error('\n✗ Provider smoke test failed:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
