/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 * @param dateString ISO date string to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else if (diffWeek < 4) {
    return `${diffWeek}w ago`;
  } else if (diffMonth < 12) {
    return `${diffMonth}mo ago`;
  } else {
    return `${diffYear}y ago`;
  }
}

/**
 * Format a date as a readable string (e.g., "Jan 1, 2025")
 * @param dateString ISO date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a date as a time string (e.g., "3:30 PM")
 * @param dateString ISO date string to format
 * @returns Formatted time string
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format a date as a date and time string (e.g., "Jan 1, 2025 at 3:30 PM")
 * @param dateString ISO date string to format
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

/**
 * Check if a date is today
 * @param dateString ISO date string to check
 * @returns Boolean indicating if the date is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

/**
 * Group dates by day for display in sections
 * @param dates Array of date strings
 * @returns Object with dates grouped by day
 */
export function groupDatesByDay(dates: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  
  dates.forEach(dateString => {
    const date = new Date(dateString);
    const day = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!groups[day]) {
      groups[day] = [];
    }
    
    groups[day].push(dateString);
  });
  
  return groups;
}