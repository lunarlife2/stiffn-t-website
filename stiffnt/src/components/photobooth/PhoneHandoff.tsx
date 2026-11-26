"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Panel } from "@/components/Panel";
import { site } from "@/config/site";
import styles from "./Photobooth.module.css";

type State =
  | { step: "uploading" }
  | { step: "ready"; link: string; qr: string }
  | { step: "error"; message: string };

/**
 * "Scan with your phone": as soon as the finished picture is ready it is uploaded (POST /api/photo) and a QR code
 * (made in the browser with `qrcode`, black on white) is shown with the link and Copy, so people can scan straight away.
 * The panel says what happens to the photo (private link, deleted after a day).
 */
export function PhoneHandoff({ blob, kind }: { blob: Blob; kind: "photo" | "strip" }) {
  const [state, setState] = useState<State>({ step: "uploading" });
  const [copied, setCopied] = useState(false);
  const started = useRef<Blob | null>(null);
  const hours = site.photobooth.photoLifetimeHours;

  const upload = async () => {
    setState({ step: "uploading" });
    try {
      const response = await fetch("/api/photo", {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/png", "X-Photo-Kind": kind },
        body: blob,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({ step: "error", message: data.message ?? "We couldn't make a QR code for your photo. Please try again." });
        return;
      }
      const link: string = data.url ?? new URL(data.path, window.location.origin).toString();
      const qr = await QRCode.toDataURL(link, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 480,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setState({ step: "ready", link, qr });
    } catch {
      setState({ step: "error", message: "We couldn't make a QR code. Check your connection and try again." });
    }
  };

  // Starts by itself, once per finished picture.
  useEffect(() => {
    if (started.current === blob) return;
    started.current = blob;
    void upload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the picture changes
  }, [blob]);

  const copy = async () => {
    if (state.step !== "ready") return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Panel radius={24} outline={2} shade={5} className={styles.handoff}>
      <div className={styles.handoffInner} aria-live="polite">
        <h2 className={styles.handoffTitle}>Scan with your phone</h2>

        {state.step === "uploading" && (
          <>
            <div className={`${styles.qr} ${styles.qrWaiting}`}>
              <span>Making your QR code…</span>
            </div>
          </>
        )}

        {state.step === "error" && (
          <>
            <p className={styles.handoffText} role="alert">
              {state.message}
            </p>
            <div className={styles.actions}>
              <Button kind="primary" small onClick={upload}>
                Try again
              </Button>
            </div>
          </>
        )}

        {state.step === "ready" && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
            <img src={state.qr} alt="QR code to open your photo on your phone" width={240} height={240} className={styles.qr} />
            {/* DRAFT COPY */}
            <p className={styles.handoffText}>Point your phone&apos;s camera at the code, then tap the link.</p>
            <div className={styles.actions}>
              <Button kind="secondary" small onClick={copy}>
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </div>
          </>
        )}

        {/* DRAFT COPY */}
        <p className={styles.expires}>
          Your photo is uploaded for this. Only people with the link can see it, and it&apos;s deleted after {hours} hours.
        </p>
      </div>
    </Panel>
  );
}
