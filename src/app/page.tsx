import Link from "next/link";
import Image from "next/image";
import NavbarAuth from "@/components/NavbarAuth";
import BuildGallery from "@/components/BuildGallery";
import SiteFooter from "@/components/SiteFooter";
import {
  HomeFAQ,
  HomeFinalCTA,
  HomeHowItWorks,
  HomePromises,
  HomeServices,
  HomeTesting,
  HomeWhatYouProvide,
} from "@/components/home/HomeSections";
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
                Custom PC Building · Vancouver
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-neutral-950">
                {site.tagline}
              </h1>
              <p className="text-neutral-600 text-base sm:text-lg mb-8 leading-relaxed">
                {site.intro}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/build"
                  className="text-center px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Build My PC
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-center px-6 py-3.5 border-2 border-neutral-950 hover:bg-neutral-950 hover:text-white text-neutral-950 font-semibold rounded-xl transition-colors"
                >
                  How it works
                </Link>
              </div>
              <p className="text-neutral-500 text-sm mt-4">
                No account required to start — tell us what you need first.
              </p>
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

      <HomePromises />
      <HomeHowItWorks />
      <HomeServices />
      <BuildGallery builds={builds} />
      <HomeWhatYouProvide />
      <HomeTesting />
      <HomeFAQ />
      <HomeFinalCTA />
      <SiteFooter />
    </>
  );
}
