import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Facebook, Instagram, Linkedin, Check, Loader2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace, ORG_TYPE_LABEL, TONE_LABEL, TONE_HELP, type OrgType, type Tone, type Connections } from "@/lib/workspace-context";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Autopilot" }] }),
  component: Settings,
});

function Settings() {
  const { state, updateOrg, toggleConnection, reset } = useWorkspace();
  const navigate = useNavigate();

  const onReset = () => {
    if (confirm("Reset workspace? This clears your brand and all campaigns.")) {
      reset();
      navigate({ to: "/onboarding" });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your organization, brand, and connections.</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">Organization</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={state.organization.name} onChange={(e) => updateOrg({ name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={state.organization.type} onValueChange={(v) => updateOrg({ type: v as OrgType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ORG_TYPE_LABEL) as OrgType[]).map((k) => <SelectItem key={k} value={k}>{ORG_TYPE_LABEL[k]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={state.organization.tone} onValueChange={(v) => updateOrg({ tone: v as Tone })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TONE_LABEL) as Tone[]).map((k) => <SelectItem key={k} value={k}>{TONE_LABEL[k]}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{TONE_HELP[state.organization.tone]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">Brand colors</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Primary" value={state.organization.primaryColor} onChange={(v) => updateOrg({ primaryColor: v })} />
          <ColorField label="Secondary" value={state.organization.secondaryColor} onChange={(v) => updateOrg({ secondaryColor: v })} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">Connected accounts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <ConnectionRow icon={<Facebook className="h-4 w-4" />} label="Facebook" k="facebook" connected={state.connections.facebook} onToggle={toggleConnection} />
          <ConnectionRow icon={<Instagram className="h-4 w-4" />} label="Instagram" k="instagram" connected={state.connections.instagram} onToggle={toggleConnection} />
          <ConnectionRow icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" k="linkedin" connected={state.connections.linkedin} onToggle={toggleConnection} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/30">
        <CardHeader><CardTitle className="text-base text-destructive">Danger zone</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Reset workspace</div>
            <div className="text-xs text-muted-foreground">Clears your brand, connections, and campaigns.</div>
          </div>
          <Button variant="destructive" onClick={onReset}><RotateCcw className="mr-1 h-4 w-4" /> Reset</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Saved")}>Save changes</Button>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="border-0 font-mono text-sm shadow-none focus-visible:ring-0" />
      </div>
    </div>
  );
}

function ConnectionRow({ icon, label, k, connected, onToggle }: { icon: React.ReactNode; label: string; k: keyof Connections; connected: boolean; onToggle: (k: keyof Connections, v: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const click = () => {
    if (connected) { onToggle(k, false); return; }
    setBusy(true);
    setTimeout(() => { onToggle(k, true); setBusy(false); }, 600);
  };
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">{icon} {label}</div>
      <div className="flex items-center gap-2">
        {connected ? <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><Check className="h-3 w-3" /> Connected</Badge> : <Badge variant="outline">Disconnected</Badge>}
        <Button size="sm" variant={connected ? "outline" : "default"} onClick={click} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : connected ? "Disconnect" : "Connect"}
        </Button>
      </div>
    </div>
  );
}
