"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Panel } from "@/components/Panel";
import { site } from "@/config/site";
import styles from "./Photobooth.module.css";

type State =
  | { step: "consent" }
  | { step: "uploading" }
  | { step: "ready"; link: string; qr: string }
  | { step: "error"; message: string };

/**
 * "Get it on my phone": asks first, then uploads the finished picture (POST /api/photo), then shows a QR code
 * (made in the browser with `qrcode`, black on white) and the link with Copy. Nothing is uploaded before
 * "Upload and show QR" is pressed.
 */
export function PhoneHandoff({ blob, onClose }: { blob: Blob; onClose: () => void }) {
  const [state, setState] = useState<State>({ step: "consent" });
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const hours = site.photobooth.photoLifetimeHours;

  // Each step's panel takes the focus, so keyboard and screen reader users land on it.
  useEffect(() => {
    box.current?.focus();
  }, [state.step]);

  const upload = async () => {
    setState({ step: "uploading" });
    try {
      const response = await fetch("/api/photo", {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/png" },
        body: blob,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({ step: "error", message: data.message ?? "We couldn't upload your photo. Please try again." });
        return;
      }
      const link = new URL(data.path, window.location.origin).toString();
      const qr = await QRCode.toDataURL(link, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 480,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setState({ step: "ready", link, qr });
    } catch {
      setState({ step: "error", message: "We couldn't upload your photo. Check your connection and try again." });
    }
  };

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
      <div ref={box} tabIndex={-1} className={styles.handoffInner} aria-live="polite">
        {state.step === "consent" && (
          <>
            <h2 className={styles.handoffTitle}>Get it on your phone</h2>
            <p className={styles.handoffText}>
              This uploads your photo so your phone can open it. It&apos;s private (only people with the link can see
              it) and it&apos;s deleted automatically after {hours} hours.
            </p>
            <div className={styles.actions}>
              <Button kind="primary" onClick={upload}>
                Upload and show QR
              </Button>
              <Button kind="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {state.step === "uploading" && <p className={styles.handoffText}>Uploading your photo…</p>}

        {state.step === "error" && (
          <>
            <p className={styles.handoffText} role="alert">
              {state.message}
            </p>
            <div className={styles.actions}>
              <Button kind="primary" onClick={upload}>
                Try again
              </Button>
              <Button kind="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}

        {state.step === "ready" && (
          <>
            <h2 className={styles.handoffTitle}>Scan with your phone</h2>
            <div className={styles.qrRow}>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
              <img src={state.qr} alt="QR code to open your photo on your phone" width={240} height={240} className={styles.qr} />
              <div className={styles.qrWords}>
                {/* DRAFT COPY */}
                <p className={styles.handoffText}>Point your phone&apos;s camera at the code, then tap the link.</p>
                <p className={styles.link}>{state.link}</p>
                <div className={styles.actions}>
                  <Button kind="secondary" small onClick={copy}>
                    {copied ? "Copied!" : "Copy link"}
                  </Button>
                  <Button kind="tertiary" small onClick={onClose}>
                    Close
                  </Button>
                </div>
                <p className={styles.expires}>This link expires in {hours} hours</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
