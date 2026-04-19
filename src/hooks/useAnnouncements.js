import { useState } from 'react';
import { apiCall } from '../utils/api';

export function useAnnouncements({ periodStartDate, userEmail }) {
  const [announcements, setAnnouncements] = useState({});
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  const currentAnnouncement = announcements[periodStartDate] || { subject: '', message: '' };
  const setCurrentAnnouncement = (ann) =>
    setAnnouncements(prev => ({ ...prev, [periodStartDate]: ann }));

  const clearAnnouncement = async () => {
    if (!userEmail) return;
    setSavingAnnouncement(true);
    await apiCall('deleteAnnouncement', { periodStartDate });
    setSavingAnnouncement(false);
    setAnnouncements(prev => ({ ...prev, [periodStartDate]: { subject: '', message: '' } }));
  };

  const saveAnnouncement = async (announcement) => {
    if (!userEmail) return;
    if (!announcement.subject && !announcement.message) {
      await clearAnnouncement();
      return;
    }
    setSavingAnnouncement(true);
    const result = await apiCall('saveAnnouncement', {
      periodStartDate,
      subject: announcement.subject,
      message: announcement.message,
    });
    if (result.success) {
      setAnnouncements(prev => ({ ...prev, [periodStartDate]: result.data.announcement }));
    } else {
      alert('Failed to save announcement: ' + (result.error?.message || 'Unknown error'));
    }
    setSavingAnnouncement(false);
  };

  return {
    currentAnnouncement,
    setCurrentAnnouncement,
    saveAnnouncement,
    clearAnnouncement,
    savingAnnouncement,
    setAnnouncements,
  };
}
