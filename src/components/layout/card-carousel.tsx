import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/button";
import { SectionTitle } from "@/components/typography/typography";

/**
 * Horizontally scrolling card rail with chevron controls
 * (Design Foundation "Operational Summary").
 */
export function CardCarousel({
  title,
  scrollStep = 300,
  className,
  children,
}: {
  title: string;
  scrollStep?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) =>
    scrollerRef.current?.scrollBy({ left: dir * scrollStep, behavior: "smooth" });

  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>{title}</SectionTitle>
        <div className="flex items-center gap-1.5">
          <IconButton aria-label="Scroll left" onClick={() => scrollBy(-1)}>
            <ChevronLeft />
          </IconButton>
          <IconButton aria-label="Scroll right" onClick={() => scrollBy(1)}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>
      <div ref={scrollerRef} className={cn("scrollbar-none flex gap-3 overflow-x-auto pb-2")}>
        {children}
      </div>
    </section>
  );
}
