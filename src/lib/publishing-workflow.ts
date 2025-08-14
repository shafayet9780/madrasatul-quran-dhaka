import { client } from './sanity';
import { validatePage, validateNewsEvent, validateAcademicProgram, validateStaffMember, validateFacility } from './content-validation';
import type { ValidationResult } from './content-validation';

/**
 * Publishing workflow utilities for Sanity CMS content
 */

export interface PublishingStatus {
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  publishedAt?: string;
  publishedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export interface PublishingWorkflowResult {
  success: boolean;
  message: string;
  validation?: ValidationResult;
  publishedAt?: string;
}

/**
 * Publish a document after validation
 */
export async function publishDocument(
  documentId: string,
  documentType: string,
  publishedBy: string
): Promise<PublishingWorkflowResult> {
  try {
    // First, fetch the document
    const document = await client.getDocument(documentId);
    
    if (!document) {
      return {
        success: false,
        message: 'Document not found'
      };
    }

    // Validate the document based on its type
    let validation: ValidationResult;
    
    switch (documentType) {
      case 'page':
        validation = validatePage(document);
        break;
      case 'newsEvent':
        validation = validateNewsEvent(document);
        break;
      case 'academicProgram':
        validation = validateAcademicProgram(document);
        break;
      case 'staffMember':
        validation = validateStaffMember(document);
        break;
      case 'facility':
        validation = validateFacility(document);
        break;
      default:
        return {
          success: false,
          message: `Unknown document type: ${documentType}`
        };
    }

    // Check if validation passed
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Document validation failed',
        validation
      };
    }

    // Update the document with publishing information
    const publishedAt = new Date().toISOString();
    
    const updatedDocument = await client
      .patch(documentId)
      .set({
        publishedAt,
        publishedBy,
        publishingStatus: {
          status: 'published',
          publishedAt,
          publishedBy,
          notes: 'Published via workflow'
        }
      })
      .commit();

