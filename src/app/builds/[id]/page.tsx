import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import NavbarAuth from "@/components/NavbarAuth";
import { getShowcaseBuildById } from "@/lib/showcase-builds";
import { formatBuiltDate } from "@/lib/types";

interface BuildDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BuildDetailPage({ params }: BuildDetailPageProps) {
  const { id } = await params;
  const build = await getShowcaseBuildById(id);

  if (!build) {
    notFound();
  }

  const builtLabel = formatBuiltDate(build.builtDate);

  return (
    <>
      <NavbarAuth />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/#previous-builds"
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 mb-6"
        >
          ← Back to Previous Builds
        </Link>

        <div className="relative h-56 sm:h-80 lg:h-96 rounded-xl overflow-hidden border border-border bg-neutral-100 mb-8">
          <Image
            src={build.image}
            alt={build.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-border">
              {build.useCase}
            </span>
            {builtLabel && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-border">
                Built {builtLabel}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-3">
            {build.title}
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-neutral-800">
            {build.price}
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">About This Build</h2>
          <div className="prose prose-neutral max-w-none">
            {build.details.split("\n").map((paragraph, i) =>
              paragraph.trim() ? (
                <p key={i} className="text-neutral-700 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ) : null
            )}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Specifications</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {build.specs.map((spec) => (
              <li
                key={spec}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-light border border-border text-sm text-neutral-800"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
                {spec}
              </li>
            ))}
          </ul>
        </section>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-neutral-600 mb-4">
            Want a custom build like this one?
          </p>
          <Link
            href="/build"
            className="inline-block px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors"
          >
            Build My PC
          </Link>
        </div>
      </article>
    </>
  );
}
