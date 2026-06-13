import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Sparkles, ArrowLeft, ArrowRight, Check, Facebook, Instagram, Linkedin, Upload, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace, ORG_TYPE_LABEL, TONE_LABEL, TONE_HELP, type OrgType, type Tone, type Connections } from "@/lib/workspace-context";
import { paletteFromUrl } from "@/lib/campaign-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your workspace · Autopilot" },
      { name: "description", content: "Tell us about your organization so we can tailor your campaigns." },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["Organization", "Visual Brand", "Connections"];

function Onboarding() {
  const { state, updateOrg, completeOnboarding, toggleConnection } = useWorkspace();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const finish = () => {
    completeOnboarding();
    toast.success("You're all set!", { description: "Let's create your first campaign." });
    navigate({ to: "/dashboard" });
  };

  const canProceed =
    step === 1 ? state.organization.name.trim().length > 0 :
    step === 2 ? !!state.organization.primaryColor && !!state.organization.secondaryColor :
    true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Autopilot</div>
            <div className="text-xs text-muted-foreground">Social campaigns, on rails.</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Step {step} of 3 — {STEPS[step - 1]}</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <Progress value={(step / 3) * 100} />
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {step === 1 && <StepOrg organization={state.organization} updateOrg={updateOrg} />}
            {step === 2 && <StepBrand organization={state.organization} updateOrg={updateOrg} />}
            {step === 3 && <StepConnections connections={state.connections} onToggle={toggleConnection} />}

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={back} disabled={step === 1}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              {step < 3 ? (
                <Button onClick={next} disabled={!canProceed}>
                  Continue <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={finish}>
                  Finish setup <Check className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  function StepOrg() {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tell us about your organization</h2>
          <p className="mt-1 text-sm text-muted-foreground">A few details so we can tailor every campaign to your voice.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            placeholder="e.g. Westside Football Club"
            value={state.organization.name}
            onChange={(e) => updateOrg({ name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>What kind of organization?</Label>
          <Select value={state.organization.type} onValueChange={(v) => updateOrg({ type: v as OrgType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(ORG_TYPE_LABEL) as OrgType[]).map((k) => (
                <SelectItem key={k} value={k}>{ORG_TYPE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tone of voice</Label>
          <Select value={state.organization.tone} onValueChange={(v) => updateOrg({ tone: v as Tone })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(TONE_LABEL) as Tone[]).map((k) => (
                <SelectItem key={k} value={k}>{TONE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{TONE_HELP[state.organization.tone]} You can change this anytime.</p>
        </div>
      </div>
    );
  }

  function StepBrand() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [refUrl, setRefUrl] = useState(state.organization.referenceUrl);
    const [pulling, setPulling] = useState(false);

    const pull = () => {
      if (!refUrl.trim()) return;
      setPulling(true);
      setTimeout(() => {
        const { primary, secondary } = paletteFromUrl(refUrl);
        updateOrg({ primaryColor: primary, secondaryColor: secondary, referenceUrl: refUrl });
        setPulling(false);
        toast.success("Starter palette pulled", { description: "Tweak the colors below to taste." });
      }, 700);
    };

    const onFile = (file: File | undefined) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => updateOrg({ logoDataUrl: reader.result as string });
      reader.readAsDataURL(file);
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Make it look like you</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your colors and logo carry through every post we generate.</p>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <Label className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4" /> Have a website? Pull a starter palette</Label>
          <div className="mt-2 flex gap-2">
            <Input placeholder="https://yourclub.com" value={refUrl} onChange={(e) => setRefUrl(e.target.value)} />
            <Button type="button" variant="secondary" onClick={pull} disabled={pulling || !refUrl.trim()}>
              {pulling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pull colors"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">We'll suggest a palette — you can fine-tune below.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorField label="Primary color" value={state.organization.primaryColor} onChange={(v) => updateOrg({ primaryColor: v })} />
          <ColorField label="Secondary color" value={state.organization.secondaryColor} onChange={(v) => updateOrg({ secondaryColor: v })} />
        </div>

        <div className="space-y-2">
          <Label>Organization logo</Label>
          <div
            className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed bg-muted/30 p-4 transition hover:bg-muted/50"
            onClick={() => fileRef.current?.click()}
          >
            <div
              className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl"
              style={{ background: `linear-gradient(135deg, ${state.organization.primaryColor}, ${state.organization.secondaryColor})` }}
            >
              {state.organization.logoDataUrl ? (
                <img src={state.organization.logoDataUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">
                  {(state.organization.name || "?").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium"><Upload className="h-4 w-4" /> {state.organization.logoDataUrl ? "Replace logo" : "Upload logo"}</div>
              <p className="text-xs text-muted-foreground">PNG, JPG, or SVG. Optional — we'll use your initials otherwise.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        </div>
      </div>
    );
  }
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="border-0 font-mono text-sm shadow-none focus-visible:ring-0" />
      </div>
    </div>
  );
}

function StepConnections({ connections, onToggle }: { connections: Connections; onToggle: (k: keyof Connections, v: boolean) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Connect your accounts</h2>
        <p className="mt-1 text-sm text-muted-foreground">We'll post on your behalf when a campaign is scheduled. You can skip this and connect later.</p>
      </div>

      <div className="space-y-3">
        <ConnectionRow icon={<Facebook className="h-5 w-5" />} label="Facebook" connected={connections.facebook} onConnect={(v) => onToggle("facebook", v)} />
        <ConnectionRow icon={<Instagram className="h-5 w-5" />} label="Instagram" connected={connections.instagram} onConnect={(v) => onToggle("instagram", v)} />
        <ConnectionRow icon={<Linkedin className="h-5 w-5" />} label="LinkedIn" connected={connections.linkedin} onConnect={(v) => onToggle("linkedin", v)} />
      </div>
    </div>
  );
}

function ConnectionRow({ icon, label, connected, onConnect }: { icon: React.ReactNode; label: string; connected: boolean; onConnect: (v: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const click = () => {
    if (connected) { onConnect(false); return; }
    setBusy(true);
    setTimeout(() => { onConnect(true); setBusy(false); }, 600);
  };
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-4 sm:flex sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted">{icon}</div>
        <div className="min-w-0">
          <div className="truncate font-medium">{label}</div>
          {connected ? (
            <Badge variant="secondary" className="mt-0.5 gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><Check className="h-3 w-3" /> Connected</Badge>
          ) : (
            <Badge variant="outline" className="mt-0.5">Disconnected</Badge>
          )}
        </div>
      </div>
      <Button size="sm" variant={connected ? "outline" : "default"} onClick={click} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : connected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}
