import { useState, useEffect, useRef } from 'react';
import { getAuthToken, getCachedUser, setOnAuthFailure } from '../auth';

export function useAuth(showToast) {
  const [currentUser, setCurrentUser] = useState(() => {
    return getAuthToken() ? getCachedUser() : null;
  });

  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  useEffect(() => {
    setOnAuthFailure(() => {
      setCurrentUser(null);
      showToastRef.current('warning', 'Session expired. Please log in again.', 4000);
    });
    return () => setOnAuthFailure(null);
  }, []);

  return [currentUser, setCurrentUser];
}
