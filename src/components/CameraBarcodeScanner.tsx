import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, AlertCircle, Volume2, VolumeX, Zap, Check } from 'lucide-react';
import { playScanBeep } from '../utils/audio';

interface Props {
  onScan: (barcode: string) => void;
  isActive?: boolean;
  soundEnabled?: boolean;
  continuous?: boolean; // if true, stays open and scans multiple; if false, scans once
}

export const CameraBarcodeScanner: React.FC<Props> = ({
  onScan,
  isActive = true,
  soundEnabled = true,
  continuous = true
}) => {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useRef(`barcode-reader-${Math.random().toString(36).substring(2, 9)}`).current;
  const lastScanTimeRef = useRef<number>(0);

  // Get available video input devices
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then(devices => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera ("environment") if available
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMsg('Kamera topilmadi. Qurilmangizda kamera mavjudligini tekshiring.');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('Camera error:', err);
        setErrorMsg('Kameraga ulanib bo‘lmadi yoki ruxsat berilmadi. Brauzer sozlamalarida kameraga ruxsat bering.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Start / Stop Scanner
  useEffect(() => {
    if (!isActive || !selectedCameraId) return;

    let html5QrCode: Html5Qrcode;

    const startCamera = async () => {
      try {
        setErrorMsg(null);
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {
            // ignore
          }
        }

        html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.min(Math.floor(minEdge * 0.85), 320),
              height: Math.min(Math.floor(minEdge * 0.55), 200)
            };
          },
          aspectRatio: 1.333333,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        };

        await html5QrCode.start(
          selectedCameraId,
          config,
          (decodedText) => {
            const now = Date.now();
            // Debounce same code within 1.2s to prevent multiple triggers
            if (decodedText === lastScannedCode && now - lastScanTimeRef.current < 1500) {
              return;
            }

            lastScanTimeRef.current = now;
            setLastScannedCode(decodedText);

            if (soundEnabled) {
              playScanBeep(true);
            }

            onScan(decodedText.trim());

            // Clear green highlight after 1s
            setTimeout(() => {
              setLastScannedCode(null);
            }, 1200);

            if (!continuous) {
              stopCamera();
            }
          },
          () => {
            // Parsing errors on unreadable frames - safely ignore
          }
        );

        setIsScanning(true);

        // Check torch capability
        try {
          const videoTrack = (html5QrCode as any).getRunningTrackCameraCapabilities?.();
          if (videoTrack?.torchFeature?.()?.isSupported?.()) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }

      } catch (err: any) {
        console.error('Failed to start scanner:', err);
        setErrorMsg('Kamerani ishga tushirib bo‘lmadi: ' + (err.message || 'Ruxsat berilmagan'));
        setIsScanning(false);
      }
    };

    const stopCamera = async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Error stopping camera:', e);
        }
        setIsScanning(false);
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isActive, selectedCameraId, soundEnabled, continuous]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const newStatus = !torchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: newStatus }]
      });
      setTorchOn(newStatus);
    } catch (e) {
      console.warn('Torch not supported', e);
    }
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-white shadow-inner flex flex-col items-center justify-center min-h-[260px]">

      {/* Video Viewport Container */}
      <div
        id={containerId}
        className="w-full h-full min-h-[260px] max-h-[360px] overflow-hidden flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
      />

      {/* Camera Overlay Elements */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">

          {/* Target Reticle Box */}
          <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center">
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm"></div>

            {/* Animated Laser Scanning Line */}
            <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-[0_0_8px_#34d399]"></div>

            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-300/80 bg-slate-900/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
              Shtrix-kodni romga to‘g‘rilang
            </span>
          </div>

          {/* Success Flash Toast */}
          {lastScannedCode && (
            <div className="absolute bottom-14 px-4 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
              <Check className="w-4 h-4" />
              <span>O‘qildi: {lastScannedCode}</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Controls Bar */}
      <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-auto z-10 px-2">
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-slate-200 border border-slate-700/60 shadow-sm">
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span>Kamera Skaneri Faol</span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              type="button"
              className={`p-2 rounded-full text-xs font-semibold backdrop-blur-md border transition ${
                torchOn
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              title="Fonar / Flash"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}

          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              type="button"
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md text-xs font-semibold transition"
              title="Kamerani almashtirish (Old/Orqa)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Kameraga ulanishda muammo</h4>
            <p className="text-xs text-slate-400 max-w-xs">{errorMsg}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            type="button"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
          >
            Qayta urinish
          </button>
        </div>
      )}
    </div>
  );
};
