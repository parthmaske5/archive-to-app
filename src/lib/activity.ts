const HOUR = 3600_000;

/** Badges a student sees on a tutor card. */
export function activityBadges(a: { lastActiveAt: string | null; avgReplyMinutes: number | null; replies: number }, now = Date.now()): string[] {
  const out: string[] = [];
  if (a.replies > 0 && a.avgReplyMinutes != null && a.avgReplyMinutes <= 120) out.push("Responds within 2 hours");
  if (a.lastActiveAt && now - new Date(a.lastActiveAt).getTime() < 24 * HOUR) out.push("Active today");
  return out;
}

/** An enquiry the tutor still hasn't answered 48 hours after it was sent. */
export function needsFollowUp(e: { createdAt: string; tutorRepliedAt: string | null }, now = Date.now()) {
  return !e.tutorRepliedAt && now - new Date(e.createdAt).getTime() >= 48 * HOUR;
}

/** The monthly "Still available?" prompt shows until the tutor answers it this month. */
export function checkinDue(lastCheckinAt: string | null, now = new Date()) {
  if (!lastCheckinAt) return true;
  const d = new Date(lastCheckinAt);
  return d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth();
}
