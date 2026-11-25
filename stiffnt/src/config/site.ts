/**
 * Every link you fill in lives here, and nowhere else.
 * - downloadUrl: every "Download for Mac" button and the footer's Download link.
 * - a social link left empty → its icon is hidden in the footer (and "Follow us" too, if both are empty).
 */
export const site = {
  name: "Stiffn't",
  studio: "Silencio Studio",
  downloadUrl: "https://testflight.apple.com/join/EPH1D269",
  photobooth: {
    /** How long a "Get it on my phone" photo lives before it's deleted. */
    photoLifetimeHours: 24,
    /** Biggest upload accepted. Vercel Route Handlers take at most 4.5 MB per request, so 4. */
    maxUploadMB: 4,
    /** Uploads allowed per visitor (IP) per hour; counted in server memory, best effort. */
    uploadsPerHour: 10,
  },
  social: {
    instagram: "https://www.instagram.com/stiffnt.app?jplx=MnVodGk3NG5hYWVi&utm_source=qr",
    tiktok: "https://www.tiktok.com/@stiffnt.app?_r=1&_t=ZS-9BhAl6IERaj",
  },
};

export type SocialKey = keyof typeof site.social;
