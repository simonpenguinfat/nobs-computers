import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import site from "../../content/site.json";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border py-10 sm:py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <BrandLogo imageClassName="w-64 sm:w-80 h-auto max-h-24 sm:max-h-28" />
        <div className="text-neutral-500 text-sm text-center sm:text-right space-y-1.5">
          <p>&copy; {new Date().getFullYear()} {site.siteName}</p>
          <p className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1">
            <a
              href={`mailto:${site.contactEmail}`}
              className="hover:text-brand-600 transition-colors"
            >
              {site.contactEmail}
            </a>
            <span className="text-neutral-300 hidden sm:inline" aria-hidden="true">
              |
            </span>
            <a
              href={site.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-600 transition-colors"
            >
              YouTube
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function SiteFooterDark() {
  return (
    <footer className="border-t border-neutral-800 py-10 px-4 bg-neutral-950 text-neutral-400">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <BrandLogo href="/" imageClassName="w-48 sm:w-56 h-auto max-h-16 brightness-0 invert opacity-90" />
        <div className="text-sm text-center sm:text-right space-y-1.5">
          <p className="text-neutral-500">&copy; {new Date().getFullYear()} {site.siteName}</p>
          <p className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1">
            <a href={`mailto:${site.contactEmail}`} className="hover:text-brand-400 transition-colors">
              {site.contactEmail}
            </a>
            <span className="text-neutral-700 hidden sm:inline">|</span>
            <a
              href={site.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-400 transition-colors"
            >
              YouTube
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
