import { Client } from '@elastic/elasticsearch';
import { config } from './index';

export const esClient = new Client({
  node: config.elasticsearchUrl,
});

export async function closeElasticsearchClient(): Promise<void> {
  try {
    await esClient.close();
    console.log('[Elasticsearch] Client connection closed.');
  } catch (err) {
    console.error('[Elasticsearch] Error closing client:', err);
  }
}
