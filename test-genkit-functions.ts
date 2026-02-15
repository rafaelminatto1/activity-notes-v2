/**
 * Test Script para GenKit Functions
 * Teste local das funções GenKit usando Firebase Emulators
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Firebase Config
const firebaseConfig = {
  apiKey: 'AIzaSyDummyKey',
  authDomain: 'fisioflow-migration.firebaseapp.com',
  projectId: 'fisioflow-migration',
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Connect to emulators
const [host, port] = '127.0.0.1:5001'.split(':');
connectFunctionsEmulator(functions, host, parseInt(port, 10));

// Test data
const testUserId = 'test-user-123';
const testText = 'Preciso preparar uma reunião com a equipe para discutir o novo projeto';

console.log('='.repeat(60));
console.log('  GENKIT FUNCTIONS TEST');
console.log('='.repeat(60));

// ============================================================
// Test Functions
// ============================================================

async function testFunction<T>(
  name: string,
  data: any
): Promise<void> {
  try {
    console.log(`\n[TEST] ${name}...`);
    const fn = httpsCallable(functions, name);
    const result = await fn(data);

    if (result.data) {
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`   Response:`, JSON.stringify(result.data, null, 2));
    } else {
      console.log(`⚠️  ${name} - NO RESPONSE DATA`);
    }
  } catch (error: any) {
    console.log(`❌ ${name} - ERROR`);
    console.error(error);
  }
}

// Run all tests
async function runTests() {
  console.log('\nStarting tests...\n');

  // Test 1: Generate Tags
  await testFunction('genkitGenerateTags', {
    text: testText,
    documentId: 'test-doc-1',
  });

  // Test 2: Extract Tasks
  await testFunction('genkitExtractTasks', {
    text: 'Preciso comprar suprimentos, organizar o backlog e preparar a apresentação',
  });

  // Test 3: Generate Summary
  await testFunction('genkitGenerateSummary', {
    text: 'Hoje tivemos uma reunião produtiva sobre o roadmap do Q1. A equipe definiu os objetivos principais e discutiu os prazos.',
  });

  // Test 4: Analyze Sentiment
  await testFunction('genkitAnalyzeSentiment', {
    text: 'Estou muito feliz com o progresso do projeto! A equipe está incrível!',
  });

  // Test 5: Suggest Improvements
  await testFunction('genkitSuggestImprovements', {
    text: 'Este texto precisa de mais detalhes e estrutura.',
  });

  // Test 6: RAG Query
  await testFunction('genkitRagQuery', {
    question: 'Como configurar o Firebase GenKit?',
    userId: testUserId,
    maxResults: 5,
  });

  console.log('\n' + '='.repeat(60));
  console.log('  TESTS COMPLETED');
  console.log('='.repeat(60));
}

// Execute tests
runTests().catch(console.error);
