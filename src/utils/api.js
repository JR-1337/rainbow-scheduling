// API client. Wraps the Apps Script web-app endpoint with token-aware payload
// auth, URL-length-aware POST fallback, and chunked save for large batches.

import { getAuthToken, handleAuthError } from '../auth';

const API_URL = 'https://script.google.com/macros/s/AKfycbznGQ-pC1r48r1VDscs7Oqs0_jMZN3X3eB7h_L9ZsIXS8sYNSLEj0lUK8s1PtG5So5XoA/exec';

export const apiCall = async (action, payload = {}, onProgress) => {
  // S37: auto-attach session token (if present) to every payload so no caller
  // has to pass `callerEmail`. Login/public endpoints are unaffected because
  // the backend only reads `token` when verifyAuth is invoked.
  const token = getAuthToken();
  const authedPayload = token ? { ...payload, token } : payload;
  try {
    const payloadJson = JSON.stringify(authedPayload);
    const params = new URLSearchParams({ action, payload: payloadJson });
    const url = `${API_URL}?${params.toString()}`;

    let result = null;

    // URL too long -> try POST first, fall back to chunked GET for batchSaveShifts.
    if (url.length > 6000) {
      try {
        const postResponse = await fetch(API_URL, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action, payload: authedPayload })
        });
        const postText = await postResponse.text();
        try {
          const parsed = JSON.parse(postText);
          if (parsed.success !== undefined) result = parsed;
        } catch (e) { /* POST failed or returned HTML redirect, fall through */ }
      } catch (e) { /* POST failed, fall through */ }

      if (!result && action === 'batchSaveShifts' && authedPayload.shifts?.length > 10) {
        result = await chunkedBatchSave(authedPayload, onProgress);
      }
    }

    if (!result) {
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        result = { success: false, error: { code: 'PARSE_ERROR', message: 'Invalid response from server' } };
      }
    }

    // S37: centralized auth-failure handling.
    if (result && result.success === false && result.error?.code) {
      handleAuthError(result.error.code);
    }
    return result;
  } catch (error) {
    return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server. Please try again.' } };
  }
};

// Chunk large batchSaveShifts into multiple smaller GET requests.
const chunkedBatchSave = async (payload, onProgress) => {
  const { shifts, periodDates, callerEmail, token } = payload;
  const CHUNK_SIZE = 15;
  let totalSaved = 0;
  let lastError = null;
  let failedChunks = 0;
  const totalChunks = Math.ceil(shifts.length / CHUNK_SIZE);

  // s028 -- mirror backend keyOf in Code.gs:1806 exactly. Singular types
  // (work, sick, pk) use the 3-tuple synthetic key; non-singular (meetings)
  // use the row's real id when present so existing rows survive in place
  // instead of getting dropped + re-appended at the end of the Sheet.
  const SINGULAR_TYPES = { work: 1, sick: 1, pk: 1 };
  const keyOfShift = (s) => {
    const t = s.type || 'work';
    if (SINGULAR_TYPES[t]) return `${s.employeeId}-${s.date}-${t}`;
    return s.id ? String(s.id) : `${t.toUpperCase()}-${s.employeeId}-${s.date}`;
  };
  const allShiftKeys = shifts.map(keyOfShift);

  for (let i = 0; i < shifts.length; i += CHUNK_SIZE) {
    const chunk = shifts.slice(i, i + CHUNK_SIZE);
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const isLastChunk = (i + CHUNK_SIZE) >= shifts.length;

    if (onProgress) onProgress(i + chunk.length, shifts.length, chunkNum, totalChunks);

    const chunkPayload = {
      ...(token ? { token } : {}),
      ...(callerEmail ? { callerEmail } : {}),
      shifts: chunk,
      periodDates: isLastChunk ? periodDates : [],
      ...(isLastChunk ? { allShiftKeys } : {})
    };

    const params = new URLSearchParams({ action: 'batchSaveShifts', payload: JSON.stringify(chunkPayload) });

    try {
      const response = await fetch(`${API_URL}?${params.toString()}`, { method: 'GET', redirect: 'follow' });
      const text = await response.text();
      const result = JSON.parse(text);

      if (result.success) {
        totalSaved += result.data?.savedCount || chunk.length;
      } else {
        lastError = result.error;
        failedChunks += 1;
      }
    } catch (err) {
      lastError = { code: 'NETWORK_ERROR', message: err.message };
      failedChunks += 1;
    }
  }

  if (lastError) {
    return { success: false, error: lastError, data: { savedCount: totalSaved, totalChunks, failedChunks } };
  }
  return { success: true, data: { savedCount: totalSaved, totalChunks, failedChunks: 0 } };
};
