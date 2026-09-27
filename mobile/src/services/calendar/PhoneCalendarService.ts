/**
 * PhoneCalendarService — Direct Phone Calendar Integration for LifeVault AI.
 * Handles adding reminders, expiries, and scheduled dues to the user's phone calendar.
 */

import { Linking, Platform } from 'react-native';

export interface CalendarEventPayload {
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export const PhoneCalendarService = {
  /**
   * Save an event directly into the phone's native Calendar app or Google Calendar.
   */
  async addToPhoneCalendar(payload: CalendarEventPayload): Promise<boolean> {
    const { title, description, date, time } = payload;

    try {
      const [year, month, day] = (date || new Date().toISOString().slice(0, 10))
        .split('-')
        .map(Number);
      const [hour, minute] = (time || '09:00').split(':').map(Number);

      const startDate = new Date(year, (month || 1) - 1, day || 1, hour || 9, minute || 0);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

      const startTimeMs = startDate.getTime();

      // Format ISO without dashes and colons for Google Calendar intent (e.g. 20260928T090000Z)
      const formatCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const startIso = formatCalDate(startDate);
      const endIso = formatCalDate(endDate);

      const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title,
      )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(description || 'LifeVault AI Reminder')}`;

      if (Platform.OS === 'android') {
        // Try opening native Android Calendar app first
        const nativeContentUrl = `content://com.android.calendar/time/${startTimeMs}`;
        const canOpen = await Linking.canOpenURL(nativeContentUrl).catch(() => false);
        if (canOpen) {
          await Linking.openURL(nativeContentUrl);
          return true;
        }
      }

      // Universal calendar handler (opens Google Calendar app or default phone calendar)
      const canOpenGCal = await Linking.canOpenURL(gCalUrl).catch(() => false);
      if (canOpenGCal) {
        await Linking.openURL(gCalUrl);
        return true;
      } else {
        await Linking.openURL(gCalUrl);
        return true;
      }
    } catch (err) {
      console.warn('[PhoneCalendarService] Unable to open calendar:', err);
      return false;
    }
  },
};
