// ==============================================================================
// LUCKY BETPLAY CORPORATION (STL MANDAUE OPERATIONS)
// SMART TICKET & RECEIPT VERIFICATION CHATBOT ENGINE (LIVE API CONNECTED)
// Supports: UNCLAIMED (isClaim=0), CLAIMED (isClaim=1), RETURNED TO HQ
// Language: Concise & Professional English
// ==============================================================================

import { formatDrawTime, parseToDateString, getLocalDateString } from './dateFormatting';
import { getTicketAgeInDays, isIncidentReportEligible } from './ticketAge';

// Status Constants
export const TICKET_STATUS = {
  UNCLAIMED: 'UNCLAIMED',           // Active in API ledger & eligible for payout (isClaim=0)
  CLAIMED: 'CLAIMED',               // Already verified & paid out (isClaim=1)
  RETURNED: 'RETURNED_TO_HQ',       // Remitted / Returned to HQ (returned_winnings)
  EXPIRED: 'EXPIRED',               // Beyond 30-day PCSO claiming limit
  NOT_FOUND: 'NOT_FOUND_OR_INVALID' // Non-winning or unrecorded in system
};

// Helper: Clean alphanumeric key for exact & fuzzy matching
export const cleanKey = (val) => String(val || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

// Export demo tickets for fallback / testing reference
export const DEMO_SAMPLE_TICKETS = [
  {
    transactionId: '081628-OIIIRA0CN',
    betNo: '784',
    betCode: 'TS3',
    drawTime: '5:00 PM',
    betAmount: 50.00,
    winAmount: 5000.00,
    outlet: 'Subangdaku #01',
    status: TICKET_STATUS.UNCLAIMED
  }
];

/**
 * Extract all possible transaction / ticket identifier aliases from an API record
 */
export function getTicketIdentifiers(item) {
  if (!item) return [];
  const rawList = [
    item.transactionId, item.transId, item.transaction_id, item.receipt_no,
    item.ticket_no, item.ticketNo, item.trans_id, item.TransID, item.id,
    item.ref_no, item.refNo, item.code, item.apiId
  ];
  return rawList.filter(Boolean).map(id => String(id).trim());
}

/**
 * Formats an API item into a standard Ticket verification object
 */
export function normalizeTicket(item, fallbackStatus = TICKET_STATUS.UNCLAIMED) {
  if (!item) return null;
  const transIds = getTicketIdentifiers(item);
  const primaryId = transIds[0] || item.transactionId || item.transId || item.receipt_no || 'REC-N/A';
  const betNo = item.betNo || item.CombiNo || item.SoldOutCombiNo || item.number || '---';
  const betCode = item.betCode || (item.rambolito ? 'RS3' : 'TS3');
  const drawTime = item.drawTime || item.draw || item.draw_time || '5:00 PM';
  const drawDate = parseToDateString(item.drawDate || item.draw_date || item.created_at || item.date) || getLocalDateString();
  const betAmt = parseFloat(item.betAmount ?? item.bet_amount ?? item.amount ?? item.gross ?? 0);
  const winAmt = parseFloat(item.winAmount ?? item.win_amount ?? item.win ?? 0);
  const outlet = item.fullName || item.outlet || item.outlet_name || item.username || 'Mandaue Outlet';
  const teller = item.username || item.teller || 'Staff';
  const ageDays = getTicketAgeInDays(item);

  return {
    transactionId: primaryId,
    allIds: transIds,
    betNo,
    betCode,
    drawTime,
    drawDate,
    betAmount: betAmt,
    winAmount: winAmt,
    outlet,
    teller,
    status: fallbackStatus,
    ageInDays: ageDays,
    isOverdue: isIncidentReportEligible(item),
    remarks: item.remarks || (
      fallbackStatus === TICKET_STATUS.UNCLAIMED
        ? 'Active winning record in live API ledger.'
        : fallbackStatus === TICKET_STATUS.CLAIMED
          ? 'Payout disbursed and recorded in ledger.'
          : fallbackStatus === TICKET_STATUS.RETURNED
            ? 'Remitted and returned to Mandaue HQ.'
            : 'Verified in database.'
    )
  };
}

/**
 * Find ticket in the LIVE API data (Unclaimed isClaim=0, Claimed isClaim=1, Returned)
 */
export function findTicketInSystem(query, { rawApiData = [], unclaimedList = [], claimedList = [], returnedList = [] }) {
  if (!query) return null;
  const rawQ = String(query).trim();
  const cleanQ = cleanKey(rawQ);

  if (!cleanQ) return null;

  const masterUnclaimedPool = [...(Array.isArray(rawApiData) ? rawApiData : []), ...(Array.isArray(unclaimedList) ? unclaimedList : [])];
  
  const returnedTransIdSet = new Set(
    (Array.isArray(returnedList) ? returnedList : []).flatMap(item => getTicketIdentifiers(item).map(cleanKey))
  );

  // 1. Check Returned Winnings (Supabase returned_winnings)
  if (Array.isArray(returnedList)) {
    const returnedMatch = returnedList.find(item => {
      const ids = getTicketIdentifiers(item).map(cleanKey);
      const betNo = cleanKey(item.betNo || item.CombiNo);
      return ids.some(id => id === cleanQ || (cleanQ.length >= 6 && id.includes(cleanQ))) ||
        (cleanQ.length === 3 && betNo === cleanQ);
    });

    if (returnedMatch) {
      const normalized = normalizeTicket(returnedMatch, TICKET_STATUS.RETURNED);
      normalized.returnedAt = returnedMatch.created_at ? new Date(returnedMatch.created_at).toLocaleDateString() : 'Previous date';
      normalized.remarks = 'This ticket has been officially returned to HQ.';
      return normalized;
    }
  }

  // 2. Check Claimed Receipts API Pool (isClaim=1)
  if (Array.isArray(claimedList) && claimedList.length > 0) {
    const claimedMatch = claimedList.find(item => {
      const ids = getTicketIdentifiers(item).map(cleanKey);
      const betNo = cleanKey(item.betNo || item.CombiNo || item.SoldOutCombiNo);
      return ids.some(id => id === cleanQ || (cleanQ.length >= 6 && id.includes(cleanQ))) ||
        (cleanQ.length === 3 && betNo === cleanQ);
    });

    if (claimedMatch) {
      const normalized = normalizeTicket(claimedMatch, TICKET_STATUS.CLAIMED);
      normalized.claimedAt = claimedMatch.drawDate || claimedMatch.date || 'Recorded Payout';
      normalized.claimedBy = claimedMatch.outlet || claimedMatch.fullName || 'Cashier Desk';
      normalized.remarks = 'Prize payout already claimed in system.';
      return normalized;
    }
  }

  // 3. Check Active Unclaimed Receipts API Pool (isClaim=0)
  if (masterUnclaimedPool.length > 0) {
    const apiMatch = masterUnclaimedPool.find(item => {
      const ids = getTicketIdentifiers(item).map(cleanKey);
      const betNo = cleanKey(item.betNo || item.CombiNo || item.SoldOutCombiNo);
      
      const matchesId = ids.some(id => id === cleanQ || (cleanQ.length >= 6 && id.includes(cleanQ)));
      if (matchesId) return true;

      if (cleanQ.length === 3 && betNo === cleanQ) return true;

      return false;
    });

    if (apiMatch) {
      const ids = getTicketIdentifiers(apiMatch).map(cleanKey);
      const isActuallyReturned = ids.some(id => returnedTransIdSet.has(id));

      if (isActuallyReturned) {
        return normalizeTicket(apiMatch, TICKET_STATUS.RETURNED);
      } else {
        return normalizeTicket(apiMatch, TICKET_STATUS.UNCLAIMED);
      }
    }
  }

  return null;
}

/**
 * Simulate OCR receipt scanning and extract ticket information from an uploaded photo
 */
export function parseReceiptImageOCR(imageDataUrl, { rawApiData = [], unclaimedList = [], claimedList = [] }) {
  const masterPool = [...(Array.isArray(rawApiData) ? rawApiData : []), ...(Array.isArray(unclaimedList) ? unclaimedList : [])];
  const referenceTicket = masterPool[0] || (Array.isArray(claimedList) && claimedList[0]) || null;

  if (referenceTicket) {
    const status = referenceTicket.isClaim === 1 ? TICKET_STATUS.CLAIMED : TICKET_STATUS.UNCLAIMED;
    const norm = normalizeTicket(referenceTicket, status);
    return {
      scanned: true,
      barcodeDetected: true,
      confidence: '99.6%',
      extractedData: norm
    };
  }

  return {
    scanned: true,
    barcodeDetected: true,
    confidence: '98.5%',
    extractedData: {
      transactionId: '081628-OIIIRA0CN',
      betNo: '784',
      betCode: 'TS3',
      drawTime: '5:00 PM',
      drawDate: getLocalDateString(),
      betAmount: 50.00,
      winAmount: 5000.00,
      outlet: 'Subangdaku #01',
      teller: 'Staff Teller 1',
      status: TICKET_STATUS.UNCLAIMED
    }
  };
}

/**
 * Natural Language Processing to detect user intent & generate concise professional response
 */
export function generateBotVerificationReply(userMessage, { rawApiData = [], unclaimedList = [], claimedList = [], returnedList = [] }) {
  const text = String(userMessage || '').trim();
  const lower = text.toLowerCase();

  const totalUnclaimedCount = (Array.isArray(unclaimedList) ? unclaimedList.length : 0);
  const totalClaimedCount = (Array.isArray(claimedList) ? claimedList.length : 0);
  const totalReturnedCount = (Array.isArray(returnedList) ? returnedList.length : 0);

  // Extract possible Transaction ID patterns
  const transIdMatch = text.match(/\b([0-9]{6}-[A-Za-z0-9]+|[A-Za-z0-9_-]{6,28}|REC-[0-9]+|TXN-[0-9]+)\b/i);
  const betNoMatch = text.match(/\b([0-9]{3})\b/);

  // 1. If user provided a Transaction ID or bet number for verification
  if (transIdMatch || (betNoMatch && (lower.includes('verify') || lower.includes('check') || lower.includes('claim') || lower.includes('receipt') || lower.includes('ticket')))) {
    const searchTarget = transIdMatch ? transIdMatch[0] : betNoMatch[0];
    const ticket = findTicketInSystem(searchTarget, { rawApiData, unclaimedList, claimedList, returnedList });

    if (ticket) {
      if (ticket.status === TICKET_STATUS.UNCLAIMED) {
        return {
          type: 'ticket_result',
          ticket,
          message: `Ticket verified. Status: **UNCLAIMED** (Eligible for payout).`
        };
      } else if (ticket.status === TICKET_STATUS.CLAIMED) {
        return {
          type: 'ticket_result',
          ticket,
          message: `Ticket verified. Status: **CLAIMED & PAID**.`
        };
      } else if (ticket.status === TICKET_STATUS.RETURNED) {
        return {
          type: 'ticket_result',
          ticket,
          message: `Ticket verified. Status: **RETURNED TO HQ**.`
        };
      }
    } else {
      return {
        type: 'text',
        message: `No matching winning record found for \`${searchTarget}\`. Please verify the Transaction ID or upload a clear receipt photo.`
      };
    }
  }

  // 2. Query about status count & summary
  if (lower.includes('how many') || lower.includes('count') || lower.includes('summary') || lower.includes('total') || lower.includes('liability') || lower.includes('status') || lower.includes('api')) {
    const totalLiability = unclaimedList.reduce((acc, item) => acc + parseFloat(item.winAmount || item.win_amount || item.win || 0), 0);

    return {
      type: 'text',
      message: `**Live System Status:**\n• Unclaimed: **${totalUnclaimedCount} tickets** (₱${totalLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })})\n• Claimed: **${totalClaimedCount} tickets**\n• Returned to HQ: **${totalReturnedCount} tickets**`
    };
  }

  // 3. Query on how to verify receipts
  if (lower.includes('how to') || lower.includes('procedure') || lower.includes('process') || lower.includes('rules') || lower.includes('guidelines') || lower.includes('policy')) {
    return {
      type: 'text',
      message: `**Verification Procedure:**\n1. Enter the Transaction ID or upload a receipt photo.\n2. System verifies: **UNCLAIMED** (eligible for payout), **CLAIMED** (already paid), or **RETURNED** (remitted to HQ).`
    };
  }

  // 4. Greetings
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good afternoon') || lower.includes('good day')) {
    return {
      type: 'text',
      message: `Hello. Please enter a Transaction ID or upload a receipt photo to verify.`
    };
  }

  // 5. Thanks & Acknowledgements
  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('ok') || lower.includes('great') || lower.includes('noted')) {
    return {
      type: 'text',
      message: `You're welcome. Let me know if you need further verification.`
    };
  }

  // 6. Default Fallback
  return {
    type: 'text',
    message: `Please enter a Transaction ID (e.g., \`081628-...\`) or upload a receipt photo to verify its status.`
  };
}
