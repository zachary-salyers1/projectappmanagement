/**
 * Format a date string or object to a human-readable format
 */
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a date string for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toISOString().split('T')[0];
};

/**
 * Calculate days remaining until a date
 * Returns a positive number for future dates, negative for past dates
 */
export const daysRemaining = (date: string | Date | undefined | null): number | null => {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = dateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Returns a status for a date (on time, due soon, overdue)
 */
export const getDateStatus = (date: string | Date | undefined | null): 'ontime' | 'duesoon' | 'overdue' | null => {
  const days = daysRemaining(date);
  
  if (days === null) return null;
  
  if (days < 0) return 'overdue';
  if (days <= 3) return 'duesoon';
  return 'ontime';
}; 