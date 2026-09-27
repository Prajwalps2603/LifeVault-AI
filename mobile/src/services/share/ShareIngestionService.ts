/**
 * ShareIngestionService — Android Share Intent & iOS Share Extension handler.
 *
 * Implements Section 83 (Phase 8):
 * - Rule 5: Never silently upload user files without confirmation.
 * - Handles files shared from external apps (WhatsApp, Files, Camera, Chrome).
 * - Automatic document understanding & classifier routing.
 * - Bridges into DocumentProcessingService for human-in-the-loop review.
 */

import { DocumentProcessingService, DocumentAnalysisResult } from '../ai/DocumentProcessingService';
import type { DocumentType } from '../../types';

export interface SharedIncomingItem {
  uri: string;
  mimeType: string;
  name?: string;
  text?: string;
}

class ShareIngestionServiceClass {
  /**
   * Process a shared item from Android ACTION_SEND or iOS Share Extension.
   * Enforces Rule 14: Generates an analysis for user review before saving.
   */
  async processSharedItem(item: SharedIncomingItem): Promise<DocumentAnalysisResult> {
    const fileName = item.name || 'Shared_Document';
    const lowerName = fileName.toLowerCase();

    // Determine preliminary category
    let detectedType: DocumentType = 'OTHER';
    if (lowerName.includes('receipt') || lowerName.includes('bill') || lowerName.includes('invoice')) {
      detectedType = lowerName.includes('invoice') ? 'INVOICE' : 'RECEIPT';
    } else if (lowerName.includes('insurance') || lowerName.includes('policy')) {
      detectedType = 'INSURANCE';
    } else if (lowerName.includes('puc') || lowerName.includes('emission')) {
      detectedType = 'PUC';
    } else if (lowerName.includes('warranty')) {
      detectedType = 'WARRANTY';
    }

    // Run simulated OCR analysis
    const analysis = await DocumentProcessingService.processDocument(item.uri, fileName);
    return analysis;
  }
}

export const ShareIngestionService = new ShareIngestionServiceClass();
