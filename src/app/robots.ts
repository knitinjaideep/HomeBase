import type { MetadataRoute } from "next";

/** A private household app has no reason to be indexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
