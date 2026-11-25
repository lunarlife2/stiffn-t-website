import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ButtonLink } from "@/components/Button";
import { Panel } from "@/components/Panel";
import { StevenSticker } from "@/components/Art";
import { PhotoActions } from "@/components/photobooth/PhotoActions";
import { photoUploadedAt, timeLeft } from "@/lib/photoStore";
import styles from "./page.module.css";

/** Only people with the link can see it: never in search engines. */
export const metadata: Metadata = {
  title: "Your Stiffn't photo",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function PhotoPage({ params }: PageProps<"/p/[id]">) {
  return (
    <div className={styles.page}>
      <Suspense fallback={<p className={styles.loading}>Finding your photo…</p>}>
        <Photo params={params} />
      </Suspense>
    </div>
  );
}

async function Photo({ params }: { params: PageProps<"/p/[id]">["params"] }) {
  const { id } = await params;
  await connection();
  const uploadedAt = await photoUploadedAt(id);
  const left = uploadedAt ? timeLeft(uploadedAt) : null;
  if (!left) return <GoneToSleep />;

  return (
    <div className={styles.layout}>
      <Panel radius={24} outline={2} shade={5} fill="white" className={styles.photoPanel}>
        {/* eslint-disable-next-line @next/next/no-img-element -- private photo served by our own route */}
        <img src={`/api/photo/${id}`} alt="Your photo with Steven" className={styles.photo} />
      </Panel>
      <div className={styles.side}>
        {/* DRAFT COPY */}
        <h1 className={styles.title}>Your photo with Steven</h1>
        <PhotoActions src={`/api/photo/${id}`} downloadHref={`/api/photo/${id}?download=1`} />
        {/* DRAFT COPY */}
        <p className={styles.expiry}>
          This photo is deleted in <strong>{left}</strong>.
        </p>
        <ButtonLink kind="secondary" href="/photobooth">
          Make your own
        </ButtonLink>
      </div>
    </div>
  );
}

/** Expired or wrong link. */
function GoneToSleep() {
  return (
    <Panel radius={24} outline={2} shade={5} className={styles.gone}>
      <div className={styles.goneArt}>
        <StevenSticker src="/images/steven/steven-loafing.png" size={220} alt="Steven, asleep" />
      </div>
      <div className={styles.goneWords}>
        <h1 className={styles.goneTitle}>This photo has gone back to sleep 💤</h1>
        {/* DRAFT COPY */}
        <p className={styles.goneText}>Photos only stay for a day, or this link isn&apos;t quite right. Take a new one!</p>
        <ButtonLink href="/photobooth" wide>
          Go to the Photobooth
        </ButtonLink>
      </div>
    </Panel>
  );
}
