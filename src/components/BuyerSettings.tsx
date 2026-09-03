"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "./LogoutButton";

interface BuyerSettingsProps {
  userId: string;
  email: string;
  fullName: string;
  memberSince: string;
  onNameUpdated: (name: string) => void;
}

export default function BuyerSettings({
  userId,
  email,
  fullName: initialName,
  memberSince,
  onNameUpdated,
}: BuyerSettingsProps) {
  const [fullName, setFullName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      onNameUpdated(trimmed);
    }

    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-neutral-900">Account Settings</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Your profile information for this account.
        </p>
      </div>

      <dl className="space-y-4">
        <div>
          <dt className="text-xs text-neutral-500 mb-0.5">Email</dt>
          <dd className="text-sm font-medium text-neutral-900 break-all">{email}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500 mb-0.5">Account type</dt>
          <dd className="text-sm font-medium text-neutral-900">Buyer</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500 mb-0.5">Member since</dt>
          <dd className="text-sm font-medium text-neutral-900">
            {new Date(memberSince).toLocaleDateString("en-CA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </dd>
        </div>
      </dl>

      <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-border">
        <div>
          <label
            htmlFor="display-name"
            className="block text-sm font-medium mb-1.5 text-neutral-700"
          >
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setSaved(false);
            }}
            placeholder="Your name"
            maxLength={100}
            className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Shown in chat and on your build request.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {saved && (
          <p className="text-green-700 text-sm">Name updated successfully.</p>
        )}

        <button
          type="submit"
          disabled={saving || fullName.trim() === initialName.trim()}
          className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {saving ? "Saving..." : "Save Name"}
        </button>
      </form>

      <div className="pt-2 border-t border-border">
        <LogoutButton className="w-full py-2.5 border border-border text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium transition-colors" />
      </div>
    </div>
  );
}
