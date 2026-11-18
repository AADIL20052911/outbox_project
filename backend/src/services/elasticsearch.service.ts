import { esClient } from '../config/elasticsearch';

export const EMAIL_INDEX_NAME = 'emails';

export interface EmailDocument {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt?: string | null;
  userId: string;
  senderId: string;
}

export async function ensureEmailsIndexExists(): Promise<void> {
  try {
    const exists = await esClient.indices.exists({ index: EMAIL_INDEX_NAME });
    if (!exists) {
      await esClient.indices.create({
        index: EMAIL_INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            recipient: { type: 'text' },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            userId: { type: 'keyword' },
            senderId: { type: 'keyword' },
          },
        },
      });
      console.log(`[Elasticsearch] Index '${EMAIL_INDEX_NAME}' created.`);
    }
  } catch (err: any) {
  console.warn(
    '[Elasticsearch] Index check/creation warning:',
    JSON.stringify(
      {
        message: err?.message,
        statusCode: err?.meta?.statusCode,
        body: err?.meta?.body,
        name: err?.name,
      },
      null,
      2
    )
  );
}
}

export async function indexEmailDocument(doc: EmailDocument): Promise<void> {
  try {
    await esClient.index({
      index: EMAIL_INDEX_NAME,
      id: doc.id,
      document: doc,
    });
  } catch (err) {
    console.warn(`[Elasticsearch] Failed to index document ${doc.id}:`, (err as Error).message);
  }
}

export async function updateEmailDocumentStatus(
  id: string,
  status: string,
  sentAt?: Date | null,
  scheduledAt?: Date | null
): Promise<void> {
  try {
    const docUpdate: Record<string, any> = { status };
    if (sentAt !== undefined) docUpdate.sentAt = sentAt ? sentAt.toISOString() : null;
    if (scheduledAt !== undefined) docUpdate.scheduledAt = scheduledAt ? scheduledAt.toISOString() : null;

    await esClient.update({
      index: EMAIL_INDEX_NAME,
      id,
      doc: docUpdate,
    });
  } catch (err) {
    console.warn(`[Elasticsearch] Failed to update document ${id}:`, (err as Error).message);
  }
}

/**
 * Search emails with mandatory user-scoped filtering for multi-tenant isolation
 * @param query - Search query string
 * @param userId - Authenticated user's ID (required for data isolation)
 */
export async function searchEmails(query: string, userId: string): Promise<EmailDocument[]> {
  try {
    const result = await esClient.search({
      index: EMAIL_INDEX_NAME,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['recipient', 'subject', 'body'],
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: [
            {
              term: {
                userId: userId, // Critical: Always filter by userId for tenant isolation
              },
            },
          ],
        },
      },
    });

    return result.hits.hits.map((hit: any) => hit._source as EmailDocument);
  } catch (err) {
    console.warn('[Elasticsearch] Search query fallback to empty result:', (err as Error).message);
    return [];
  }
}

/**
 * Search emails by ID with user verification
 * @param emailId - Email document ID
 * @param userId - Authenticated user's ID (required for authorization)
 */
export async function getEmailById(emailId: string, userId: string): Promise<EmailDocument | null> {
  try {
    const result = await esClient.search({
      index: EMAIL_INDEX_NAME,
      query: {
        bool: {
          must: [
            {
              term: {
                id: emailId,
              },
            },
          ],
          filter: [
            {
              term: {
                userId: userId, // Critical: Verify ownership
              },
            },
          ],
        },
      },
    });

    if (result.hits.hits.length === 0) {
      return null;
    }

    return result.hits.hits[0]._source as EmailDocument;
  } catch (err) {
    console.warn('[Elasticsearch] Get by ID query failed:', (err as Error).message);
    return null;
  }
}

/**
 * Delete an email document from Elasticsearch
 * @param emailId - Email document ID to delete
 */
export async function deleteEmailDocument(emailId: string): Promise<void> {
  try {
    await esClient.delete({
      index: EMAIL_INDEX_NAME,
      id: emailId,
    });
    console.log(`[Elasticsearch] Deleted document ${emailId}`);
  } catch (err: any) {
    // Ignore 404 errors (document doesn't exist)
    if (err.meta?.statusCode !== 404) {
      console.warn(`[Elasticsearch] Failed to delete document ${emailId}:`, err.message);
    }
  }
}
