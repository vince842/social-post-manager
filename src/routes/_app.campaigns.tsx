import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/lib/workspace-context";
import { formatDate } from "@/lib/campaign-helpers";

export const Route = createFileRoute("/_app/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns · Autopilot" }] }),
  component: Campaigns,
});

function Campaigns() {
  const { state } = useWorkspace();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Every campaign you've scheduled with Autopilot.</p>
        </div>
        <Button asChild><Link to="/campaigns/new"><Sparkles className="mr-1 h-4 w-4" /> New Campaign</Link></Button>
      </div>

      {state.campaigns.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center">
            <h3 className="text-lg font-semibold">No campaigns yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your scheduled campaigns will appear here.</p>
            <Button asChild className="mt-4"><Link to="/campaigns/new">Create your first <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {state.campaigns.map((c) => (
            <Card key={c.id} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{c.name}</h3>
                  <Badge variant="secondary">{c.status}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  Event: {formatDate(c.eventDate)} · {c.posts.filter((p) => p.enabled).length} posts scheduled
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
