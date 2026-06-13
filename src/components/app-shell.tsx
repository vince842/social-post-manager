import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Calendar, LayoutDashboard, Megaphone, Palette, Settings as SettingsIcon, Sparkles, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/workspace-context";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/onboarding", label: "Onboarding", icon: SettingsIcon },
  { to: "/campaigns/new", label: "Autopilot", icon: Zap },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/brand", label: "Brand Assets", icon: Palette },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [state.onboarded, navigate]);

  if (!state.onboarded) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${state.organization.primaryColor}, ${state.organization.secondaryColor})` }}
              >
                {state.organization.logoDataUrl ? (
                  <img src={state.organization.logoDataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (state.organization.name || "?").slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="truncate text-sm font-semibold">{state.organization.name}</div>
            </div>
            <Button asChild size="sm">
              <Link to="/campaigns/new"><Sparkles className="mr-1 h-4 w-4" /> Create Campaign</Link>
            </Button>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-sm font-bold tracking-tight">Autopilot</div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = pathname === item.to || pathname === item.to + "/";
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.to}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}