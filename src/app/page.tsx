import Link from "next/link";
import Image from "next/image";
import NavbarAuth from "@/components/NavbarAuth";
import BuildGallery from "@/components/BuildGallery";
import BrandLogo from "@/components/BrandLogo";
import { getShowcaseBuilds } from "@/lib/showcase-builds";
import site from "../../content/site.json";

export default async function HomePage() {
  const builds = await getShowcaseBuilds();

  return (
    <>
      <NavbarAuth />

      <section className="border-b border-border bg-gradient-to-b from-brand-50/40 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-brand-600 font-semibold text-xs sm:text-sm mb-4 tracking-[0.25em] uppercase">
                Custom PC Building
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-neutral-950">
                {site.tagline}
              </h1>
              <p className="text-neutral-600 text-base sm:text-lg mb-8 leading-relaxed">
                Hi, I&apos;m {site.builderName}. {site.builderBio}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="text-center px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Get Your Custom PC
                </Link>
                <Link
                  href="/login"
                  className="text-center px-6 py-3.5 border-2 border-neutral-950 hover:bg-neutral-950 hover:text-white text-neutral-950 font-semibold rounded-xl transition-colors"
                >
                  Log in
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden border border-border bg-white shadow-sm">
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
        </div>
      </section>

      <BuildGallery builds={builds} />

      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-border bg-neutral-950 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-brand-400 font-semibold text-xs tracking-[0.25em] uppercase mb-3">
            Get Started
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Ready to build something great?</h2>
          <p className="text-neutral-300 mb-6 text-sm sm:text-base">
            Create a free account, tell us what you need, and we&apos;ll take it from there.
          </p>
          <Link
            href="/signup"
            className="inline-block w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-10 sm:py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo imageClassName="w-64 sm:w-80 h-auto max-h-24 sm:max-h-28" />
          <p className="text-neutral-500 text-sm text-center sm:text-right">
            &copy; {new Date().getFullYear()} {site.siteName} &mdash; {site.contactEmail}
          </p>
        </div>
      </footer>
    </>
  );
}
