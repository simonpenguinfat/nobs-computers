import BuildCard from "./BuildCard";
import type { BuildShowcase } from "@/lib/types";

interface BuildGalleryProps {
  builds: BuildShowcase[];
}

export default function BuildGallery({ builds }: BuildGalleryProps) {
  return (
    <section id="previous-builds" className="py-12 sm:py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-neutral-900">
            Previous Builds
          </h2>
          <p className="text-neutral-500 max-w-xl mx-auto text-sm sm:text-base">
            Every system is custom-tailored. Here are a few recent projects.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {builds.map((build) => (
            <BuildCard key={build.id} build={build} />
          ))}
        </div>
      </div>
    </section>
  );
}
