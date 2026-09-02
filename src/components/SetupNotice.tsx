import Link from "next/link";

export default function SetupNotice() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm">
      <p className="font-medium text-amber-800 mb-1">Setup required</p>
      <p className="text-neutral-600">
        Follow <strong>SETUP.md</strong> to connect Supabase before login will work.
        Steps 3–6 take about 10 minutes.
      </p>
    </div>
  );
}
