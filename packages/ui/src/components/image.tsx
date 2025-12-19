import { Image as UnpicImage } from "@unpic/react";
import { cn } from "@learnbase/ui/lib/utils";

type UnpicImageProps = React.ComponentProps<typeof UnpicImage>;

type ImageProps = UnpicImageProps & {
  className?: string;
};

function isCustomCdn(src: string | undefined): boolean {
  if (!src) return false;
  return (
    src.includes("X-Amz-Signature") ||
    src.includes("x-amz-signature") ||
    src.includes("cdn.uselearnbase.com")
  );
}

export function Image({ src, className, alt, ...props }: ImageProps) {
  if (isCustomCdn(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return <UnpicImage src={src} alt={alt} className={className} {...props} />;
}