    return {
      success: true,
      message: 'Document published successfully',
      validation,
      publishedAt
    };

  } catch (error) {
    console.error('Publishing error:', error);
    return {
      success: false,
      message: `Publishing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Unpublish a document
 */
export async function unpublishDocument(
  documentId: string,
  unpublishedBy: string,
  reason?: string
): Promise<PublishingWorkflowResult> {
  try {
    const unpublishedAt = new Date().toISOString();
    
    await client
      .patch(documentId)
      .unset(['publishedAt'])
      .set({
        publishingStatus: {
          status: 'draft',
          unpublishedAt,
          unpublishedBy,
          notes: reason || 'Unpublished via workflow'
        }
      })
      .commit();

    return {
      success: true,
      message: 'Document unpublished successfully'
    };

  } catch (error) {
    console.error('Unpublishing error:', error);
    return {
      success: false,
      message: `Unpublishing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Submit document for review
 */
export async function submitForReview(
  documentId: string,
  submittedBy: string,
  notes?: string
): Promise<PublishingWorkflowResult> {
  try {
    const submittedAt = new Date().toISOString();
    
    await client
      .patch(documentId)
      .set({
        publishingStatus: {
          status: 'review',
          submittedAt,
          submittedBy,
          notes: notes || 'Submitted for review'
        }
      })
      .commit();

    return {
      success: true,
      message: 'Document submitted for review'
    };

  } catch (error) {
    console.error('Submit for review error:', error);
    return {
      success: false,
      message: `Submit for review failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Approve document for publishing
 */
export async function approveDocument(
  documentId: string,
  approvedBy: string,
  notes?: string
): Promise<PublishingWorkflowResult> {
  try {
    const approvedAt = new Date().toISOString();
    
    await client
      .patch(documentId)
      .set({
        publishingStatus: {
          status: 'approved',
          approvedAt,
          approvedBy,
          notes: notes || 'Approved for publishing'
        }
      })
      .commit();

    return {
      success: true,
      message: 'Document approved for publishing'
    };

  } catch (error) {
    console.error('Approve document error:', error);
    return {
      success: false,
      message: `Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Reject document with feedback
 */
export async function rejectDocument(
  documentId: string,
  rejectedBy: string,
  feedback: string
): Promise<PublishingWorkflowResult> {
  try {
    const rejectedAt = new Date().toISOString();
    
    await client
      .patch(documentId)
      .set({
        publishingStatus: {
          status: 'draft',
          rejectedAt,
          rejectedBy,
          notes: feedback
        }
      })
      .commit();

    return {
      success: true,
      message: 'Document rejected with feedback'
    };

  } catch (error) {
    console.error('Reject document error:', error);
    return {
      success: false,
      message: `Rejection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Archive document
 */
export async function archiveDocument(
  documentId: string,
  archivedBy: string,
  reason?: string
): Promise<PublishingWorkflowResult> {
  try {
    const archivedAt = new Date().toISOString();
    
    await client
      .patch(documentId)
      .set({
        publishingStatus: {
          status: 'archived',
          archivedAt,
          archivedBy,
          notes: reason || 'Archived via workflow'
        }
      })
      .commit();

    return {
      success: true,
      message: 'Document archived successfully'
    };

  } catch (error) {
    console.error('Archive document error:', error);
    return {
      success: false,
      message: `Archiving failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get documents by publishing status
 */
export async function getDocumentsByStatus(
  documentType: string,
  status: PublishingStatus['status']
): Promise<any[]> {
  try {
    const query = `*[_type == $documentType && publishingStatus.status == $status] | order(_updatedAt desc)`;
    return await client.fetch(query, { documentType, status });
  } catch (error) {
    console.error('Get documents by status error:', error);
    return [];
  }
}

/**
 * Get publishing workflow history for a document
 */
export async function getPublishingHistory(documentId: string): Promise<any[]> {
  try {
    // This would require a separate history collection or document versioning
    // For now, return the current publishing status
    const document = await client.getDocument(documentId);
    return document?.publishingStatus ? [document.publishingStatus] : [];
  } catch (error) {
    console.error('Get publishing history error:', error);
    return [];
  }
}

/**
 * Batch publish multiple documents
 */
export async function batchPublishDocuments(
  documentIds: string[],
  publishedBy: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Array<{ id: string; result: PublishingWorkflowResult }>> {
  const results: Array<{ id: string; result: PublishingWorkflowResult }> = [];

  for (let i = 0; i < documentIds.length; i++) {
    const documentId = documentIds[i];
    
    try {
      // Get document type
      const document = await client.getDocument(documentId);
      const documentType = document?._type;
      
      if (!documentType) {
        results.push({
          id: documentId,
          result: {
            success: false,
            message: 'Document not found or missing type'
          }
        });
        continue;
      }

      const result = await publishDocument(documentId, documentType, publishedBy);
      results.push({ id: documentId, result });

    } catch (error) {
      results.push({
        id: documentId,
        result: {
          success: false,
          message: `Batch publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });
    }

    if (onProgress) {
      onProgress(i + 1, documentIds.length);
    }
  }

  return results;
}

/**
 * Schedule document for future publishing
 */
export async function schedulePublishing(
  documentId: string,
  publishAt: string,
  scheduledBy: string
): Promise<PublishingWorkflowResult> {
  try {
    await client
      .patch(documentId)
      .set({
        publishingStatus: {
          status: 'approved',
          scheduledPublishAt: publishAt,
          scheduledBy,
          notes: `Scheduled for publishing at ${publishAt}`
        }
      })
      .commit();

    return {
      success: true,
      message: 'Document scheduled for publishing'
    };

  } catch (error) {
    console.error('Schedule publishing error:', error);
    return {
      success: false,
      message: `Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get scheduled documents that are ready to publish
 */
export async function getScheduledDocumentsReadyToPublish(): Promise<any[]> {
  try {
    const now = new Date().toISOString();
    const query = `*[
      publishingStatus.status == "approved" && 
      defined(publishingStatus.scheduledPublishAt) && 
      publishingStatus.scheduledPublishAt <= $now
    ] | order(publishingStatus.scheduledPublishAt asc)`;
    
    return await client.fetch(query, { now });
  } catch (error) {
    console.error('Get scheduled documents error:', error);
    return [];
  }
}