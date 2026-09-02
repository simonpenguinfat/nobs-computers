import Link from "next/link";
import Image from "next/image";
import type { BuildShowcase } from "@/lib/types";
import { formatBuiltDate } from "@/lib/types";

interface BuildCardProps {
  build: BuildShowcase;
}

export default function BuildCard({ build }: BuildCardProps) {
  const builtLabel = formatBuiltDate(build.builtDate);

  return (
    <Link
      href={`/builds/${build.id}`}
      className="group block rounded-xl overflow-hidden bg-surface-card border border-border hover:border-brand-300 transition-all duration-300 hover:shadow-md hover:shadow-brand-100/50"
    >
      <div className="relative h-44 sm:h-48 overflow-hidden bg-neutral-100">
        <Image
          src={build.image}
          alt={build.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/95 text-neutral-800 border border-border">
            {build.useCase}
          </span>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base sm:text-lg leading-tight text-neutral-900 group-hover:text-brand-600 transition-colors">
            {build.title}
          </h3>
          <span className="text-neutral-700 font-semibold text-sm whitespace-nowrap">
            {build.price}
          </span>
        </div>
        {builtLabel && (
          <p className="text-xs text-neutral-500 mb-2">Built {builtLabel}</p>
        )}
        <p className="text-neutral-500 text-sm mb-4 line-clamp-2">{build.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {build.specs.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="text-xs px-2 py-0.5 rounded-md bg-surface-light text-neutral-600 border border-border"
            >
              {spec}
            </span>
          ))}
          {build.specs.length > 3 && (
            <span className="text-xs px-2 py-0.5 text-neutral-500">
              +{build.specs.length - 3} more
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-brand-600">View details →</p>
      </div>
    </Link>
  );
}
