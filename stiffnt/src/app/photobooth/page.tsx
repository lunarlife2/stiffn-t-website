import type { Metadata } from "next";
import { SectionTitle } from "@/components/Art";
import { Photobooth } from "@/components/photobooth/Photobooth";
import { site } from "@/config/site";

export const metadata: Metadata = {
  // DRAFT COPY
  title: "Photobooth",
  // DRAFT COPY
  description: "Take a photo with Steven the cat. Add his crown, glasses, bow or fairy wings, then download it as a PNG.",
};

export default function PhotoboothPage() {
  return (
    <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "40px 20px 72px" }}>
      <SectionTitle as="h1">Photobooth</SectionTitle>
      {/* DRAFT COPY */}
      <p style={{ maxWidth: "62ch", margin: "10px 0 6px", fontSize: "var(--type-title2)" }}>
        Strike a pose with Steven. Add stickers, drag them where you like, then take a single photo or a strip of three.
      </p>
      {/* DRAFT COPY */}
      <p style={{ margin: "0 0 24px", color: "var(--shadow-400)" }}>
        Your photos stay on your device. If you choose &apos;Get it on my phone&apos;, the photo is uploaded privately and
        deleted after {site.photobooth.photoLifetimeHours} hours.
      </p>
      <Photobooth />
    </div>
  );
}
