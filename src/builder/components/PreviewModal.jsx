import { useEffect, useRef, useState, useCallback } from "react";
import { __ } from '@wordpress/i18n';
import { XMarkIcon, ArrowTopRightOnSquareIcon, ComputerDesktopIcon, DeviceTabletIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { useFormStore } from "../store/useFormStore";

/**
 * PreviewModal
 *
 * Full-screen overlay that renders the live form inside an <iframe> pointing
 * at the full-page preview URL (?flowform_preview=1&id=X&token=Y).
 *
 * PostMessage bridge: whenever draftDesign changes while the modal is open,
 * the current design (draft if drawer is open, otherwise committed) is posted
 * into the iframe so CSS custom properties update in real-time.
 *
 * Validation is always skipped inside the iframe because the PHP preview
 * handler injects previewMode:true into flowformPublicData — no in-modal
 * toggle is needed.
 *
 * Device frames: Desktop (default) | Tablet | Mobile
 */

const DEVICES = [
  { id: "desktop", label: __( 'Desktop', 'wp-flowforms' ), width: "100%",   height: "100%",   icon: <ComputerDesktopIcon width={20} height={20} /> },
  { id: "tablet",  label: __( 'Tablet', 'wp-flowforms' ),  width: "768px",  height: "1024px", icon: <DeviceTabletIcon width={20} height={20} /> },
  { id: "mobile",  label: __( 'Mobile', 'wp-flowforms' ),  width: "390px",  height: "844px",  icon: <DevicePhoneMobileIcon width={20} height={20} /> },
];

export default function PreviewModal({ open, onClose }) {
  const formId      = useFormStore((s) => s.formId);
  const form        = useFormStore((s) => s.form);
  const draftDesign = useFormStore((s) => s.draftDesign);

  const iframeRef  = useRef(null);
  const [device, setDevice]   = useState("desktop");
  const [loaded, setLoaded]   = useState(false);
  const [srcUrl, setSrcUrl]   = useState("");

  // Build the preview URL from the PHP-localised data. A fresh token is
  // generated server-side each time the modal opens (via the initial URL
  // already baked into formflowData.previewUrl).
  useEffect(() => {
    if (open && formId) {
      setSrcUrl(formflowData.previewUrl || "");
      setLoaded(false);
    }
  }, [open, formId]);

  // PostMessage bridge — send design updates into the iframe.
  // We send the effective design: draftDesign when the drawer is open
  // (live preview), otherwise the committed design from the form.
  const postDesign = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const effectiveDesign =
      draftDesign ?? form?.design ?? {};

    iframe.contentWindow.postMessage(
      { type: "DESIGN_UPDATE", design: effectiveDesign },
      "*"
    );
  }, [draftDesign, form]);

  // Post the design whenever it changes and the iframe is loaded.
  useEffect(() => {
    if (open && loaded) {
      postDesign();
    }
  }, [open, loaded, postDesign]);

  // Keyboard: close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const activeDevice = DEVICES.find((d) => d.id === device) ?? DEVICES[0];
  const isConstrained = device !== "desktop";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-white backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={ __( 'Form preview', 'wp-flowforms' ) }
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-between h-14 px-4 bg-white">

        {/* Device switcher */}
        <div className="w-full flex">
          <div className="flex items-center gap-1 bg-gray-200 rounded-md p-0.5">
            {DEVICES.map((d) => (
              <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={`w-8 h-8 flex justify-center items-center rounded text-sm/6 font-medium transition-colors ${
                device === d.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
              }`}
              >
                <span className="sr-only">{d.label}</span>
                {d.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Centre label */}
        <span className="text-sm text-gray-600 font-medium tracking-wide uppercase">
          { __( 'Preview', 'wp-flowforms' ) }
        </span>

        {/* Right actions */}
        <div className="w-full flex justify-end">
          <div className="flex items-center gap-2">
            {/* Open in new tab */}
            {srcUrl && (
              <a
                href={srcUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center rounded-sm cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                title={ __( 'Open in new tab', 'wp-flowforms' ) }
              >
                <ArrowTopRightOnSquareIcon width={20} height={20} className="stroke-2" />
              </a>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-sm cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              aria-label={ __( 'Close preview', 'wp-flowforms' ) }
            >
              <XMarkIcon width={24} height={24} className="stroke-2" />
            </button>
          </div>
        </div>
      </div>

      {/* ── iframe area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 pt-1">
        <div
          className={`relative transition-all duration-300 ring-1 ring-black/20 rounded-2xl overflow-hidden ${
            isConstrained
              ? ""
              : "w-full h-full"
          }`}
          style={
            isConstrained
              ? { width: activeDevice.width, height: activeDevice.height, maxWidth: "100%", maxHeight: "100%" }
              : {}
          }
        >
          {/* Loading shimmer */}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                <span className="text-sm">{ __( 'Loading preview…', 'wp-flowforms' ) }</span>
              </div>
            </div>
          )}

          {srcUrl ? (
            <iframe
              ref={iframeRef}
              src={srcUrl}
              title={ __( 'Form preview', 'wp-flowforms' ) }
              className="w-full h-full border-0"
              style={{ display: loaded ? "block" : "none" }}
              onLoad={() => {
                setLoaded(true);
                // Post design immediately after load
                setTimeout(postDesign, 100);
              }}
              // Allow same-origin + cross-origin postMessage; no scripts restriction
              // so the renderer JS runs normally.
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
              <p className="text-sm text-gray-500">{ __( 'Preview URL not available. Save the form first.', 'wp-flowforms' ) }</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
