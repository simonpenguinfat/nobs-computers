"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toBuildShowcase, USE_CASES, formatBuiltDate } from "@/lib/types";
import type { ShowcaseBuildRow } from "@/lib/types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AdminBuildManager() {
  const [builds, setBuilds] = useState<ShowcaseBuildRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [price, setPrice] = useState("");
  const [builtDate, setBuiltDate] = useState("");
  const [useCase, setUseCase] = useState("");
  const [specsText, setSpecsText] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadBuilds() {
      const { data, error: fetchError } = await supabase
        .from("showcase_builds")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setBuilds(data ?? []);
      setLoaded(true);
    }

    loadBuilds();
  }, [supabase]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDetails("");
    setPrice("");
    setBuiltDate("");
    setUseCase("");
    setSpecsText("");
    setDisplayOrder("0");
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEdit(build: ShowcaseBuildRow) {
    setEditingId(build.id);
    setTitle(build.title);
    setDescription(build.description);
    setDetails(build.details ?? "");
    setPrice(build.price || build.budget || "");
    setBuiltDate(build.built_date ?? "");
    setUseCase(build.use_case);
    setSpecsText(build.specs.join("\n"));
    setDisplayOrder(String(build.display_order));
    setImageFile(null);
    setImagePreview(build.image_url || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("build-images")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("build-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const specs = specsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      let imageUrl = imagePreview ?? "";

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        throw new Error("Please upload an image for this build.");
      }

      const payload = {
        title,
        description,
        details: details || description,
        price,
        built_date: builtDate || null,
        use_case: useCase,
        specs,
        image_url: imageUrl,
        display_order: parseInt(displayOrder, 10) || 0,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { data, error: updateError } = await supabase
          .from("showcase_builds")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);
        setBuilds((prev) =>
          prev.map((b) => (b.id === editingId ? (data as ShowcaseBuildRow) : b))
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("showcase_builds")
          .insert(payload)
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);
        setBuilds((prev) => [...prev, data as ShowcaseBuildRow]);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }

    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this build from the gallery?")) return;

    setLoading(true);
    setError("");

    const { error: deleteError } = await supabase
      .from("showcase_builds")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    setBuilds((prev) => prev.filter((b) => b.id !== id));
    if (editingId === id) resetForm();
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      {!loaded && (
        <p className="text-sm text-neutral-500">Loading past builds...</p>
      )}
      <div className="bg-white border border-border rounded-xl p-5 sm:p-6">
        <h2 className="font-semibold text-lg text-neutral-900 mb-1">
          {editingId ? "Edit Past Build" : "Add Past Build"}
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          These appear in the &quot;Previous Builds&quot; section on your homepage.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-700">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-700">
                Price (display text)
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. $1,450"
                required
                className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-700">
                Date Built (optional)
              </label>
              <input
                type="date"
                value={builtDate}
                onChange={(e) => setBuiltDate(e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-neutral-700">
              Short Summary
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={2}
              placeholder="Brief text shown on the gallery card..."
              className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-neutral-700">
              Full Details
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={6}
              placeholder="Longer description shown on the build detail page. Use blank lines between paragraphs."
              className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400 resize-none"
            />
            <p className="text-xs text-neutral-500 mt-1">
              If left empty, the short summary is used on the detail page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-700">
                Use Case
              </label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                required
                className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
              >
                <option value="">Select...</option>
                {USE_CASES.map((uc) => (
                  <option key={uc} value={uc}>
                    {uc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-700">
                Display Order (lower = first)
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                min="0"
                className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-neutral-700">
              Specs (one per line)
            </label>
            <textarea
              value={specsText}
              onChange={(e) => setSpecsText(e.target.value)}
              placeholder={"RTX 4070\nRyzen 7 7800X3D\n32GB DDR5"}
              rows={4}
              className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-neutral-700">
              Photo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full text-sm text-neutral-600"
            />
            <p className="text-xs text-neutral-500 mt-1">JPG, PNG, or WebP. Max 5 MB.</p>
            {imagePreview && (
              <div className="relative mt-3 h-40 w-full max-w-xs rounded-lg overflow-hidden border border-border">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {loading ? "Saving..." : editingId ? "Save Changes" : "Add Build"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-border text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="font-semibold text-neutral-900 mb-3">
          Current Gallery ({builds.length})
        </h2>
        {builds.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-6 text-center">
            <p className="text-neutral-500 text-sm">
              No builds added yet. The homepage will show the default examples until you add one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {builds.map((build) => {
              const showcase = toBuildShowcase(build);
              return (
                <div
                  key={build.id}
                  className="bg-white border border-border rounded-xl overflow-hidden"
                >
                  <div className="relative h-36 bg-neutral-100">
                    {build.image_url ? (
                      <Image
                        src={build.image_url}
                        alt={build.title}
                        fill
                        className="object-cover"
                        sizes="400px"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-neutral-900">{showcase.title}</h3>
                    <p className="text-sm text-neutral-600 mt-0.5">{showcase.price}</p>
                    {showcase.builtDate && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Built {formatBuiltDate(showcase.builtDate)}
                      </p>
                    )}
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                      {showcase.description}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => startEdit(build)}
                        className="flex-1 py-2 border border-border rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(build.id)}
                        className="flex-1 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
