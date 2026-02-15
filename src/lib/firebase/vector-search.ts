/**
 * Firestore Vector Search Service
 * Serviço para busca semântica usando embeddings
 */

import { db } from './config';
import { getAIClient } from '../firebase/ai-logic';
import { collection, query as firestoreQuery, where, getDocs, limit, doc, getDoc, updateDoc } from 'firebase/firestore';

export interface VectorSearchResult {
  documentId: string;
  title: string;
  content: string;
  similarity: number;
  metadata?: {
    tags?: string[];
    category?: string;
    priority?: string;
    sentiment?: string;
  };
}

export interface VectorSearchOptions {
  userId: string;
  query: string;
  limit?: number;
  minSimilarity?: number;
  filter?: {
    tags?: string[];
    category?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

/**
 * Calcula similaridade de cosseno entre dois vetores
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Gera embedding para uma query
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const aiClient = getAIClient();
  return await aiClient.generateEmbedding(query);
}

/**
 * Busca documentos similares usando busca vetorial
 */
export async function vectorSearch(
  options: VectorSearchOptions
): Promise<VectorSearchResult[]> {
  const { userId, query, limit = 10, minSimilarity = 0.7, filter } = options;

  try {
    // 1. Gerar embedding da query
    const queryEmbedding = await generateQueryEmbedding(query);

    // 2. Buscar documentos com embeddings do usuário
    if (!db) {
      throw new Error('Firestore não está inicializado');
    }

    const q = firestoreQuery(
      collection(db, 'documents'),
      where('userId', '==', userId),
      where('vectorEmbedding', '!=', null)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    // 3. Calcular similaridade com cada documento
    const results: VectorSearchResult[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const docEmbedding = data.vectorEmbedding as number[];

      if (!docEmbedding || !Array.isArray(docEmbedding)) {
        continue;
      }

      // Aplicar filtros
      if (filter) {
        if (filter.tags && filter.tags.length > 0) {
          const docTags = data.tags || [];
          if (!filter.tags.some(tag => docTags.includes(tag))) {
            continue;
          }
        }
        if (filter.category && data.category !== filter.category) {
          continue;
        }
        if (filter.dateRange) {
          const createdAt = data.createdAt?.toDate();
          if (!createdAt) continue;
          if (
            createdAt < filter.dateRange.start ||
            createdAt > filter.dateRange.end
          ) {
            continue;
          }
        }
      }

      // Calcular similaridade
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);

      // Filtrar por similaridade mínima
      if (similarity >= minSimilarity) {
        results.push({
          documentId: doc.id,
          title: data.title || 'Sem título',
          content: data.plainText || data.content || '',
          similarity,
          metadata: {
            tags: data.tags,
            category: data.category,
            priority: data.priority,
            sentiment: data.sentiment,
          },
        });
      }
    }

    // 4. Ordenar por similaridade e limitar resultados
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  } catch (error) {
    console.error('[VectorSearch] Error:', error);
    throw error;
  }
}

/**
 * Busca híbrida: combina busca vetorial com busca de texto
 */
export async function hybridSearch(
  options: VectorSearchOptions & { textQuery?: string }
): Promise<{
  vectorResults: VectorSearchResult[];
  textResults: VectorSearchResult[];
  combined: VectorSearchResult[];
}> {
  const { textQuery, ...vectorOptions } = options;

  // Busca vetorial
  const vectorResults = await vectorSearch(vectorOptions);

  // Se houver query de texto, faz busca adicional
  let textResults: VectorSearchResult[] = [];

  if (textQuery && db) {
    const q = firestoreQuery(
      collection(db, 'documents'),
      where('userId', '==', vectorOptions.userId),
      where('plainText', '>=', textQuery.toLowerCase())
    );
    const snapshot = await getDocs(q);

    textResults = snapshot.docs.map(doc => ({
      documentId: doc.id,
      title: doc.data().title || 'Sem título',
      content: doc.data().plainText || '',
      similarity: 0, // Text search não tem similaridade
    }));
  }

  // Combinar e remover duplicatas
  const combinedMap = new Map<string, VectorSearchResult>();

  vectorResults.forEach(result => {
    combinedMap.set(result.documentId, result);
  });

  textResults.forEach(result => {
    if (!combinedMap.has(result.documentId)) {
      combinedMap.set(result.documentId, {
        ...result,
        similarity: 0.3, // Similaridade padrão para resultados de texto
      });
    }
  });

  const combined = Array.from(combinedMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, vectorOptions.limit || 10);

  return {
    vectorResults,
    textResults,
    combined,
  };
}

/**
 * Busca contextual: busca em documentos relacionados a um documento específico
 */
export async function contextualSearch(
  userId: string,
  documentId: string,
  searchQuery: string,
  limit = 5
): Promise<VectorSearchResult[]> {
  try {
    // 1. Obter o documento de contexto
    if (!db) {
      throw new Error('Firestore não está inicializado');
    }
    const contextDoc = await getDoc(doc(db, 'documents', documentId));
    if (!contextDoc.exists) {
      return [];
    }

    const contextData = contextDoc.data();

    // 2. Buscar documentos do mesmo workspace ou categoria
    const whereClauses: any[] = [
      where('userId', '==', userId),
      where('vectorEmbedding', '!=', null),
    ];

    if (contextData?.workspaceId) {
      whereClauses.push(where('workspaceId', '==', contextData.workspaceId));
    } else if (contextData?.category) {
      whereClauses.push(where('category', '==', contextData.category));
    }

    const q = firestoreQuery(collection(db, 'documents'), ...whereClauses);
    const snapshot = await getDocs(q);

    // 3. Gerar embedding da query
    const title = contextData?.title || '';
    const queryEmbedding = await generateQueryEmbedding(
      `${title} ${searchQuery}`
    );

    // 4. Calcular similaridade
    const results: VectorSearchResult[] = [];

    for (const doc of snapshot.docs) {
      // Excluir o documento de contexto
      if (doc.id === documentId) continue;

      const data = doc.data();
      const docEmbedding = data.vectorEmbedding as number[];

      if (!docEmbedding || !Array.isArray(docEmbedding)) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);

      if (similarity >= 0.6) {
        results.push({
          documentId: doc.id,
          title: data.title || 'Sem título',
          content: data.plainText || data.content || '',
          similarity,
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  } catch (error) {
    console.error('[ContextualSearch] Error:', error);
    throw error;
  }
}

/**
 * Busca por tópicos: encontra documentos relacionados por tópicos
 */
export async function topicSearch(
  userId: string,
  topic: string,
  limit = 10
): Promise<VectorSearchResult[]> {
  try {
    // 1. Buscar documentos com tags que contenham o tópico
    if (!db) {
      throw new Error('Firestore não está inicializado');
    }
    const q = firestoreQuery(
      collection(db, 'documents'),
      where('userId', '==', userId),
      where('tags', 'array-contains', topic.toLowerCase()),
      where('vectorEmbedding', '!=', null)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    // 2. Gerar embedding da query
    const queryEmbedding = await generateQueryEmbedding(topic);

    // 3. Calcular similaridade
    const results: VectorSearchResult[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const docEmbedding = data.vectorEmbedding as number[];

      if (!docEmbedding || !Array.isArray(docEmbedding)) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);

      if (similarity >= 0.5) {
        results.push({
          documentId: doc.id,
          title: data.title || 'Sem título',
          content: data.plainText || data.content || '',
          similarity,
          metadata: {
            tags: data.tags,
            category: data.category,
          },
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  } catch (error) {
    console.error('[TopicSearch] Error:', error);
    throw error;
  }
}

/**
 * Atualiza o embedding de um documento
 */
export async function updateDocumentEmbedding(
  documentId: string,
  text: string
): Promise<void> {
  try {
    // Gerar embedding
    const embedding = await generateQueryEmbedding(text);

    // Atualizar documento
    if (!db) {
      throw new Error('Firestore não está inicializado');
    }
    await updateDoc(doc(db, 'documents', documentId), {
      vectorEmbedding: embedding,
      embeddingUpdatedAt: new Date(),
    });

    console.log(`[VectorSearch] Updated embedding for document: ${documentId}`);
  } catch (error) {
    console.error('[VectorSearch] Failed to update embedding:', error);
    throw error;
  }
}

/**
 * Recalcula embeddings em lote
 */
export async function batchUpdateEmbeddings(
  documents: Array<{ id: string; text: string }>
): Promise<void> {
  const batchSize = 5; // Processar 5 por vez para evitar limites de rate
  const batches = [];

  for (let i = 0; i < documents.length; i += batchSize) {
    batches.push(documents.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const updatePromises = batch.map(doc =>
      updateDocumentEmbedding(doc.id, doc.text)
    );
    await Promise.all(updatePromises);

    // Pequeno delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[VectorSearch] Updated embeddings for ${documents.length} documents`);
}

export default {
  vectorSearch,
  hybridSearch,
  contextualSearch,
  topicSearch,
  updateDocumentEmbedding,
  batchUpdateEmbeddings,
};
