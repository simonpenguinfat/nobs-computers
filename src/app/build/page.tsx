import NavbarAuth from "@/components/NavbarAuth";
import BuildRequestWizard from "@/components/BuildRequestWizard";
import SiteFooter from "@/components/SiteFooter";

export default function BuildPage() {
  return (
    <>
      <NavbarAuth />
      <main className="py-10 sm:py-14 px-4 sm:px-6 bg-gradient-to-b from-brand-50/40 to-white min-h-[calc(100vh-5rem)]">
        <BuildRequestWizard />
      </main>
      <SiteFooter />
    </>
  );
}
