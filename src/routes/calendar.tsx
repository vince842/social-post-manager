import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWorkspace, POST_ROLE_LABEL } from "@/lib/workspace-context";
import { formatDate } from "@/lib/campaign-helpers";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { PostCardVisual } from "@/components/post-card";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar · Autopilot" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const { state } = useWorkspace();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);

  const posts = state.campaigns.flatMap((c) =>
    c.posts.filter((p) => p.enabled).map((p) => ({ ...p, campaignName: c.name }))
  );

  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const firstDay = cursor.getDay();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const dayPosts = (day: number) => {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), day).toDateString();
    return posts.filter((p) => new Date(p.date).toDateString() === date);
  };

  const selectedPosts = selected ? posts.filter((p) => new Date(p.date).toDateString() === selected) : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">A bird's-eye view of every scheduled post.</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{monthLabel}</CardTitle>
            <div className="flex gap-1">
              <Button size="icon" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dPosts = dayPosts(day);
              const dateStr = new Date(cursor.getFullYear(), cursor.getMonth(), day).toDateString();
              const isSelected = selected === dateStr;
              return (
                <button
                  key={day}
                  onClick={() => setSelected(dateStr)}
                  className={cn(
                    "min-h-20 rounded-lg border p-1 text-left text-sm transition hover:bg-muted",
                    isSelected && "border-primary bg-primary/5"
                  )}
                >
                  <div className="text-xs">{day}</div>
                  <div className="mt-1 flex flex-col gap-1">
                    {dPosts.slice(0, 2).map((p) => (
                      <div key={p.id} className="overflow-hidden rounded">
                        <PostCardVisual post={p} size="sm" />
                      </div>
                    ))}
                    {dPosts.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">+{dPosts.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">{new Date(selected).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</CardTitle></CardHeader>
          <CardContent>
            {selectedPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {selectedPosts.map((p) => (
                  <li key={p.id} className="space-y-2">
                    <PostCardVisual post={p} />
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">{POST_ROLE_LABEL[p.role]} · {p.campaignName}</div>
                      <div className="text-sm text-muted-foreground">{p.caption}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{formatDate(p.date)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </AppShell>
  );
}
