import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HomeScope",
    short_name: "HomeScope",
    description: "A private home-buying decision tracker for your household.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9f8f5",
    theme_color: "#f9f8f5",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
