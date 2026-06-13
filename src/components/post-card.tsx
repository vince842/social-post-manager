import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { BACKGROUND_PRESETS, POST_ROLE_LABEL, useWorkspace, type ScheduledPost } from "@/lib/workspace-context";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: ScheduledPost;
  size?: "sm" | "md";
  className?: string;
}

export function PostCardVisual({ post, size = "md", className }: PostCardProps) {
  const { state } = useWorkspace();
  const bg = useMemo(
    () => BACKGROUND_PRESETS.find((b) => b.key === post.background)?.css ?? BACKGROUND_PRESETS[0].css,
    [post.background]
  );
  const template = post.templateId ? state.templates.find((t) => t.id === post.templateId) : undefined;
  const brandImage = post.imageId ? state.brandImages.find((b) => b.id === post.imageId) : undefined;

  return (
    <div
      className={cn("relative aspect-square w-full overflow-hidden rounded-xl text-white", size === "sm" ? "p-3" : "p-5", className)}
      style={!template ? { background: bg } : undefined}
    >
      {template && (
        <img src={template.dataUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {brandImage && (
        <img
          src={brandImage.dataUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-90"
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${state.organization.primaryColor}33 0%, ${state.organization.primaryColor}AA 100%)` }}
      />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "grid shrink-0 place-items-center overflow-hidden rounded-lg font-bold",
              size === "sm" ? "h-5 w-5 text-[8px]" : "h-8 w-8 text-xs"
            )}
            style={{ background: state.organization.secondaryColor }}
          >
            {state.organization.logoDataUrl ? (
              <img src={state.organization.logoDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (state.organization.name || "?").slice(0, 2).toUpperCase()
            )}
          </div>
          {size !== "sm" && (
            <div className="truncate text-xs font-semibold drop-shadow">{state.organization.name}</div>
          )}
        </div>
        <div>
          <Badge className={cn("bg-white/20 text-white hover:bg-white/20", size === "sm" ? "mb-1 text-[9px] px-1.5 py-0" : "mb-2")}>
            {POST_ROLE_LABEL[post.role]}
          </Badge>
          <div className={cn("font-bold leading-tight drop-shadow", size === "sm" ? "text-sm line-clamp-2" : "text-2xl")}>
            {post.header}
          </div>
        </div>
      </div>
    </div>
  );
}
