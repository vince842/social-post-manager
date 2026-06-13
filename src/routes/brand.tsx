import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, Trash2, ImagePlus, Tag, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWorkspace, ORG_TYPE_LABEL, TONE_LABEL, type Template, type BrandImage } from "@/lib/workspace-context";
import { AppShell } from "@/components/app-shell";
import { fileTo3x2DataUrl, fileToSquareDataUrl } from "@/lib/image-resize";
import { toast } from "sonner";


export const Route = createFileRoute("/brand")({
  head: () => ({ meta: [{ title: "Brand Assets · Autopilot" }] }),
  component: Brand,
});

function Brand() {
  const { state, addTemplate, removeTemplate, addBrandImage, updateBrandImage, removeBrandImage } = useWorkspace();
  const org = state.organization;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        const dataUrl = await fileTo3x2DataUrl(file);
        const template: Template = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Template",
          dataUrl,
          createdAt: new Date().toISOString(),
        };
        addTemplate(template);
      }
      toast.success("Template added — auto-sized to 3:2");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't process that image");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Brand Assets</h1>
            <p className="text-sm text-muted-foreground">The colors, logo, templates and voice we use across every campaign.</p>
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

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Templates</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload background images for your posts. We'll auto-size them to 3:2.
              </p>
            </div>
            <Button size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> {busy ? "Processing…" : "Load template"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </CardHeader>
          <CardContent>
            {state.templates.length === 0 ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 py-10 text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">Drop or click to load a template</span>
                <span className="text-xs">PNG, JPG — any size, auto-cropped to 3:2</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {state.templates.map((t) => (
                  <div key={t.id} className="group overflow-hidden rounded-xl border">
                    <div className="relative aspect-[3/2] w-full bg-muted">
                      <img src={t.dataUrl} alt={t.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeTemplate(t.id)}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-destructive opacity-0 shadow transition group-hover:opacity-100"
                        aria-label="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="truncate p-2 text-xs font-medium">{t.name}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <BrandImagesSection
          images={state.brandImages}
          onAdd={addBrandImage}
          onUpdate={updateBrandImage}
          onRemove={removeBrandImage}
        />
      </div>
    </AppShell>
  );
}

function BrandImagesSection({
  images,
  onAdd,
  onUpdate,
  onRemove,
}: {
  images: BrandImage[];
  onAdd: (img: BrandImage) => void;
  onUpdate: (id: string, patch: Partial<BrandImage>) => void;
  onRemove: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingTags, setPendingTags] = useState("");

  const allTags = Array.from(new Set(images.flatMap((i) => i.tags))).sort();
  const [filter, setFilter] = useState<string>("");
  const filtered = filter ? images.filter((i) => i.tags.includes(filter)) : images;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const tags = pendingTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        const dataUrl = await fileToSquareDataUrl(file);
        onAdd({
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Photo",
          dataUrl,
          tags,
          createdAt: new Date().toISOString(),
        });
      }
      toast.success(tags.length ? `Photo added with tags: ${tags.join(", ")}` : "Photo added — add tags to find it later");
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
    <Card className="rounded-2xl">
      <CardHeader className="space-y-3">
        <div className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Brand images</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Photos you can blend into any post. Tag on upload so you can reuse them by topic.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Tags (comma-separated, e.g. team, event, behind-the-scenes)"
            value={pendingTags}
            onChange={(e) => setPendingTags(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 h-4 w-4" /> {busy ? "Uploading…" : "Upload photo"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilter("")}
              className={`rounded-full border px-2 py-0.5 text-xs ${!filter ? "bg-foreground text-background" : "bg-background"}`}
            >
              All ({images.length})
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(filter === t ? "" : t)}
                className={`rounded-full border px-2 py-0.5 text-xs ${filter === t ? "bg-foreground text-background" : "bg-background"}`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 py-10 text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm font-medium">Upload your first brand photo</span>
            <span className="text-xs">PNG, JPG — auto-cropped to a square</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((img) => (
              <BrandImageCard key={img.id} img={img} onUpdate={onUpdate} onRemove={onRemove} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BrandImageCard({
  img,
  onUpdate,
  onRemove,
}: {
  img: BrandImage;
  onUpdate: (id: string, patch: Partial<BrandImage>) => void;
  onRemove: (id: string) => void;
}) {
  const [newTag, setNewTag] = useState("");
  const addTag = () => {
    const v = newTag.trim().toLowerCase();
    if (!v) return;
    if (img.tags.includes(v)) {
      setNewTag("");
      return;
    }
    onUpdate(img.id, { tags: [...img.tags, v] });
    setNewTag("");
  };
  return (
    <div className="group overflow-hidden rounded-xl border">
      <div className="relative aspect-square w-full bg-muted">
        <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onRemove(img.id)}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-destructive opacity-0 shadow transition group-hover:opacity-100"
          aria-label="Delete photo"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2 p-2">
        <div className="truncate text-xs font-medium">{img.name}</div>
        <div className="flex flex-wrap gap-1">
          {img.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px]">
              #{t}
              <button
                type="button"
                onClick={() => onUpdate(img.id, { tags: img.tags.filter((x) => x !== t) })}
                aria-label={`Remove tag ${t}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag"
            className="h-7 text-xs"
          />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={addTag}>
            <Tag className="h-3 w-3" />
          </Button>
        </div>
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
