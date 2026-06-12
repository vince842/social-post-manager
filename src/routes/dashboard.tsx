import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Megaphone, CheckCircle2, Facebook, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace, TONE_LABEL } from "@/lib/workspace-context";
import { formatDate } from "@/lib/campaign-helpers";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Autopilot" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useWorkspace();
  const upcoming = state.campaigns
    .flatMap((c) => c.posts.filter((p) => p.enabled).map((p) => ({ campaign: c, post: p })))
    .filter((x) => new Date(x.post.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => +new Date(a.post.date) - +new Date(b.post.date))
    .slice(0, 5);

  const greeting = state.organization.tone === "energetic" ? "Let's go" : state.organization.tone === "casual" ? "Hey" : "Welcome back";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
      <div
        className="overflow-hidden rounded-2xl border p-6 sm:p-8 text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${state.organization.primaryColor}, ${state.organization.secondaryColor})` }}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <Badge className="mb-2 bg-white/20 text-white hover:bg-white/20">{TONE_LABEL[state.organization.tone]}</Badge>
            <h1 className="truncate text-2xl font-bold sm:text-3xl">{greeting}, {state.organization.name}</h1>
            <p className="mt-1 text-sm text-white/80">Ready to plan your next campaign? It only takes a minute.</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="shrink-0">
            <Link to="/campaigns/new"><Sparkles className="mr-1 h-4 w-4" /> Create Campaign</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4" /> Upcoming posts</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center">
                <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
                <Button asChild className="mt-3"><Link to="/campaigns/new">Create your first campaign <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
            ) : (
              <ul className="divide-y">
                {upcoming.map(({ campaign, post }) => (
                  <li key={post.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{post.header} — {campaign.name}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(post.date)}</div>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Connected accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { key: "facebook" as const, label: "Facebook", icon: Facebook },
              { key: "instagram" as const, label: "Instagram", icon: Instagram },
              { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin },
            ].map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded-lg border p-2">
                <div className="flex items-center gap-2 text-sm"><s.icon className="h-4 w-4" /> {s.label}</div>
                {state.connections[s.key] ? (
                  <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3 w-3" /> Live</Badge>
                ) : (
                  <Link to="/settings" className="text-xs text-primary hover:underline">Connect</Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      </div>
    </AppShell>
  );
}
