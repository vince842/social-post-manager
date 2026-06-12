import type { Campaign, Organization, PostRole, ScheduledPost, Tone } from "./workspace-context";

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface CaptionInput {
  campaignName: string;
  description: string;
  eventDate: string;
  orgName: string;
  tone: Tone;
  role: PostRole;
}

const HEADERS: Record<PostRole, string> = {
  announcement: "Save the Date",
  reminder: "Almost Here",
  last_chance: "Happening Today",
};

export function makeHeader(role: PostRole): string {
  return HEADERS[role];
}

export function makeCaption(input: CaptionInput): string {
  const { campaignName, orgName, tone, role, eventDate } = input;
  const when = new Date(eventDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const variants: Record<Tone, Record<PostRole, string>> = {
    professional: {
      announcement: `${orgName} is pleased to announce ${campaignName} on ${when}. Mark your calendar — details below.`,
      reminder: `A friendly reminder: ${campaignName} is tomorrow. We look forward to seeing you there.`,
      last_chance: `Today is the day — ${campaignName} kicks off shortly. Join us!`,
    },
    energetic: {
      announcement: `🎉 BIG NEWS! ${campaignName} is coming ${when}. You won't want to miss it!`,
      reminder: `⏰ One sleep to go! ${campaignName} is tomorrow — get pumped!`,
      last_chance: `🚀 IT'S HERE! ${campaignName} kicks off today. See you there!`,
    },
    community: {
      announcement: `Hey ${orgName} family — we're hosting ${campaignName} on ${when}. Bring a friend along!`,
      reminder: `Just a quick note: ${campaignName} is tomorrow. Can't wait to see everyone.`,
      last_chance: `Today's the day! ${campaignName} starts soon — we'd love to see you there.`,
    },
    casual: {
      announcement: `Heads up! ${campaignName} is happening ${when}. Pop it in your calendar 👍`,
      reminder: `Quick reminder — ${campaignName} is on tomorrow. Come hang out!`,
      last_chance: `Today's the day for ${campaignName}! Swing by 😊`,
    },
  };

  return variants[tone][role];
}

export function buildPosts(args: {
  campaignName: string;
  description: string;
  eventDate: Date;
  organization: Organization;
}): ScheduledPost[] {
  const { eventDate, organization, campaignName, description } = args;
  const roles: { role: PostRole; offset: number; bg: string }[] = [
    { role: "announcement", offset: -3, bg: "ocean" },
    { role: "reminder", offset: -1, bg: "sunrise" },
    { role: "last_chance", offset: 0, bg: "field" },
  ];
  return roles.map(({ role, offset, bg }) => ({
    id: crypto.randomUUID(),
    role,
    date: addDays(eventDate, offset).toISOString(),
    header: makeHeader(role),
    caption: makeCaption({
      campaignName,
      description,
      eventDate: eventDate.toISOString(),
      orgName: organization.name,
      tone: organization.tone,
      role,
    }),
    background: bg,
    enabled: true,
  }));
}

export function makeCampaign(args: {
  name: string;
  description: string;
  eventDate: Date;
  organization: Organization;
}): Campaign {
  return {
    id: crypto.randomUUID(),
    name: args.name,
    description: args.description,
    eventDate: args.eventDate.toISOString(),
    createdAt: new Date().toISOString(),
    status: "scheduled",
    posts: buildPosts(args),
  };
}

// Deterministic palette from a URL
export function paletteFromUrl(url: string): { primary: string; secondary: string } {
  let hash = 0;
  for (let i = 0; i < url.length; i++) hash = (hash * 31 + url.charCodeAt(i)) >>> 0;
  const h1 = hash % 360;
  const h2 = (h1 + 140) % 360;
  return { primary: hslHex(h1, 65, 50), secondary: hslHex(h2, 60, 55) };
}

function hslHex(h: number, s: number, l: number): string {
  const sN = s / 100, lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const PRESETS: { label: string; name: string; description: string }[] = [
  { label: "Weekly Match Update", name: "Weekly Match Update", description: "Round-up of this week's match — score, highlights, and player of the match." },
  { label: "Sausage Sizzle Fundraiser", name: "Sausage Sizzle Fundraiser", description: "Community sausage sizzle to raise funds for our club. Snags, drinks, and good vibes." },
  { label: "End of Season Sale", name: "End of Season Sale", description: "Big end-of-season sale — up to 40% off select items. Limited stock available." },
  { label: "Volunteer Call-Out", name: "Volunteer Call-Out", description: "We're looking for volunteers to help out at our upcoming event. Every hour counts!" },
  { label: "Grand Opening", name: "Grand Opening", description: "Join us for our grand opening — ribbon cutting, giveaways, and refreshments." },
];
