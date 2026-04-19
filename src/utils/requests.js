// Pure helpers for filtering / inspecting request rows.

// Offers + swaps historically carried either `offerId`/`swapId` or the
// generic `requestId`. Helpers collapse the dual-key check to one call so
// new handlers cannot miss a branch.
export const matchesOfferId = (offer, id) =>
  offer.offerId === id || offer.requestId === id;

export const matchesSwapId = (swap, id) =>
  swap.swapId === id || swap.requestId === id;

// Standard error-message fallback for apiCall results.
export const errorMsg = (result, fallback) =>
  result?.error?.message || fallback;

export const hasApprovedTimeOffForDate = (employeeEmail, dateStr, timeOffRequests) => {
  if (!timeOffRequests || !employeeEmail) return false;
  return timeOffRequests.some(req =>
    req.email === employeeEmail &&
    req.status === 'approved' &&
    req.datesRequested.split(',').includes(dateStr)
  );
};
