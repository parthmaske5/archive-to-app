import { describe, expect, it } from "vitest";
import { activityBadges, checkinDue, needsFollowUp } from "@/lib/activity";

const now = new Date("2026-10-15T12:00:00Z").getTime();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

describe("tutor activity rules", () => {
  it("shows 'Responds within 2 hours' when average reply is 2 hours or less", () => {
    expect(activityBadges({ lastActiveAt: null, avgReplyMinutes: 120, replies: 3 }, now)).toEqual(["Responds within 2 hours"]);
    expect(activityBadges({ lastActiveAt: null, avgReplyMinutes: 121, replies: 3 }, now)).toEqual([]);
  });
  it("shows 'Active today' only within the last 24 hours", () => {
    expect(activityBadges({ lastActiveAt: hoursAgo(23), avgReplyMinutes: null, replies: 0 }, now)).toEqual(["Active today"]);
    expect(activityBadges({ lastActiveAt: hoursAgo(25), avgReplyMinutes: null, replies: 0 }, now)).toEqual([]);
  });
  it("students get the follow-up after 48 hours without a tutor reply", () => {
    expect(needsFollowUp({ createdAt: hoursAgo(47), tutorRepliedAt: null }, now)).toBe(false);
    expect(needsFollowUp({ createdAt: hoursAgo(48), tutorRepliedAt: null }, now)).toBe(true);
    expect(needsFollowUp({ createdAt: hoursAgo(80), tutorRepliedAt: hoursAgo(70) }, now)).toBe(false);
  });
  it("monthly check-in is due once per calendar month", () => {
    expect(checkinDue(null, new Date(now))).toBe(true);
    expect(checkinDue("2026-10-01T08:00:00Z", new Date(now))).toBe(false);
    expect(checkinDue("2026-09-30T08:00:00Z", new Date(now))).toBe(true);
  });
});
