/**
 * LifeVault — Utility Functions
 */

/**
 * Format a number as Indian Rupee currency.
 */
export function formatCurrency(amount: number, currency = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Format a date string in a human-readable form.
 */
export function formatDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...options,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get a greeting based on the current time of day.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

/**
 * Return how many days remain until a target date.
 * Negative means the date has passed.
 */
export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Human-readable relative label for a date.
 */
export function relativeDate(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days === 0) {
    return 'Due today';
  }
  if (days === 1) {
    return 'Tomorrow';
  }
  if (days === -1) {
    return 'Yesterday';
  }
  if (days < 0) {
    return `${Math.abs(days)} days ago`;
  }
  if (days < 7) {
    return `In ${days} days`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.floor(days / 30);
  return `In ${months} month${months > 1 ? 's' : ''}`;
}

/**
 * Truncate text with an ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Get initials from a name (e.g. "Prajwal Nair" → "PN").
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0] ?? '')
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Return a user-friendly label for an expense category.
 */
export function expenseCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    GROCERIES: 'Groceries',
    FOOD: 'Food',
    PETROL: 'Petrol',
    SHOPPING: 'Shopping',
    BILLS: 'Bills',
    TRANSPORT: 'Transport',
    MEDICAL: 'Medical',
    ENTERTAINMENT: 'Entertainment',
    INSURANCE: 'Insurance',
    SERVICE: 'Service',
    FUEL: 'Fuel',
    OTHER: 'Other',
  };
  return labels[category] ?? category;
}

/**
 * Return a user-friendly label for a document type.
 */
export function documentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INSURANCE: 'Insurance',
    INVOICE: 'Invoice',
    RECEIPT: 'Receipt',
    WARRANTY: 'Warranty',
    REGISTRATION: 'Registration',
    PUC: 'PUC Certificate',
    SERVICE_RECORD: 'Service Record',
    CONTRACT: 'Contract',
    IDENTITY: 'Identity',
    MEDICAL: 'Medical',
    OTHER: 'Other',
  };
  return labels[type] ?? type;
}

/**
 * Delay helper for async operations.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
