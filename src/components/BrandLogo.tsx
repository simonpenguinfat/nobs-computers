import Image from "next/image";
import Link from "next/link";
import site from "../../content/site.json";

interface BrandLogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
}

export default function BrandLogo({
  href = "/",
  className = "",
  imageClassName = "w-44 sm:w-56 h-auto max-h-14 sm:max-h-16",
}: BrandLogoProps) {
  const content = (
    <Image
      src="/logo.png"
      alt={site.siteName}
      width={861}
      height={195}
      priority
      className={imageClassName}
    />
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={`inline-flex items-center shrink-0 ${className}`}>
      {content}
    </Link>
  );
}

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`leading-none ${className}`}>
      <span className="block text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
        NO BS
      </span>
      <span className="block text-[0.65rem] sm:text-xs font-semibold tracking-[0.35em] text-brand-600 mt-1">
        COMPUTERS
      </span>
    </div>
  );
}
