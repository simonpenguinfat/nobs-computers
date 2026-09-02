"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  clearBuildRequestDraft,
  loadBuildRequestDraft,
} from "@/lib/build-request-draft";
import { ensureBuyerProfile } from "@/lib/build-requests";
import { formatBuildRequestError } from "@/lib/build-request-errors";

export default function PendingDraftSubmit() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function submitPendingDraft() {
      const draft = loadBuildRequestDraft();
      if (!draft) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await ensureBuyerProfile(
        supabase,
        user.id,
        user.email ?? "",
        user.user_metadata?.full_name ?? ""
      );

      const payload = {
        use_case: draft.use_case,
        budget: draft.budget,
        existing_parts: draft.existing_parts,
        preferences: draft.preferences,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("build_requests")
        .select("id")
        .eq("buyer_id", user.id)
        .in("status", ["pending", "in_progress", "completed", "not_received"])
        .maybeSingle();

      let error: string | null = null;

      if (existing) {
        const { error: updateError } = await supabase
          .from("build_requests")
          .update(payload)
          .eq("id", existing.id);
        error = updateError?.message ?? null;
      } else {
        const { error: insertError } = await supabase.from("build_requests").insert({
          ...payload,
          buyer_id: user.id,
          status: "pending",
        });
        error = insertError?.message ?? null;
      }

      if (error) {
        setMessage(formatBuildRequestError(error));
        return;
      }

      clearBuildRequestDraft();
      router.refresh();
    }

    submitPendingDraft();
  }, [supabase, router]);

  if (!message) return null;

  return <p className="text-red-600 text-sm">{message}</p>;
}
