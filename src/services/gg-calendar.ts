/**
 * Represents a calendar event.
 */
export interface CalendarEvent {
  /**
   * The title of the event.
   */
  title: string;
  /**
   * The start time of the event.
   */
  startTime: Date;
  /**
   * The end time of the event.
   */
  endTime: Date;
}

/**
 * Asynchronously creates a calendar event.
 *
 * @param event The calendar event to create.
 * @returns A promise that resolves when the event is created.
 */
export async function createCalendarEvent(
  event: CalendarEvent
): Promise<void> {
  // TODO: Implement this by calling an API.
  console.log('Creating calendar event:', event);
}
