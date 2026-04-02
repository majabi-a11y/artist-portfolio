import { useEffect, useRef } from 'react';

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = el.querySelectorAll('.reveal');
    children.forEach((child) => {
      (child as HTMLElement).classList.add('reveal-hidden');
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('reveal-visible');
            (entry.target as HTMLElement).classList.remove('reveal-hidden');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
