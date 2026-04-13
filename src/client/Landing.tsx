import { Plus, ArrowRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function Landing() {
  const [joinId, setJoinId] = useState("");

  const handleCreate = useCallback(() => {
    const id = generateId();
    window.location.href = `/?p=${id}`;
  }, []);

  const handleJoin = useCallback(() => {
    const id = joinId.trim();
    if (!id) return;
    window.location.href = `/remote?p=${id}`;
  }, [joinId]);

  return (
    <div className="h-dvh w-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Presentation Remote
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time slides powered by Cloudflare Agents
          </p>
        </div>

        {/* Create */}
        <Button
          className="w-full h-12 text-sm font-semibold gap-2"
          onClick={handleCreate}
        >
          <Plus className="size-4" />
          New Presentation
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-xs uppercase tracking-widest">or join</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Join */}
        <form
          className="flex w-full gap-2"
          onSubmit={(e) => { e.preventDefault(); handleJoin(); }}
        >
          <input
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Enter presentation ID"
            className="flex-1 h-10 bg-card border border-border rounded-md px-3 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            className="size-10 shrink-0"
            disabled={!joinId.trim()}
          >
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
