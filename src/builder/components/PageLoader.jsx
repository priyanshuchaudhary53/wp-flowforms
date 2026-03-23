import { useEffect, useState } from "react";

/**
 * Controls the PHP-injected #wpff-page-loader overlay.
 *
 * The overlay is rendered by PHP (in admin_head) so it appears before any JS
 * or CSS loads — covering layout shifts and slow network fetches.
 *
 * This component simply dismisses it: after `loading` becomes false it waits
 * 500 ms, plays the fade-up-out CSS animation (400 ms), then removes the node.
 */
export default function PageLoader({ loading }) {
  const [phase, setPhase] = useState("visible");

  useEffect(() => {
    if (!loading && phase === "visible") {
      const delay = setTimeout(() => {
        setPhase("leaving");

        const overlay = document.getElementById("wpff-page-loader");
        if (overlay) overlay.classList.add("wpff-page-loader--leaving");

        const exit = setTimeout(() => {
          setPhase("gone");
          document.getElementById("wpff-page-loader")?.remove();
        }, 400);

        return () => clearTimeout(exit);
      }, 50);

      return () => clearTimeout(delay);
    }
  }, [loading, phase]);

  // This component renders nothing — the overlay lives in the PHP-injected DOM.
  return null;
}