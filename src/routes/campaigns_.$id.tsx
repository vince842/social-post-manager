import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Calendar as CalIcon, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useWorkspace, BACKGROUND_PRESETS, POST_ROLE_LABEL, type ScheduledPost } from "@/lib/workspace-context";
import { formatDate } from "@/lib/campaign-helpers";
import { AppShell } from "@/components/app-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/campaigns_/$id")({
  head: () => ({ meta: [{ title: "Edit Campaign · Autopilot" }] }),
  component: EditCampaign,
});

function EditCampaign() {
  const { id } = Route.useParams();
  const { state, updateCampaign } = useWorkspace();
  const navigate = useNavigate();
  const campaign = state.campaigns.find((c) => c.id === id);

  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [eventDate, setEventDate] = useState<Date | undefined>(
    campaign ? parseISO(campaign.eventDate) : undefined,
  );
  const [posts, setPosts] = useState<ScheduledPost[]>(campaign?.posts ?? []);

  if (!campaign) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-2xl font-bold">Campaign not found</h1>
          <Button asChild variant="outline"><Link to="/campaigns"><ArrowLeft className="mr-1 h-4 w-4" /> Back to campaigns</Link></Button>
        </div>
      </AppShell>
    );
  }

  const updatePost = (pid: string, patch: Partial<ScheduledPost>) =>
    setPosts((arr) => arr.map((p) => (p.id === pid ? { ...p, ...patch } : p)));

  const save = () => {
    if (!eventDate) return;
    updateCampaign(campaign.id, {
      name: name.trim(),
      description: description.trim(),
      eventDate: eventDate.toISOString(),
      posts,
    });
    toast.success("Campaign updated");
    navigate({ to: "/campaigns" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/campaigns"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link></Button>
          <Badge variant="secondary">{campaign.status}</Badge>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="space-y-5 p-6">
            <div>
              <h1 className="text-2xl font-bold">Edit campaign</h1>
              <p className="text-sm text-muted-foreground">Tweak the details and the scheduled posts.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cname">Campaign name</Label>
              <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cdesc">Description</Label>
              <Textarea id="cdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Scheduled posts</h2>
          {posts.map((p) => (
            <Card key={p.id} className={cn("rounded-2xl transition", !p.enabled && "opacity-60")}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{POST_ROLE_LABEL[p.role]}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(p.date)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`en-${p.id}`} className="text-xs">Enabled</Label>
                    <Switch id={`en-${p.id}`} checked={p.enabled} onCheckedChange={(v) => updatePost(p.id, { enabled: v })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Header</Label>
                  <Input value={p.header} onChange={(e) => updatePost(p.id, { header: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea rows={3} value={p.caption} onChange={(e) => updatePost(p.id, { caption: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Background</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {BACKGROUND_PRESETS.map((bg) => (
                      <button
                        key={bg.key}
                        type="button"
                        onClick={() => updatePost(p.id, { background: bg.key, templateId: undefined })}
                        className={cn("h-14 rounded-lg border-2 text-xs font-medium text-white transition", p.background === bg.key && !p.templateId ? "border-foreground ring-2 ring-ring" : "border-transparent")}
                        style={{ background: bg.css }}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>
                {state.templates.length > 0 && (
                  <div className="space-y-2">
                    <Label>Or pick a brand template</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {state.templates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => updatePost(p.id, { templateId: t.id })}
                          className={cn("overflow-hidden rounded-lg border-2 transition", p.templateId === t.id ? "border-foreground ring-2 ring-ring" : "border-transparent")}
                        >
                          <img src={t.dataUrl} alt={t.name} className="aspect-[3/2] w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              updateCampaign(campaign.id, { status: "draft" });
              toast.message("Moved to draft");
            }}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Move to draft
          </Button>
          <Button onClick={save} disabled={!name.trim() || !description.trim() || !eventDate}>
            <Save className="mr-1 h-4 w-4" /> Save changes
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
