"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    // ZXing internally calls setPhotoOptions (ImageCapture API) which fails on
    // some devices. It's a known bug in the library — the scan still works.
    // We suppress the unhandled rejection so it doesn't pollute the console.
    function suppressPhotoOptionsError(e: PromiseRejectionEvent) {
      if (e.reason?.message?.includes("setPhotoOptions")) {
        e.preventDefault();
      }
    }
    window.addEventListener("unhandledrejection", suppressPhotoOptionsError);

    let cancelled = false;
    let stream: MediaStream | null = null;

    async function startScanner() {
      try {
        // Get stream manually to avoid ZXing's internal setPhotoOptions call
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);

        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;

        const codeReader = new BrowserMultiFormatReader();
        const controls = await codeReader.decodeFromStream(
          stream,
          videoRef.current,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              controls.stop();
              onScan(result.getText());
            }
            void err;
          }
        );

        controlsRef.current = controls;
      } catch (e) {
        if (!cancelled) {
          setError("No se pudo acceder a la cámara. Verificá los permisos.");
          console.error(e);
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      window.removeEventListener("unhandledrejection", suppressPhotoOptionsError);
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-background rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="font-semibold text-sm">Escanear código de barras</p>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              controlsRef.current?.stop();
              onClose();
            }}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Camera feed */}
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Viewfinder overlay */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-28 border-2 border-white/80 rounded-lg relative">
                {/* Corner accents */}
                <span className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr" />
                <span className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl" />
                <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br" />
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="px-4 py-3 text-center">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : scanning ? (
            <p className="text-sm text-muted-foreground">
              Apuntá la cámara al código de barras
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Iniciando cámara...</p>
          )}
        </div>
      </div>
    </div>
  );
}
