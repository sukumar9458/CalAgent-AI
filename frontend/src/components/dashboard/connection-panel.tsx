"use client";

import { ConnectionInfo } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { Calendar } from "lucide-react";
import { Button } from "../ui/button";
import {
  connectCalendar,
  fetchCalendarConnection,
} from "@/lib/connections";

export default function ConnectionsPanel({ sessionToken }: { sessionToken: string }) {
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleLoadCalendarConnection = useCallback(async () => {
    setLoading(true);
    try {
      setConnection(await fetchCalendarConnection(sessionToken));
    } catch {
      console.log("failed to load calendar connection");
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    handleLoadCalendarConnection();
  }, [handleLoadCalendarConnection]);

  async function handleCalendarConnect() {
    setBusy(true);
    try {
      await connectCalendar(sessionToken);
    } catch {
      console.log("failed to connect");
    } finally {
      setBusy(false);
    }
  }

  const connected = connection?.status === "connected";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          CONNECTIONS
        </p>
        <span className="size-2 rounded-full bg-emerald-500 shadow-xs" />
      </div>

      {loading || !connection ? (
        <Skeleton className="h-14 w-full rounded-xl" />
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-2xs transition-all hover:border-neutral-300">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200/60 bg-neutral-50 text-neutral-600">
            <Calendar className="size-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-tight text-neutral-900">
              {connection.label}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              {connected ? "Synced 2m ago" : "Not connected"}
            </p>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="h-7 rounded-lg border border-neutral-200/80 bg-neutral-100/80 px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
            disabled={busy}
            onClick={handleCalendarConnect}
          >
            Manage
          </Button>
        </div>
      )}
    </div>
  );
}
