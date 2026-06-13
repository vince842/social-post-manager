import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";

export type OrgType = "small_business" | "sports_club" | "nfp";
export type Tone = "professional" | "energetic" | "community" | "casual";

export interface Organization {
  name: string;
  type: OrgType;
  tone: Tone;
  primaryColor: string;
  secondaryColor: string;
  logoDataUrl: string | null;
  referenceUrl: string;
}

export interface Connections {
  facebook: boolean;
  instagram: boolean;
  linkedin: boolean;
}

export type PostRole = "announcement" | "reminder" | "last_chance";

export interface ScheduledPost {
  id: string;
  role: PostRole;
  date: string; // ISO
  header: string;
  caption: string;
  background: string; // gradient key
  templateId?: string; // optional brand template image
  enabled: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  eventDate: string; // ISO
  createdAt: string;
  status: "scheduled" | "draft";
  posts: ScheduledPost[];
}

export interface Template {
  id: string;
  name: string;
  dataUrl: string; // cropped/sized to 3:2
  createdAt: string;
}

export interface WorkspaceState {
  onboarded: boolean;
  organization: Organization;
  connections: Connections;
  campaigns: Campaign[];
  templates: Template[];
}

const defaultState: WorkspaceState = {
  onboarded: false,
  organization: {
    name: "",
    type: "small_business",
    tone: "professional",
    primaryColor: "#4F46E5",
    secondaryColor: "#10B981",
    logoDataUrl: null,
    referenceUrl: "",
  },
  connections: { facebook: false, instagram: false, linkedin: false },
  campaigns: [],
  templates: [],
};

type Action =
  | { type: "HYDRATE"; state: WorkspaceState }
  | { type: "UPDATE_ORG"; patch: Partial<Organization> }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "TOGGLE_CONNECTION"; key: keyof Connections; value: boolean }
  | { type: "ADD_CAMPAIGN"; campaign: Campaign }
  | { type: "UPDATE_CAMPAIGN"; id: string; patch: Partial<Campaign> }
  | { type: "ADD_TEMPLATE"; template: Template }
  | { type: "REMOVE_TEMPLATE"; id: string }
  | { type: "RESET" };

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...defaultState,
        ...action.state,
        organization: { ...defaultState.organization, ...(action.state?.organization ?? {}) },
        connections: { ...defaultState.connections, ...(action.state?.connections ?? {}) },
        campaigns: Array.isArray(action.state?.campaigns) ? action.state.campaigns : [],
        templates: Array.isArray(action.state?.templates) ? action.state.templates : [],
      };
    case "UPDATE_ORG":
      return { ...state, organization: { ...state.organization, ...action.patch } };
    case "COMPLETE_ONBOARDING":
      return { ...state, onboarded: true };
    case "TOGGLE_CONNECTION":
      return { ...state, connections: { ...state.connections, [action.key]: action.value } };
    case "ADD_CAMPAIGN":
      return { ...state, campaigns: [action.campaign, ...state.campaigns] };
    case "UPDATE_CAMPAIGN":
      return {
        ...state,
        campaigns: state.campaigns.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };
    case "ADD_TEMPLATE":
      return { ...state, templates: [action.template, ...state.templates] };
    case "REMOVE_TEMPLATE":
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.id),
        campaigns: state.campaigns.map((c) => ({
          ...c,
          posts: c.posts.map((p) => (p.templateId === action.id ? { ...p, templateId: undefined } : p)),
        })),
      };
    case "RESET":
      return defaultState;
    default:
      return state;
  }
}

const STORAGE_KEY = "autopilot.workspace.v1";

interface Ctx {
  state: WorkspaceState;
  updateOrg: (patch: Partial<Organization>) => void;
  completeOnboarding: () => void;
  toggleConnection: (key: keyof Connections, value: boolean) => void;
  addCampaign: (c: Campaign) => void;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  addTemplate: (t: Template) => void;
  removeTemplate: (id: string) => void;
  reset: () => void;
}

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", state: JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const value: Ctx = {
    state,
    updateOrg: (patch) => dispatch({ type: "UPDATE_ORG", patch }),
    completeOnboarding: () => dispatch({ type: "COMPLETE_ONBOARDING" }),
    toggleConnection: (key, value) => dispatch({ type: "TOGGLE_CONNECTION", key, value }),
    addCampaign: (campaign) => dispatch({ type: "ADD_CAMPAIGN", campaign }),
    updateCampaign: (id, patch) => dispatch({ type: "UPDATE_CAMPAIGN", id, patch }),
    reset: () => dispatch({ type: "RESET" }),
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

// Helpers
export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  small_business: "Small Business",
  sports_club: "Sports Club",
  nfp: "Non-Profit",
};

export const TONE_LABEL: Record<Tone, string> = {
  professional: "Professional",
  energetic: "Energetic & Fun",
  community: "Community-focused",
  casual: "Casual",
};

export const TONE_HELP: Record<Tone, string> = {
  professional: "Polished, trustworthy, and to the point.",
  energetic: "Upbeat and exciting — great for events and game days.",
  community: "Warm and inclusive — perfect for clubs and NFPs.",
  casual: "Friendly and conversational, like chatting with a neighbour.",
};

export const POST_ROLE_LABEL: Record<PostRole, string> = {
  announcement: "Announcement",
  reminder: "Reminder",
  last_chance: "Day-of",
};

export const BACKGROUND_PRESETS: { key: string; label: string; css: string }[] = [
  { key: "sunrise", label: "Sunrise", css: "linear-gradient(135deg, #FDE68A 0%, #FB7185 100%)" },
  { key: "ocean", label: "Ocean", css: "linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)" },
  { key: "field", label: "Field", css: "linear-gradient(135deg, #86EFAC 0%, #16A34A 100%)" },
  { key: "dusk", label: "Dusk", css: "linear-gradient(135deg, #C084FC 0%, #1E293B 100%)" },
];
