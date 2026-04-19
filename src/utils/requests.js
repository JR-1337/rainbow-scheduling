// Pure helpers for filtering / inspecting request rows.

export const hasApprovedTimeOffForDate = (employeeEmail, dateStr, timeOffRequests) => {
  if (!timeOffRequests || !employeeEmail) return false;
  return timeOffRequests.some(req =>
    req.email === employeeEmail &&
    req.status === 'approved' &&
    req.datesRequested.split(',').includes(dateStr)
  );
};
