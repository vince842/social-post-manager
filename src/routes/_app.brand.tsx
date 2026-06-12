import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace, ORG_TYPE_LABEL, TONE_LABEL } from "@/lib/workspace-context";

export const Route = createFileRoute("/_app/brand")({
  head: () => ({ meta: [{ title: "Brand Assets · Autopilot" }] }),
  component: Brand,
});

function Brand() {
  const { state } = useWorkspace();
  const org = state.organization;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Assets</h1>
          <p className="text-sm text-muted-foreground">The colors, logo, and voice we use across every campaign.</p>
        </div>
        <Button asChild variant="outline"><Link to="/settings">Edit brand</Link></Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Identity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div
                className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl text-2xl font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${org.primaryColor}, ${org.secondaryColor})` }}
              >
                {org.logoDataUrl ? <img src={org.logoDataUrl} alt="" className="h-full w-full object-cover" /> : (org.name || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">{org.name}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="secondary">{ORG_TYPE_LABEL[org.type]}</Badge>
                  <Badge variant="outline">{TONE_LABEL[org.tone]}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Palette</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Swatch label="Primary" color={org.primaryColor} />
            <Swatch label="Secondary" color={org.secondaryColor} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <div className="h-10 w-10 shrink-0 rounded-lg" style={{ background: color }} />
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="font-mono text-xs text-muted-foreground">{color}</div>
      </div>
    </div>
  );
}
