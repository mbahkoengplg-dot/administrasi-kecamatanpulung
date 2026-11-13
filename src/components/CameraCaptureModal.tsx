import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  persyaratanNama: string;
  onCapture: (fileData: { fileName: string; fileSize: string; fileUrl: string }) => void;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  persyaratanNama,
  onCapture,
  onClose,
}) => {
  const [mode, setMode] = useState<'camera' | 'upload'>('upload');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'Kamera tidak dapat diakses atau izin belum diberikan. Anda dapat memilih unggah file foto dari galeri/folder.'
      );
      setMode('upload');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode]);

  // Compress image to JPEG ~100-250KB using canvas for fast Google Drive / GAS upload
  const compressImage = (dataUrl: string, fileName: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Compress to JPEG with 0.76 quality (sharp text, lightweight payload)
      const compressedUrl = canvas.toDataURL('image/jpeg', 0.76);
      const approxBytes = Math.round((compressedUrl.length * 3) / 4);
      const sizeStr = approxBytes > 1024 * 1024
        ? `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(approxBytes / 1024)} KB`;

      const normalizedName = fileName.replace(/\.[^.]+$/, '') + '.jpg';
      setCapturedImage(compressedUrl);
      setFileInfo({ name: normalizedName, size: sizeStr });
    };
    img.src = dataUrl;
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    compressImage(dataUrl, `Foto_${Date.now()}.jpg`);
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      if (file.size > 1.5 * 1024 * 1024) {
        setCameraError('Ukuran PDF terlalu besar (maksimal 1.5 MB). Silakan kompres PDF atau unggah foto berkas.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const sizeStr = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
        setCameraError(null);
        setCapturedImage(result);
        setFileInfo({ name: file.name, size: sizeStr });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      compressImage(result, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (capturedImage && fileInfo) {
      onCapture({
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        fileUrl: capturedImage,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Unggah Dokumen Berkas</h3>
            <p className="text-xs text-slate-500 truncate max-w-[260px]">{persyaratanNama}</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Method Selector */}
          {!capturedImage && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                Pilih File / Galeri
              </button>
              <button
                type="button"
                onClick={() => setMode('camera')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'camera'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                Buka Kamera
              </button>
            </div>
          )}

          {cameraError && (
            <div className="p-3 mb-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Camera View */}
          {mode === 'camera' && !capturedImage && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <button
                  type="button"
                  onClick={takePhoto}
                  className="w-14 h-14 rounded-full bg-white border-4 border-emerald-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Camera className="w-6 h-6 text-emerald-800" />
                </button>
              </div>
            </div>
          )}

          {/* Upload View */}
          {mode === 'upload' && !capturedImage && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Klik untuk memilih foto atau berkas</p>
              <p className="text-xs text-slate-500 mt-1">
                Format JPG, PNG, atau PDF (kompresi otomatis &le; 1 MB)
              </p>
            </div>
          )}

          {/* Preview of Captured / Selected Image */}
          {capturedImage && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 max-h-56 flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Pratinjau berkas"
                  className="w-full h-full object-contain"
                />
              </div>

              {fileInfo && (
                <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 rounded-lg text-slate-600">
                  <span className="truncate max-w-[200px] font-medium">{fileInfo.name}</span>
                  <span className="font-mono text-emerald-700 font-semibold">{fileInfo.size}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    setFileInfo(null);
                    if (mode === 'camera') startCamera();
                  }}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Foto Ulang
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Gunakan Berkas Ini
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
