import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Calendar as CalIcon, Save, Trash2, Rocket, Upload, ImageOff, Sparkles, Loader2 } from "lucide-react";
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
import { useWorkspace, BACKGROUND_PRESETS, POST_ROLE_LABEL, type ScheduledPost, type BrandImage, type Template } from "@/lib/workspace-context";
import { formatDate } from "@/lib/campaign-helpers";
import { AppShell } from "@/components/app-shell";
import { fileToSquareDataUrl } from "@/lib/image-resize";
import { generateMergedImages } from "@/lib/ai-merge.functions";
import { toast } from "sonner";


export const Route = createFileRoute("/campaigns_/$id")({
  head: () => ({ meta: [{ title: "Edit Campaign · Autopilot" }] }),
  component: EditCampaign,
});

function EditCampaign() {
  const { id } = Route.useParams();
  const { state, updateCampaign, addBrandImage } = useWorkspace();

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
                  <Label htmlFor={`dt-${p.id}`}>Date &amp; time</Label>
                  <Input
                    id={`dt-${p.id}`}
                    type="datetime-local"
                    value={format(parseISO(p.date), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      const d = new Date(v);
                      if (!isNaN(d.getTime())) updatePost(p.id, { date: d.toISOString() });
                    }}
                    className="sm:w-72"
                  />
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

                <BrandImagePicker
                  brandImages={state.brandImages}
                  selectedId={p.imageId}
                  onSelect={(imageId) => updatePost(p.id, { imageId })}
                  onUpload={addBrandImage}
                />

                <AIMergePanel
                  post={p}
                  brandImages={state.brandImages}
                  templates={state.templates}
                  onAddImage={addBrandImage}
                  onSelect={(imageId) => updatePost(p.id, { imageId })}
                />
              </CardContent>

            </Card>
          ))}
        </div>

        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          {campaign.status === "scheduled" ? (
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
          ) : (
            <Button
              variant="ghost"
              className="text-primary"
              onClick={() => {
                updateCampaign(campaign.id, { status: "scheduled" });
                toast.success("Moved to scheduled");
              }}
            >
              <Rocket className="mr-1 h-4 w-4" /> Move to scheduled
            </Button>
          )}
          <Button onClick={save} disabled={!name.trim() || !description.trim() || !eventDate}>
            <Save className="mr-1 h-4 w-4" /> Save changes
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function BrandImagePicker({
  brandImages,
  selectedId,
  onSelect,
  onUpload,
}: {
  brandImages: BrandImage[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  onUpload: (img: BrandImage) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingTags, setPendingTags] = useState("");
  const [filter, setFilter] = useState<string>("");

  const allTags = Array.from(new Set(brandImages.flatMap((i) => i.tags))).sort();
  const visible = filter ? brandImages.filter((i) => i.tags.includes(filter)) : brandImages;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const tags = pendingTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    setBusy(true);
    try {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("That's not an image");
        return;
      }
      const dataUrl = await fileToSquareDataUrl(file);
      const img: BrandImage = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Photo",
        dataUrl,
        tags,
        createdAt: new Date().toISOString(),
      };
      onUpload(img);
      onSelect(img.id);
      toast.success("Added to your brand image folder");
      setPendingTags("");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't process that image");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="m-0">Blend in a brand photo</Label>
        {selectedId && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onSelect(undefined)}>
            <ImageOff className="mr-1 h-3 w-3" /> Remove photo
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Tags for the upload (comma-separated)"
          value={pendingTags}
          onChange={(e) => setPendingTags(e.target.value)}
          className="flex-1"
        />
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload className="mr-1 h-3 w-3" /> {busy ? "Uploading…" : "Upload photo"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {brandImages.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No brand photos yet — upload one above. It will be saved to your brand image folder for reuse.
        </p>
      ) : (
        <>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setFilter("")}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px]",
                  !filter ? "bg-foreground text-background" : "bg-background"
                )}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilter(filter === t ? "" : t)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px]",
                    filter === t ? "bg-foreground text-background" : "bg-background"
                  )}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {visible.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => onSelect(img.id === selectedId ? undefined : img.id)}
                className={cn(
                  "overflow-hidden rounded-lg border-2 transition",
                  selectedId === img.id ? "border-foreground ring-2 ring-ring" : "border-transparent"
                )}
                title={img.tags.length ? `#${img.tags.join(" #")}` : img.name}
              >
                <img src={img.dataUrl} alt={img.name} className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AIMergePanel({
  post,
  brandImages,
  templates,
  onAddImage,
  onSelect,
}: {
  post: ScheduledPost;
  brandImages: BrandImage[];
  templates: Template[];
  onAddImage: (img: BrandImage) => void;
  onSelect: (id: string) => void;
}) {
  const generate = useServerFn(generateMergedImages);
  const allTags = Array.from(new Set(brandImages.flatMap((i) => i.tags))).sort();
  const [tag, setTag] = useState<string>(allTags[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);

  const matching = tag ? brandImages.filter((i) => i.tags.includes(tag)) : [];
  const template = templates.find((t) => t.id === post.templateId);

  const run = async () => {
    if (matching.length === 0) {
      toast.error("No brand photos with that tag");
      return;
    }
    const sources: string[] = [];
    if (template) sources.push(template.dataUrl);
    sources.push(...matching.slice(0, 3).map((m) => m.dataUrl));

    const prompt = [
      `Create a square social media post visual that merges the provided ${template ? "brand template and " : ""}brand photo${matching.length > 1 ? "s" : ""}.`,
      `Theme: "${post.header}". Caption context: "${post.caption}".`,
      `The result should feel on-brand, cohesive, and ready to post.`,
    ].join(" ");

    setBusy(true);
    setVariants([]);
    try {
      const res = await generate({ data: { prompt, images: sources, count: 3 } });
      setVariants(res.images);
      if (res.images.length < 3) toast.message(`Generated ${res.images.length} of 3 — try again for more options`);
    } catch (e) {
      console.error(e);
      toast.error("AI merge failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const choose = (dataUrl: string, idx: number) => {
    const img: BrandImage = {
      id: crypto.randomUUID(),
      name: `AI merge · ${tag || "untagged"} · ${idx + 1}`,
      dataUrl,
      tags: [tag, "ai-merge"].filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    onAddImage(img);
    onSelect(img.id);
    toast.success("Merged photo saved to your brand folder");
    setVariants([]);
  };

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <Label className="m-0">AI merge with template</Label>
      </div>

      {allTags.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Tag some brand photos first, then you can merge them with your template using AI.
        </p>
      ) : (
        <>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Pick a tag to merge with the template</p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px]",
                    tag === t ? "bg-foreground text-background" : "bg-background",
                  )}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          <Button type="button" size="sm" onClick={run} disabled={busy || !tag}>
            {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {busy ? "Generating 3 options…" : "Generate 3 AI merges"}
          </Button>

          {variants.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Pick your favourite — it will be saved to your brand folder</p>
              <div className="grid grid-cols-3 gap-2">
                {variants.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => choose(src, i)}
                    className="group overflow-hidden rounded-lg border-2 border-transparent transition hover:border-foreground"
                  >
                    <img src={src} alt={`AI merge option ${i + 1}`} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


