import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useWorkspace } from "@/lib/workspace-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Autopilot — Social Campaigns Made Simple" },
      { name: "description", content: "Generate and schedule social media campaigns for your business, club, or non-profit in minutes." },
    ],
  }),
  component: Index,
});

function Index() {
  const { state } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: state.onboarded ? "/dashboard" : "/onboarding", replace: true });
  }, [state.onboarded, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-muted-foreground">Loading…</div>
    </div>
  );
}
