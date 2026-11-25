"use client";

import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/Button";

/**
 * Download + Share (Web Share API, shown only where the browser can share files) for a finished photo,
 * plus the iPhone hint. Used on /p/<id> and on the Photobooth result on phones.
 */
export function PhotoActions({
  src,
  downloadHref,
  fileName = "stiffnt-photobooth.png",
}: {
  /** Where to fetch the picture for sharing (a URL or a blob: URL). */
  src: string;
  /** What Download opens (a URL that sends the file as an attachment, or the same blob: URL). */
  downloadHref: string;
  fileName?: string;
}) {
  const [canShare, setCanShare] = useState(false);
  const [isIPhone, setIsIPhone] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Read once after the page loads in the browser; the server doesn't know the device.
    const probe = new File([new Uint8Array(1)], fileName, { type: "image/png" });
    const share = typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] });
    const iPhone = /iPhone|iPod/.test(navigator.userAgent);
    const frame = requestAnimationFrame(() => {
      setCanShare(share);
      setIsIPhone(iPhone);
    });
    return () => cancelAnimationFrame(frame);
  }, [fileName]);

  const share = async () => {
    try {
      const blob = await (await fetch(src)).blob();
      const file = new File([blob], fileName, { type: blob.type || "image/png" });
      await navigator.share({ files: [file], title: "My photo with Steven" });
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") setMessage("Sharing didn't work here. Try Download instead.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <ButtonLink href={downloadHref} download={fileName}>
          Download
        </ButtonLink>
        {canShare && (
          <Button kind="secondary" onClick={share}>
            Share
          </Button>
        )}
      </div>
      {isIPhone && (
        <p style={{ margin: 0, fontSize: "var(--type-subhead)", color: "var(--shadow-400)" }}>
          Or press and hold the photo to save it to Photos
        </p>
      )}
      <p role="status" style={{ margin: 0, color: "var(--red-400)" }}>
        {message}
      </p>
    </div>
  );
}
