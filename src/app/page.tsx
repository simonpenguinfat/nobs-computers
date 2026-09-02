import Link from "next/link";
import Image from "next/image";
import NavbarAuth from "@/components/NavbarAuth";
import BuildGallery from "@/components/BuildGallery";
import { getShowcaseBuilds } from "@/lib/showcase-builds";
import site from "../../content/site.json";

export default async function HomePage() {
  const builds = await getShowcaseBuilds();
  return (
    <>
      <NavbarAuth />

      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-neutral-500 font-medium text-xs sm:text-sm mb-3 tracking-widest uppercase">
                Custom PC Building
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-neutral-900">
                {site.tagline}
              </h1>
              <p className="text-neutral-600 text-base sm:text-lg mb-8 leading-relaxed">
                Hi, I&apos;m {site.builderName}. {site.builderBio}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="text-center px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors"
                >
                  Get Your Custom PC
                </Link>
                <Link
                  href="/login"
                  className="text-center px-6 py-3.5 border border-border hover:bg-surface-light text-neutral-700 font-medium rounded-lg transition-colors"
                >
                  Log in
                </Link>
              </div>
            </div>
            <div className="relative order-1 lg:order-2 h-56 sm:h-72 lg:h-96 rounded-xl overflow-hidden border border-border bg-neutral-50">
              <Image
                src={site.heroImage}
                alt="Custom PC build"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <BuildGallery builds={builds} />

      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-border bg-surface-light">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 text-neutral-900">
            Ready to get started?
          </h2>
          <p className="text-neutral-600 mb-6 text-sm sm:text-base">
            Create a free account, tell us what you need, and we&apos;ll build something great.
          </p>
          <Link
            href="/signup"
            className="inline-block w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4 text-center text-neutral-500 text-sm">
        <p>
          &copy; {new Date().getFullYear()} {site.siteName} &mdash; {site.contactEmail}
        </p>
      </footer>
    </>
  );
}
