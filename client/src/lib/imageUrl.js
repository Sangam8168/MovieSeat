// Accepts either a complete image URL or a bare path, and falls back to a
// placeholder when there's no image.

// Neutral grey placeholder, inlined so it never 404s
export const POSTER_PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
       <rect width="100%" height="100%" fill="#1f2937"/>
       <text x="50%" y="50%" fill="#6b7280" font-family="sans-serif"
             font-size="22" text-anchor="middle" dominant-baseline="middle">
         No image
       </text>
     </svg>`
  );

/**
 * IMDb/Amazon image URLs carry a transform chain before the extension, e.g.
 *   ..._V1_QL75_UX380_CR0,1,380,562_.jpg   ->  380px wide, JPEG quality 75
 * Rewriting it requests a larger, better-quality render of the same image.
 * Any non-Amazon URL is returned untouched.
 */
export const resizeImage = (url, width = 1280) => {
  if (!url || typeof url !== "string") return url;
  if (!/m\.media-amazon\.com|ia\.media-imdb\.com/.test(url)) return url;

  return url.replace(/\._V1_.*?\.(jpg|jpeg|png)$/i, `._V1_FMjpg_UX${width}_.$1`);
};

export const buildImageUrl = (path, base = "") => {
  if (!path || path === "N/A") return POSTER_PLACEHOLDER;

  // Already a complete URL or inline image
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;

  // Bare path - prefix the configured base URL
  return `${base}${path}`;
};

export default buildImageUrl;
