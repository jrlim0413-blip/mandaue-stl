// ==============================================================================
// LUCKY BETPLAY CORPORATION (STL MANDAUE OPERATIONS)
// PHYSICAL RECEIPT BARCODE & IMAGE SCANNER ENGINE
// Uses Browser BarcodeDetector API, Canvas processing, and Pattern matching
// ==============================================================================

import { findTicketInSystem, getTicketIdentifiers, cleanKey } from './ticketVerificationBot';

/**
 * Scans an image blob or data URL for 1D/2D barcodes (Code 128, Code 39, QR Code, etc.)
 */
export async function scanReceiptImage(imageSource, fileName = '') {
  let detectedCode = null;
  let barcodeFormat = null;

  // 1. Try Browser Native BarcodeDetector API (Chrome, Edge, Android, iOS Safari)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
      const detector = new window.BarcodeDetector({
        formats: supportedFormats.length > 0 ? supportedFormats : ['code_128', 'code_39', 'qr_code', 'ean_13', 'upc_a', 'data_matrix']
      });

      // Create image element to load the source
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const barcodes = await detector.detect(img);
      if (barcodes && barcodes.length > 0) {
        detectedCode = String(barcodes[0].rawValue || '').trim();
        barcodeFormat = barcodes[0].format || 'barcode';
      }
    } catch (err) {
      console.warn('Native BarcodeDetector scan failed or not supported for this image:', err);
    }
  }

  // 2. Check File Name Pattern (e.g. "081628-OIIIRA0CN.jpg", "Ticket_784.png")
  if (!detectedCode && fileName) {
    const fnMatch = fileName.match(/([0-9]{6}-[A-Za-z0-9]+|[A-Za-z0-9_-]{8,24}|REC-[0-9]+|TXN-[0-9]+)/i);
    if (fnMatch) {
      detectedCode = fnMatch[0];
      barcodeFormat = 'filename_match';
    }
  }

  return {
    success: Boolean(detectedCode),
    detectedCode,
    barcodeFormat
  };
}

/**
 * Process uploaded receipt image against Live API Database
 */
export async function processReceiptVerification(imageSource, fileName, { rawApiData = [], unclaimedList = [], claimedList = [], returnedList = [] }) {
  const scanResult = await scanReceiptImage(imageSource, fileName);

  if (scanResult.success && scanResult.detectedCode) {
    const matchedTicket = findTicketInSystem(scanResult.detectedCode, {
      rawApiData,
      unclaimedList,
      claimedList,
      returnedList
    });

    return {
      status: 'MATCH_FOUND',
      detectedCode: scanResult.detectedCode,
      format: scanResult.barcodeFormat,
      ticket: matchedTicket
    };
  }

  // If no barcode was detected or barcode could not be matched
  return {
    status: 'NO_BARCODE_DETECTED',
    detectedCode: null,
    format: null,
    ticket: null
  };
}
