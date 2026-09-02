import Link from "next/link";
import site from "../../../content/site.json";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-brand-600 font-semibold text-xs tracking-[0.25em] uppercase mb-3">
      {children}
    </p>
  );
}

export function HomePromises() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-b border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <SectionLabel>Why No BS</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-950">
            Three promises on every build
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {site.promises.map((item) => (
            <div
              key={item.title}
              className="bg-surface-light border border-border rounded-2xl p-6 sm:p-7"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                NB
              </div>
              <h3 className="font-bold text-lg text-neutral-950 mb-2">{item.title}</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeHowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 bg-surface-light border-b border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-950">
            From questionnaire to finished PC
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {site.howItWorks.map((item) => (
            <div key={item.step} className="relative">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-600 text-white font-bold text-sm mb-4">
                {item.step}
              </span>
              <h3 className="font-bold text-lg text-neutral-950 mb-2">{item.title}</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/build"
            className="inline-block px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors"
          >
            Start your build request
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeServices() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-b border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <SectionLabel>What we build</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-950">
            Custom systems for real use cases
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {site.services.map((service) => (
            <div
              key={service.title}
              className="border border-border rounded-2xl p-6 hover:border-brand-300 transition-colors"
            >
              <h3 className="font-bold text-neutral-950 mb-2">{service.title}</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeWhatYouProvide() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-neutral-950 text-white border-b border-neutral-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <SectionLabel>
            <span className="text-brand-400">Your input</span>
          </SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            What we need from you
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-6">
            The more you tell us upfront, the better we can match parts to your budget.
            None of this requires an account — start the questionnaire anytime.
          </p>
          <Link
            href="/build"
            className="inline-block px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors"
          >
            Build My PC
          </Link>
        </div>
        <ul className="space-y-3">
          {site.whatYouProvide.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200"
            >
              <span className="text-brand-400 font-bold shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomeTesting() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-b border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <SectionLabel>Quality</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-950">
            Tested before handoff
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base mt-3">
            Every build goes through checks before it reaches you — not just &quot;it turns on.&quot;
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {site.testingSteps.map((step, index) => (
            <div key={step.title} className="border border-border rounded-2xl p-5">
              <p className="text-brand-600 font-bold text-sm mb-2">0{index + 1}</p>
              <h3 className="font-bold text-neutral-950 mb-2">{step.title}</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeFAQ() {
  return (
    <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 bg-surface-light border-b border-border">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-950">
            Common questions
          </h2>
        </div>
        <div className="space-y-3">
          {site.faq.map((item) => (
            <details
              key={item.question}
              className="group bg-white border border-border rounded-xl overflow-hidden"
            >
              <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-neutral-950 flex items-center justify-between gap-4">
                {item.question}
                <span className="text-brand-600 text-xl leading-none group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <div className="px-5 pb-4 text-neutral-600 text-sm leading-relaxed border-t border-border pt-3">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeFinalCTA() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-brand-600 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-brand-100 font-semibold text-xs tracking-[0.25em] uppercase mb-3">
          Ready when you are
        </p>
        <h2 className="text-2xl sm:text-4xl font-bold mb-4">
          Tell us what you need. No account to start.
        </h2>
        <p className="text-brand-100 text-sm sm:text-base mb-8 max-w-xl mx-auto">
          Fill out the build questionnaire in a few minutes. We&apos;ll review it, chat with
          you, and only ask for a password so you can track progress.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/build"
            className="px-8 py-4 bg-white text-brand-700 hover:bg-brand-50 font-bold rounded-xl transition-colors"
          >
            Build My PC
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 border-2 border-white/60 hover:bg-white/10 text-white font-semibold rounded-xl transition-colors"
          >
            Log in to track a build
          </Link>
        </div>
      </div>
    </section>
  );
}
