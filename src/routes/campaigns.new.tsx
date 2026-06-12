import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Calendar as CalIcon, Check, Sparkles, Megaphone, Bell, Zap, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useWorkspace, BACKGROUND_PRESETS, POST_ROLE_LABEL, type ScheduledPost } from "@/lib/workspace-context";
import { buildPosts, formatDate, makeCampaign, PRESETS } from "@/lib/campaign-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/campaigns/new")({
  head: () => ({ meta: [{ title: "New Campaign · Autopilot" }] }),
  component: NewCampaign,
});

const STEPS = ["Goal", "Plan", "Templates", "Schedule"];

function NewCampaign() {
  const { state, addCampaign } = useWorkspace();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = posts.find((p) => p.id === editingId) || null;

  const canStep1 = name.trim() && description.trim() && eventDate;
  const canStep2 = posts.some((p) => p.enabled);

  const goNext = () => {
    if (step === 1 && eventDate) {
      const built = buildPosts({
        campaignName: name,
        description,
        eventDate,
        organization: state.organization,
      });
      setPosts(built);
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const finish = () => {
    if (!eventDate) return;
    const campaign = makeCampaign({ name, description, eventDate, organization: state.organization });
    // overwrite generated posts with edited ones
    campaign.posts = posts;
    addCampaign(campaign);
    toast.success("Autopilot engaged!", { description: "Your campaign is scheduled across connected accounts." });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Step {step} of 4 — {STEPS[step - 1]}</span>
          <span>{Math.round((step / 4) * 100)}%</span>
        </div>
        <Progress value={(step / 4) * 100} />
      </div>

      {step === 1 && (
        <Card className="rounded-2xl">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="text-2xl font-bold">What are you promoting?</h2>
              <p className="text-sm text-muted-foreground">Pick a preset to start, or describe it yourself. We'll handle the rest.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button key={p.label} variant="outline" size="sm" type="button"
                  onClick={() => { setName(p.name); setDescription(p.description); }}>
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cname">Campaign name</Label>
              <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Saturday Sausage Sizzle" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cdesc">Event or offer description</Label>
              <Textarea id="cdesc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's happening, who's it for, why should people care?" />
              <p className="text-xs text-muted-foreground">A sentence or two is plenty — we'll polish it.</p>
            </div>

            <div className="space-y-2">
              <Label>Event date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal sm:w-72", !eventDate && "text-muted-foreground")}>
                    <CalIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            <NavButtons back={null} next={goNext} disabled={!canStep1} />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-2xl">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="text-2xl font-bold">Here's your proposed plan</h2>
              <p className="text-sm text-muted-foreground">We've spaced out three posts to build momentum. Toggle any off if you'd rather skip it.</p>
            </div>

            <div className="space-y-3">
              {posts.map((p) => (
                <PlanRow key={p.id} post={p} onToggle={(v) => setPosts((arr) => arr.map((x) => x.id === p.id ? { ...x, enabled: v } : x))} />
              ))}
            </div>

            <NavButtons back={goBack} next={goNext} disabled={!canStep2} />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-2xl">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="text-2xl font-bold">Tweak your posts</h2>
              <p className="text-sm text-muted-foreground">Tap any card to edit the header, caption, or background. Your brand is already baked in.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {posts.filter((p) => p.enabled).map((p) => (
                <PostPreview key={p.id} post={p} onEdit={() => setEditingId(p.id)} />
              ))}
            </div>

            <NavButtons back={goBack} next={goNext} disabled={false} />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="rounded-2xl">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="text-2xl font-bold">Review &amp; schedule</h2>
              <p className="text-sm text-muted-foreground">Here's what we'll post on your behalf. You can edit anything before approving.</p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-sm font-semibold">{name}</div>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              <div className="mt-2 text-xs text-muted-foreground">Event: {eventDate ? format(eventDate, "PPP") : ""}</div>
            </div>

            <ul className="divide-y rounded-xl border">
              {posts.filter((p) => p.enabled).map((p) => (
                <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{POST_ROLE_LABEL[p.role]}</div>
                    <div className="truncate font-medium">{p.header}</div>
                    <div className="line-clamp-1 text-sm text-muted-foreground">{p.caption}</div>
                  </div>
                  <Badge variant="outline">{formatDate(p.date)}</Badge>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={goBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
              <Button size="lg" onClick={finish}>
                <Sparkles className="mr-1 h-4 w-4" /> Approve &amp; Schedule Autopilot
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditingId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit post</SheetTitle>
            <SheetDescription>Changes apply only to this post.</SheetDescription>
          </SheetHeader>
          {editing && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Header</Label>
                <Input value={editing.header} onChange={(e) => setPosts((arr) => arr.map((x) => x.id === editing.id ? { ...x, header: e.target.value } : x))} />
              </div>
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea rows={5} value={editing.caption} onChange={(e) => setPosts((arr) => arr.map((x) => x.id === editing.id ? { ...x, caption: e.target.value } : x))} />
              </div>
              <div className="space-y-2">
                <Label>Background</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_PRESETS.map((bg) => (
                    <button
                      key={bg.key}
                      type="button"
                      onClick={() => setPosts((arr) => arr.map((x) => x.id === editing.id ? { ...x, background: bg.key } : x))}
                      className={cn("h-16 rounded-lg border-2 text-xs font-medium text-white transition", editing.background === bg.key ? "border-foreground ring-2 ring-ring" : "border-transparent")}
                      style={{ background: bg.css }}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NavButtons({ back, next, disabled }: { back: (() => void) | null; next: () => void; disabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {back ? (
        <Button variant="ghost" onClick={back}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
      ) : <span />}
      <Button onClick={next} disabled={disabled}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
    </div>
  );
}

function PlanRow({ post, onToggle }: { post: ScheduledPost; onToggle: (v: boolean) => void }) {
  const Icon = post.role === "announcement" ? Megaphone : post.role === "reminder" ? Bell : Zap;
  return (
    <div className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border p-4 transition", !post.enabled && "opacity-50")}>
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <div className="font-medium">{POST_ROLE_LABEL[post.role]}</div>
        <div className="text-xs text-muted-foreground">{formatDate(post.date)}</div>
      </div>
      <Switch checked={post.enabled} onCheckedChange={onToggle} />
    </div>
  );
}

function PostPreview({ post, onEdit }: { post: ScheduledPost; onEdit: () => void }) {
  const { state } = useWorkspace();
  const bg = useMemo(() => BACKGROUND_PRESETS.find((b) => b.key === post.background)?.css ?? BACKGROUND_PRESETS[0].css, [post.background]);

  return (
    <button type="button" onClick={onEdit} className="group block overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square w-full p-5 text-white" style={{ background: bg }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 0%, ${state.organization.primaryColor}99 100%)` }} />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center gap-2">
            <div
              className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg text-xs font-bold"
              style={{ background: state.organization.secondaryColor }}
            >
              {state.organization.logoDataUrl ? (
                <img src={state.organization.logoDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (state.organization.name || "?").slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="truncate text-xs font-semibold drop-shadow">{state.organization.name}</div>
          </div>
          <div>
            <Badge className="mb-2 bg-white/20 text-white hover:bg-white/20">{POST_ROLE_LABEL[post.role]}</Badge>
            <div className="text-2xl font-bold leading-tight drop-shadow">{post.header}</div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-3 text-sm text-muted-foreground">{post.caption}</p>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{formatDate(post.date)}</span>
          <span className="flex items-center gap-1 text-primary opacity-0 transition group-hover:opacity-100"><ImageIcon className="h-3 w-3" /> Edit</span>
        </div>
      </div>
    </button>
  );
}
