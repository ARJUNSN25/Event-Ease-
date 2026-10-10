/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Event,
  EventStats,
  CheckInResult,
  Registration,
  listEvents,
  getStats,
  checkIn,
  undoCheckIn,
  listParticipants,
  subscribeToStore,
} from '../store';
import { getCategoryInfo } from '../utils/categories';
import { playSuccessBeep, playAlertBeep } from '../audio';
import { useToast } from './Toast';
import {
  Camera,
  CameraOff,
  QrCode,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ArrowRight,
  Clock,
  History,
  RotateCcw,
  Search,
  Users,
  Sparkles,
  Check,
  X,
  FileUp,
  Smartphone,
  ImageIcon,
  FlipHorizontal,
  ClipboardPaste,
} from 'lucide-react';

interface CheckInViewProps {
  selectedEventId: string | null;
  onSelectEventId: (id: string) => void;
  onNavigateToOrganizer: () => void;
}

type ScanMode = 'camera' | 'upload' | 'manual';

type ScanPanelState =
  | { type: 'ready' }
  | {
      type: 'success';
      name: string;
      email?: string;
      checkedInAt: string;
      code: string;
      eventName?: string;
    }
  | {
      type: 'duplicate';
      name: string;
      email?: string;
      originalCheckedInAt: string;
      code: string;
      eventName?: string;
    }
  | {
      type: 'invalid';
      code: string;
    };

interface RecentCheckIn {
  code: string;
  name: string;
  email?: string;
  time: string;
  status: 'SUCCESS' | 'DUPLICATE';
}

/**
 * Extract pass code from scanned text (handles URLs, raw codes, JSON)
 */
function extractCodeFromText(text: string): string {
  const clean = text.trim();
  try {
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const url = new URL(clean);
      const codeParam = url.searchParams.get('code');
      if (codeParam) return codeParam.toUpperCase();
    }
  } catch {
    // Ignore URL parse error
  }

  // Check for EVT<id>-<suffix>
  const match = clean.match(/EVT[0-9]+-[A-HJ-NP-Z2-9]{6}/i);
  if (match) {
    return match[0].toUpperCase();
  }

  return clean.toUpperCase();
}

/**
 * Robust image QR code decoder:
 * 1. Native BarcodeDetector (instant GPU acceleration in modern Chromium/Android/Safari)
 * 2. Fallback to Html5Qrcode.scanFile
 */
async function decodeQrFromImageFile(file: File): Promise<string> {
  // Method 1: Native BarcodeDetector
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => { detect: (bitmap: ImageBitmap) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const detections = await detector.detect(bitmap);
      if (detections && detections.length > 0 && detections[0].rawValue) {
        return extractCodeFromText(detections[0].rawValue);
      }
    } catch (e) {
      console.warn('BarcodeDetector error, falling back to Html5Qrcode:', e);
    }
  }

  // Method 2: Html5Qrcode.scanFile
  let scratchpad = document.getElementById('qr-file-scratchpad');
  if (!scratchpad) {
    scratchpad = document.createElement('div');
    scratchpad.id = 'qr-file-scratchpad';
    scratchpad.style.position = 'fixed';
    scratchpad.style.left = '-9999px';
    scratchpad.style.width = '300px';
    scratchpad.style.height = '300px';
    document.body.appendChild(scratchpad);
  }

  const html5QrCode = new Html5Qrcode('qr-file-scratchpad', false);
  try {
    const rawResult = await html5QrCode.scanFile(file, false);
    try {
      html5QrCode.clear();
    } catch {
      // Ignore clear errors
    }
    if (rawResult) {
      return extractCodeFromText(rawResult);
    }
  } catch (err: unknown) {
    try {
      html5QrCode.clear();
    } catch {
      // Ignore clear errors
    }
    throw err;
  }

  throw new Error('No QR code detected in this image. Please ensure the QR pass is clear and well-lit.');
}

export function CheckInView({
  selectedEventId,
  onSelectEventId,
  onNavigateToOrganizer,
}: CheckInViewProps) {
  const { showToast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({
    registered: 0,
    attended: 0,
    remaining: 0,
    capacity: 0,
  });

  // Active Scanner Mode: camera, upload, or manual
  const [scanMode, setScanMode] = useState<ScanMode>('camera');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraLabel, setCameraLabel] = useState<string>('Laptop Webcam');
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isStartingLockRef = useRef<boolean>(false);
  const scanIntervalRef = useRef<number | null>(null);
  const isScanningFrameRef = useRef<boolean>(false);
  const barcodeDetectorRef = useRef<any>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // File Upload State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Result Panel State
  const [panelState, setPanelState] = useState<ScanPanelState>({ type: 'ready' });
  const resetTimerRef = useRef<number | null>(null);

  // Manual Code Input
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Live Attendee Roster on the Desk
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState<'all' | 'pending' | 'checkedIn'>('all');
  const [participants, setParticipants] = useState<Registration[]>([]);

  // Recent scans log for desk
  const [recentScans, setRecentScans] = useState<RecentCheckIn[]>([]);

  // Throttle scanner: ignore repeated reads of same code within 3 seconds
  const lastScanRef = useRef<{ code: string; timestamp: number } | null>(null);

  // Refresh events & stats
  const refreshData = useCallback(() => {
    const all = listEvents();
    setEvents(all);

    let activeId = selectedEventId;
    if (!activeId || !all.some((e) => e.id === activeId)) {
      if (all.length > 0) {
        activeId = all[0].id;
        onSelectEventId(all[0].id);
      } else {
        activeId = null;
      }
    }

    if (activeId) {
      setStats(getStats(activeId));
      setParticipants(
        listParticipants(activeId, {
          search: rosterSearch,
          status: rosterFilter,
        })
      );
    } else {
      setStats({ registered: 0, attended: 0, remaining: 0, capacity: 0 });
      setParticipants([]);
    }
  }, [selectedEventId, onSelectEventId, rosterSearch, rosterFilter]);

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToStore(() => {
      refreshData();
    });
    return unsubscribe;
  }, [refreshData]);

  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Format time nicely
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return 'just now';
    }
  };

  // Process a code from scanner, image upload, or manual input
  const processCode = useCallback(
    (rawCode: string, origin: 'camera' | 'upload' | 'manual' | 'roster' = 'manual') => {
      const code = extractCodeFromText(rawCode);
      if (!code) return;

      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      const result: CheckInResult = checkIn(code);

      if (result.status === 'SUCCESS') {
        playSuccessBeep();
        setPanelState({
          type: 'success',
          name: result.name,
          email: result.email,
          checkedInAt: result.checkedInAt,
          code: result.code,
          eventName: result.eventName,
        });

        setRecentScans((prev) => [
          {
            code: result.code,
            name: result.name,
            email: result.email,
            time: formatTime(result.checkedInAt),
            status: 'SUCCESS',
          },
          ...prev.slice(0, 5),
        ]);

        showToast(
          `${result.name} checked in successfully!`,
          'success'
        );
      } else if (result.status === 'DUPLICATE') {
        playAlertBeep();
        setPanelState({
          type: 'duplicate',
          name: result.name,
          email: result.email,
          originalCheckedInAt: result.originalCheckedInAt,
          code: result.code,
          eventName: result.eventName,
        });

        setRecentScans((prev) => [
          {
            code: result.code,
            name: result.name,
            email: result.email,
            time: formatTime(result.originalCheckedInAt),
            status: 'DUPLICATE',
          },
          ...prev.slice(0, 5),
        ]);

        showToast(
          `Already checked in at ${formatTime(result.originalCheckedInAt)}`,
          'warning'
        );
      } else {
        // INVALID
        playAlertBeep();
        setPanelState({
          type: 'invalid',
          code: result.code,
        });

        showToast(`Pass code "${result.code}" not found.`, 'error');
      }

      // Keep result panel visible for 8 seconds before resetting to Ready
      resetTimerRef.current = window.setTimeout(() => {
        setPanelState({ type: 'ready' });
      }, 8000);
    },
    [showToast]
  );

  // Handle scanned QR code with 3-second throttle for duplicate reads
  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      const clean = extractCodeFromText(decodedText);
      const now = Date.now();
      if (
        lastScanRef.current &&
        lastScanRef.current.code === clean &&
        now - lastScanRef.current.timestamp < 3000
      ) {
        // Ignore repeated read of same pass within 3s
        return;
      }
      lastScanRef.current = { code: clean, timestamp: now };
      processCode(clean, 'camera');
    },
    [processCode]
  );

  // Start continuous QR scanner loop from live video feed
  const startScanLoop = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    scanIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.paused || isScanningFrameRef.current) {
        return;
      }

      isScanningFrameRef.current = true;
      try {
        // Native BarcodeDetector (instant GPU acceleration in modern Chrome/Edge)
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            if (!barcodeDetectorRef.current) {
              const BD = (window as any).BarcodeDetector;
              barcodeDetectorRef.current = new BD({ formats: ['qr_code'] });
            }
            const detections = await barcodeDetectorRef.current.detect(video);
            if (detections && detections.length > 0 && detections[0].rawValue) {
              handleScanSuccess(detections[0].rawValue);
              return;
            }
          } catch {
            // Ignore single frame detect error
          }
        }

        // Fallback: draw frame onto offscreen canvas and decode via image decoder
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          if (!scanCanvasRef.current) {
            scanCanvasRef.current = document.createElement('canvas');
          }
          const canvas = scanCanvasRef.current;
          const targetWidth = Math.min(video.videoWidth, 480);
          const targetHeight = Math.min(video.videoHeight, 480);
          if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
          }
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            canvas.toBlob(
              async (blob) => {
                if (blob) {
                  try {
                    const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
                    const code = await decodeQrFromImageFile(file);
                    if (code) {
                      handleScanSuccess(code);
                    }
                  } catch {
                    // Frame had no readable QR code
                  }
                }
              },
              'image/jpeg',
              0.8
            );
          }
        }
      } catch {
        // Ignore frame error
      } finally {
        isScanningFrameRef.current = false;
      }
    }, 250);
  }, [handleScanSuccess]);

  // Stop Camera & release all media tracks (Requirement 5)
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    isScanningFrameRef.current = false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop warning:', e);
        }
      });
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setIsStartingCamera(false);
    isStartingLockRef.current = false;
  }, []);

  // Start Camera (Requirements 1, 2, 3, 4, 8, 9)
  const startCamera = async (targetDeviceId?: string) => {
    // Requirement 9: Prevent multiple camera streams from opening simultaneously
    if (isStartingLockRef.current || isStartingCamera) {
      return;
    }
    isStartingLockRef.current = true;
    setIsStartingCamera(true);
    setCameraError(null);

    // Stop any previously running stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Requirement 8: Check for insecure connection and browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isInsecure =
        typeof window !== 'undefined' &&
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';

      const errorMsg = isInsecure
        ? 'Insecure connection: Camera access is blocked by browsers over HTTP. Please use HTTPS or localhost.'
        : 'Camera not supported: The MediaDevices API is not available in this browser. Please use a modern browser or "Upload Pass Image".';
      setCameraError(errorMsg);
      setIsStartingCamera(false);
      isStartingLockRef.current = false;
      return;
    }

    try {
      // Requirement 1: Use navigator.mediaDevices.getUserMedia() to access the laptop webcam.
      // Use video: true as default instead of forcing facingMode: "environment".
      const constraints: MediaStreamConstraints = {
        video: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : true,
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (subErr: any) {
        // If exact targetDeviceId failed or was overconstrained, fallback to video: true
        if (targetDeviceId && (subErr.name === 'OverconstrainedError' || subErr.name === 'ConstraintNotSatisfiedError')) {
          console.warn('Target camera overconstrained, falling back to video: true');
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } else {
          throw subErr;
        }
      }

      mediaStreamRef.current = stream;

      // Requirement 2: Attach the returned stream using videoRef.current.srcObject = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Requirement 3: Ensure video element has autoPlay, playsInline, and muted enabled
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;

        // Requirement 4: Call video.play() after attaching stream and handle playback errors
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error (handled):', playErr);
        }
      }

      // Query available video devices for Flip Camera support
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoInputs);

        const currentTrack = stream.getVideoTracks()[0];
        if (currentTrack) {
          const settings = currentTrack.getSettings?.();
          const activeDeviceId = settings?.deviceId || targetDeviceId || (videoInputs[0]?.deviceId ?? null);
          setCurrentDeviceId(activeDeviceId);

          const trackLabel = currentTrack.label || '';
          if (trackLabel) {
            setCameraLabel(trackLabel);
          } else if (videoInputs.length > 1) {
            setCameraLabel(`Camera 1 of ${videoInputs.length}`);
          } else {
            setCameraLabel('Laptop Webcam');
          }
        }
      } catch {
        // Ignore device enumeration issues
      }

      setIsCameraActive(true);
      showToast('Camera started successfully.');

      // Start continuous scanning loop for QR passes
      startScanLoop();
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      // Requirement 8: Clear, user-friendly error messages
      let message = 'Could not access camera. Please check permissions or use "Upload Pass Image".';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission denied: Please allow camera access in your browser site permissions and click Start Camera again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera found: No video input device was detected on this laptop. Please connect a webcam or use "Upload Pass Image".';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera already in use: Another application (Zoom, Teams, etc.) or browser tab is using your webcam. Please close it and retry.';
      } else if (err.name === 'OverconstrainedError') {
        message = 'Camera resolution or constraint not supported by your device.';
      } else if (err.name === 'SecurityError') {
        message = 'Insecure connection: Camera access blocked due to security settings.';
      }

      setCameraError(message);
      setIsCameraActive(false);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    } finally {
      setIsStartingCamera(false);
      isStartingLockRef.current = false;
    }
  };

  // Requirement 7: Flip Camera safely; if no alternative exists on laptop, display helpful message
  const toggleCameraFacing = async () => {
    if (isStartingCamera || isStartingLockRef.current) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoInputs);

      if (videoInputs.length <= 1) {
        showToast('Only 1 camera detected on this laptop. No alternative camera available to flip to.', 'info');
        return;
      }

      const currentIndex = videoInputs.findIndex((d) => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoInputs.length;
      const nextDevice = videoInputs[nextIndex];

      showToast(`Switching camera to: ${nextDevice.label || `Camera ${nextIndex + 1}`}...`, 'info');
      await startCamera(nextDevice.deviceId);
    } catch (err) {
      console.warn('Failed to switch camera:', err);
      showToast('Could not flip camera.', 'warning');
    }
  };

  // Switch scanner tabs
  const handleSelectMode = async (mode: ScanMode) => {
    setScanMode(mode);
    if (mode !== 'camera' && isCameraActive) {
      stopCamera();
    }
  };

  // Handle uploaded image file (from drag & drop, file input, or clipboard paste)
  const handleImageFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    setImageError(null);
    setIsDecodingImage(true);

    // Create thumbnail preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      showToast('Decoding QR pass from image...', 'info');
      const detectedCode = await decodeQrFromImageFile(file);

      showToast(`Detected code: ${detectedCode}`, 'success');
      processCode(detectedCode, 'upload');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not detect a QR code in this image. Please upload a clear photo or screenshot.';
      setImageError(msg);
      playAlertBeep();
      showToast(msg, 'warning');
    } finally {
      setIsDecodingImage(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  // Clipboard paste listener (Ctrl+V anywhere on page or in scanner)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            setScanMode('upload');
            handleImageFile(file);
            showToast('Pasted image from clipboard.');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Clean up camera, scan loop, and timer on unmount (Requirement 5)
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // Ignore
          }
        });
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Handle Manual Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (!code) return;

    setIsProcessing(true);
    processCode(code, 'manual');
    setManualCode('');
    setIsProcessing(false);
  };

  // Undo Check-in
  const handleUndoCurrentCheckIn = (code: string) => {
    const success = undoCheckIn(code);
    if (success) {
      showToast(`Check-in undone for ${code}. Attendee is pending again.`, 'info');
      setPanelState({ type: 'ready' });
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    } else {
      showToast('Could not undo check-in.', 'error');
    }
  };

  // Direct 1-Click check-in from Roster
  const handleOneClickCheckIn = (code: string) => {
    processCode(code, 'roster');
  };

  // Direct 1-Click undo from Roster
  const handleOneClickUndo = (code: string) => {
    const success = undoCheckIn(code);
    if (success) {
      showToast(`Check-in undone for ${code}.`, 'info');
    }
  };

  // Calculation for percentage
  const attendedPercentage =
    stats.registered > 0 ? Math.round((stats.attended / stats.registered) * 100) : 0;

  if (events.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-[16px] border border-[#E1E5EE] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#E8EBFE] text-[#3345E8] flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#0E1424] mb-2">
            No events available for check-in
          </h2>
          <p className="text-[#5B6478] text-sm mb-6">
            Create an event in the organizer dashboard first before opening the check-in desk.
          </p>
          <button
            type="button"
            onClick={onNavigateToOrganizer}
            className="inline-flex items-center justify-center gap-2 bg-[#3345E8] hover:bg-[#2735C4] text-white text-sm font-semibold px-5 py-2.5 rounded-[8px] transition-colors focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 min-h-[44px]"
          >
            Go to Organizer portal &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-6">
      {/* Hidden scratchpad div required by Html5Qrcode.scanFile */}
      <div id="qr-file-scratchpad" style={{ display: 'none' }} />

      {/* Top Bar: Event Header & Live Gate Counters */}
      <div className="bg-white rounded-[18px] border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Title + Event Switcher */}
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Gate Check-in Desk</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Event:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative inline-block">
                  <select
                    value={selectedEventId || ''}
                    onChange={(e) => onSelectEventId(e.target.value)}
                    className="appearance-none bg-white border border-slate-200/90 text-slate-900 font-bold text-base sm:text-lg py-1.5 pl-3 pr-8 rounded-[8px] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/20 focus:border-[#3345E8] cursor-pointer max-w-[240px] sm:max-w-xs truncate shadow-2xs"
                    aria-label="Select event for check-in"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {currentEvent && (() => {
                  const cat = getCategoryInfo(currentEvent.category);
                  const Icon = cat.icon;
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      <Icon className="w-3.5 h-3.5 text-[#3345E8]" />
                      <span>{cat.label}</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Right: Live Counters (Registered / Checked in / Seats left) */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-slate-50/80 px-4 py-3 rounded-[12px] border border-slate-200/80">
            <div className="text-center">
              <div className="text-[11px] uppercase font-bold text-slate-500">Registered</div>
              <div className="text-lg sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                {stats.registered}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <div className="text-[11px] uppercase font-bold text-emerald-700">Checked in</div>
              <div className="text-lg sm:text-2xl font-extrabold text-emerald-600 tabular-nums">
                {stats.attended}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <div className="text-[11px] uppercase font-bold text-slate-500">Remaining</div>
              <div className="text-lg sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                {stats.remaining}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Progress Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span>Gate Progress:</span>
              <span className="text-emerald-700 font-bold">{attendedPercentage}% Admitted</span>
            </span>
            <span>
              {stats.attended} of {stats.registered} students entered
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${attendedPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Scanner Options & Viewport vs Right Verification Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scanner Options & Viewport (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-[18px] border border-slate-200/90 p-5 shadow-2xs space-y-4">
          {/* Header & Mode Switcher: Camera / Upload Image / Manual Code */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#3345E8]" />
                <span>Student Pass Scanner</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan pass with camera, upload pass image, or type code
              </p>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center p-1 bg-slate-100/80 rounded-[10px] border border-slate-200/80 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleSelectMode('camera')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[6px] transition-all cursor-pointer ${
                  scanMode === 'camera'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
                title="Scan live student QR code using camera"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('upload')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[6px] transition-all cursor-pointer ${
                  scanMode === 'upload'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
                title="Upload screenshot or photo of student ticket pass"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('manual')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[6px] transition-all cursor-pointer ${
                  scanMode === 'manual'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
                title="Type ticket code directly"
              >
                <span>Code</span>
              </button>
            </div>
          </div>

          {/* ================= OPTION 1: CAMERA SCANNER ================= */}
          {scanMode === 'camera' && (
            <div className="bg-[#0E1424] text-white rounded-[14px] p-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs">
                  <Smartphone className="w-3.5 h-3.5 text-[#3345E8] shrink-0" />
                  <span className="truncate">{cameraLabel}</span>
                </span>

                {isCameraActive && (
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                    title="Switch camera device"
                  >
                    <FlipHorizontal className="w-3 h-3" />
                    <span>Flip Camera</span>
                  </button>
                )}
              </div>

              {/* Viewport with viewfinder */}
              <div className="relative aspect-square max-h-[300px] sm:max-h-[320px] w-full bg-black rounded-[12px] overflow-hidden border border-white/10 flex items-center justify-center">
                {/* Live Video Element attached to MediaStream (Requirements 2, 3, 6) */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover z-0 ${
                    isCameraActive ? 'block' : 'hidden'
                  }`}
                />

                {!isCameraActive && (
                  <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center text-white/70">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 text-white">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">
                      Camera scanner is offline
                    </p>
                    <p className="text-xs text-white/60 max-w-xs mb-4">
                      Activate camera to scan student entry passes automatically.
                    </p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      disabled={isStartingCamera}
                      className="inline-flex items-center gap-2 bg-[#3345E8] hover:bg-[#2735C4] disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-[8px] transition-colors focus:outline-none shadow-sm min-h-[40px] cursor-pointer"
                    >
                      {isStartingCamera ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Starting camera...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>Start Camera Scanner</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Viewfinder Target Overlays (Requirement 6: Overlay on top of live video) */}
                {isCameraActive && (
                  <div className="pointer-events-none absolute inset-0 z-10 p-8 flex items-center justify-center">
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                      <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#3345E8] rounded-tl-sm" />
                      <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#3345E8] rounded-tr-sm" />
                      <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#3345E8] rounded-bl-sm" />
                      <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#3345E8] rounded-br-sm" />
                      {/* Scanning laser beam */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#3345E8] shadow-[0_0_12px_#3345E8] animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Error Message */}
              {cameraError && (
                <div className="p-3 rounded-[8px] bg-[#C0302F]/20 border border-[#C0302F]/40 text-[#FCE1E1] text-xs leading-relaxed">
                  {cameraError}
                </div>
              )}

              {/* Camera Control Footer */}
              {isCameraActive && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 px-4 rounded-[8px] transition-colors focus:outline-none min-h-[40px] cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMode('upload')}
                    className="inline-flex items-center gap-1.5 bg-[#3345E8] hover:bg-[#2735C4] text-white text-xs font-semibold py-2.5 px-3 rounded-[8px] transition-colors min-h-[40px] cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= OPTION 2: UPLOAD IMAGE / FILE SCANNER ================= */}
          {scanMode === 'upload' && (
            <div className="space-y-4">
              {/* Drag & Drop File Upload Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[14px] p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDraggingFile
                    ? 'border-[#3345E8] bg-[#E8EBFE]/60 scale-[1.01]'
                    : 'border-[#E1E5EE] hover:border-[#3345E8]/60 bg-[#F4F6FA]/50 hover:bg-[#F4F6FA]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageFile(f);
                  }}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-full bg-[#E8EBFE] text-[#3345E8] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  {isDecodingImage ? (
                    <span className="w-6 h-6 border-3 border-[#3345E8]/30 border-t-[#3345E8] rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <div className="text-sm font-bold text-[#0E1424] mb-1">
                  {isDecodingImage
                    ? 'Scanning image for QR pass...'
                    : 'Click to upload or drag & drop pass image'}
                </div>

                <p className="text-xs text-[#5B6478] max-w-sm mx-auto mb-4">
                  Upload screenshot of ticket, saved pass PNG, or photo taken with your phone.
                </p>

                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3345E8] bg-white px-3 py-1.5 rounded-[8px] border border-[#E1E5EE] shadow-2xs">
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Choose file from device</span>
                </div>
              </div>

              {/* Paste from Clipboard Helper */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-[10px] bg-[#F4F6FA] border border-[#E1E5EE] text-xs text-[#5B6478]">
                <div className="flex items-center gap-2">
                  <ClipboardPaste className="w-4 h-4 text-[#3345E8]" />
                  <span>
                    <strong>Tip:</strong> You can also press <kbd className="px-1.5 py-0.5 bg-white border border-[#E1E5EE] rounded text-[11px] font-mono text-[#0E1424]">Ctrl + V</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-[#E1E5EE] rounded text-[11px] font-mono text-[#0E1424]">Cmd + V</kbd> anywhere to paste a copied pass image.
                  </span>
                </div>
              </div>

              {/* Uploaded Preview Thumbnail */}
              {uploadedPreview && (
                <div className="p-3 bg-[#F4F6FA] rounded-[10px] border border-[#E1E5EE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={uploadedPreview}
                      alt="Uploaded pass preview"
                      className="w-12 h-12 rounded-[6px] object-cover border border-[#E1E5EE] bg-white shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#0E1424]">Last Uploaded Pass</div>
                      <div className="text-[11px] text-[#5B6478]">Ready for verification</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs font-semibold text-[#3345E8] hover:underline px-2 py-1"
                  >
                    Upload another
                  </button>
                </div>
              )}

              {/* Image Error Alert */}
              {imageError && (
                <div className="p-3 rounded-[8px] bg-[#FCE1E1] border border-[#C0302F]/30 text-[#C0302F] text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Scan Error: </span>
                    {imageError}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= OPTION 3: MANUAL CODE ENTRY ================= */}
          {scanMode === 'manual' && (
            <div className="p-4 bg-[#F4F6FA] rounded-[14px] border border-[#E1E5EE] space-y-3">
              <h3 className="text-sm font-bold text-[#0E1424]">
                Enter Attendee Entry Pass Code
              </h3>
              <p className="text-xs text-[#5B6478]">
                Type the 6-character code printed on the attendee pass (e.g. EVT1-XXXXXX)
              </p>

              <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="EVT1-______"
                  className="flex-1 h-11 px-3.5 font-mono text-base font-bold tracking-wider bg-white border border-[#E1E5EE] rounded-[8px] text-[#0E1424] placeholder:text-[#5B6478]/40 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] uppercase shadow-2xs"
                  autoComplete="off"
                  spellCheck="false"
                  aria-label="Enter pass code"
                />

                <button
                  type="submit"
                  disabled={!manualCode.trim() || isProcessing}
                  className="h-11 px-5 bg-[#3345E8] hover:bg-[#2735C4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-[8px] transition-colors focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 inline-flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                >
                  {isProcessing ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Check In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Live Check-in Verification Result Card (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div
            aria-live="assertive"
            className="w-full min-h-[340px] rounded-[16px] p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 relative border shadow-xs"
            style={{
              backgroundColor:
                panelState.type === 'success'
                  ? '#DDF5EA'
                  : panelState.type === 'duplicate'
                  ? '#FFEBCB'
                  : panelState.type === 'invalid'
                  ? '#FCE1E1'
                  : '#FFFFFF',
              borderColor:
                panelState.type === 'success'
                  ? '#12805C'
                  : panelState.type === 'duplicate'
                  ? '#B25E00'
                  : panelState.type === 'invalid'
                  ? '#C0302F'
                  : '#E1E5EE',
              color:
                panelState.type === 'success'
                  ? '#12805C'
                  : panelState.type === 'duplicate'
                  ? '#B25E00'
                  : panelState.type === 'invalid'
                  ? '#C0302F'
                  : '#0E1424',
            }}
          >
            {/* STATE 1: READY / IDLE */}
            {panelState.type === 'ready' && (
              <div className="flex flex-col items-center justify-center space-y-3.5 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-[#F4F6FA] border border-[#E1E5EE] text-[#5B6478] flex items-center justify-center shadow-2xs">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0E1424]">
                    Ready for Next Student
                  </h3>
                  <p className="text-xs text-[#5B6478] mt-1 leading-relaxed">
                    Point camera scanner at pass, upload ticket image screenshot, or click attendee in roster below.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F4F6FA] text-[#5B6478] border border-[#E1E5EE]">
                    <Smartphone className="w-3 h-3 text-[#3345E8]" />
                    <span>Camera Scan</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F4F6FA] text-[#5B6478] border border-[#E1E5EE]">
                    <FileUp className="w-3 h-3 text-[#3345E8]" />
                    <span>Image Upload</span>
                  </span>
                </div>
              </div>
            )}

            {/* STATE 2: SUCCESS CHECK-IN */}
            {panelState.type === 'success' && (
              <div className="flex flex-col items-center justify-center space-y-3.5 w-full animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-[#12805C] text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-white/80 text-[#12805C] border border-[#12805C]/30 shadow-2xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>Check-in Verified · Admitted</span>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-[#0E1424] leading-tight max-w-md truncate">
                  {panelState.name}
                </div>

                {panelState.email && (
                  <div className="text-xs font-semibold text-[#5B6478] max-w-sm truncate">
                    {panelState.email}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="font-mono text-xs font-bold bg-white px-3 py-1 rounded-[6px] text-[#0E1424] border border-[#12805C]/30 shadow-2xs">
                    Pass: {panelState.code}
                  </span>
                  <span className="text-xs font-bold text-[#12805C] bg-white/70 px-2.5 py-1 rounded-[6px] border border-[#12805C]/20">
                    Checked in at {formatTime(panelState.checkedInAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setPanelState({ type: 'ready' })}
                    className="inline-flex items-center gap-1.5 bg-[#12805C] hover:bg-[#0E6649] text-white text-xs font-bold px-4 py-2 rounded-[8px] transition-colors shadow-xs"
                  >
                    <span>Scan Next Student</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUndoCurrentCheckIn(panelState.code)}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-white/90 text-[#C0302F] text-xs font-bold px-3 py-2 rounded-[8px] border border-[#C0302F]/30 transition-colors"
                    title="Undo this check-in if scanned accidentally"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Undo</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATE 3: DUPLICATE CHECK-IN */}
            {panelState.type === 'duplicate' && (
              <div className="flex flex-col items-center justify-center space-y-3.5 w-full animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-[#B25E00] text-white flex items-center justify-center shadow-md">
                  <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-white/80 text-[#B25E00] border border-[#B25E00]/30 shadow-2xs">
                  <span>Already Checked In</span>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-[#0E1424] leading-tight max-w-md truncate">
                  {panelState.name}
                </div>

                {panelState.email && (
                  <div className="text-xs font-semibold text-[#5B6478] max-w-sm truncate">
                    {panelState.email}
                  </div>
                )}

                <div className="text-xs sm:text-sm font-bold text-[#B25E00]">
                  Original Entrance: {formatTime(panelState.originalCheckedInAt)}
                </div>

                <div className="font-mono text-xs font-bold bg-white px-3 py-1 rounded-[6px] text-[#0E1424] border border-[#B25E00]/30 shadow-2xs">
                  Pass: {panelState.code}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPanelState({ type: 'ready' })}
                    className="inline-flex items-center gap-1.5 bg-[#B25E00] hover:bg-[#8F4B00] text-white text-xs font-bold px-4 py-2 rounded-[8px] transition-colors shadow-xs"
                  >
                    <span>Scan Next Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUndoCurrentCheckIn(panelState.code)}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-white/90 text-[#C0302F] text-xs font-bold px-3 py-2 rounded-[8px] border border-[#C0302F]/30 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Status</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATE 4: INVALID CODE */}
            {panelState.type === 'invalid' && (
              <div className="flex flex-col items-center justify-center space-y-3.5 w-full animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-[#C0302F] text-white flex items-center justify-center shadow-md">
                  <XCircle className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div className="text-xl sm:text-2xl font-black text-[#C0302F]">
                  Invalid Pass Code
                </div>

                <p className="text-xs font-medium text-[#0E1424]/80 max-w-xs">
                  This code is not registered for any active event. Please verify with attendee or check the list below.
                </p>

                <div className="font-mono text-xs font-bold bg-white px-3 py-1 rounded-[6px] text-[#C0302F] border border-[#C0302F]/30">
                  {panelState.code || 'UNKNOWN'}
                </div>

                <button
                  type="button"
                  onClick={() => setPanelState({ type: 'ready' })}
                  className="inline-flex items-center gap-1.5 bg-[#0E1424] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-[8px] transition-colors mt-2"
                >
                  <span>Try Again</span>
                </button>
              </div>
            )}
          </div>

          {/* Recent Desk Scans Log */}
          {recentScans.length > 0 && (
            <div className="bg-white rounded-[14px] border border-[#E1E5EE] p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#5B6478] mb-2.5">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Recent Desk Activity</span>
                </div>
                <span className="text-[11px] font-medium text-[#5B6478]/80">Last 6 scans</span>
              </div>

              <div className="space-y-1.5">
                {recentScans.map((item, idx) => (
                  <div
                    key={`${item.code}-${idx}`}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-[8px] bg-[#F4F6FA] border border-[#E1E5EE]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[#0E1424] truncate">{item.name}</span>
                      <span className="font-mono text-[11px] text-[#5B6478] shrink-0">
                        ({item.code})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[#5B6478] text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </span>
                      {item.status === 'SUCCESS' ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#DDF5EA] text-[#12805C]">
                          Entered
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFEBCB] text-[#B25E00]">
                          Duplicate
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Attendee Desk Roster with 1-Click Check-In */}
      <div className="bg-white rounded-[16px] border border-[#E1E5EE] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E1E5EE]">
          <div>
            <h3 className="text-base font-bold text-[#0E1424] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#3345E8]" />
              <span>Registered Students · Desk Roster</span>
            </h3>
            <p className="text-xs text-[#5B6478] mt-0.5">
              1-click check-in for students without phone or QR code
            </p>
          </div>

          {/* Controls: Search + Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search name, email, code..."
                className="pl-8 pr-7 py-1.5 text-xs bg-white border border-[#E1E5EE] rounded-[8px] text-[#0E1424] placeholder:text-[#5B6478]/70 focus:outline-none focus:ring-2 focus:ring-[#3345E8]/30 w-52 sm:w-60"
              />
              {rosterSearch && (
                <button
                  type="button"
                  onClick={() => setRosterSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6478] hover:text-[#0E1424]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-[#F4F6FA] rounded-[8px] border border-[#E1E5EE]">
              <button
                type="button"
                onClick={() => setRosterFilter('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-[6px] transition-colors ${
                  rosterFilter === 'all'
                    ? 'bg-white text-[#0E1424] shadow-xs'
                    : 'text-[#5B6478] hover:text-[#0E1424]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter('pending')}
                className={`px-2.5 py-1 text-xs font-bold rounded-[6px] transition-colors ${
                  rosterFilter === 'pending'
                    ? 'bg-white text-[#0E1424] shadow-xs'
                    : 'text-[#5B6478] hover:text-[#0E1424]'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter('checkedIn')}
                className={`px-2.5 py-1 text-xs font-bold rounded-[6px] transition-colors ${
                  rosterFilter === 'checkedIn'
                    ? 'bg-white text-[#12805C] shadow-xs'
                    : 'text-[#5B6478] hover:text-[#0E1424]'
                }`}
              >
                Checked In
              </button>
            </div>
          </div>
        </div>

        {/* Attendee Roster Table */}
        {participants.length === 0 ? (
          <div className="py-8 text-center text-[#5B6478]">
            <p className="text-sm font-semibold">No participants match the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E1E5EE] text-[#5B6478] font-bold">
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Pass Code</th>
                  <th className="py-2.5 px-3">Gate Status</th>
                  <th className="py-2.5 px-3 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E5EE]">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F4F6FA]/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#0E1424]">{p.name}</td>
                    <td className="py-2.5 px-3 text-[#5B6478]">{p.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] font-bold bg-[#F4F6FA] text-[#0E1424] px-2 py-0.5 rounded-[4px] border border-[#E1E5EE]">
                        {p.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {p.checkedIn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DDF5EA] text-[#12805C]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Admitted ({formatTime(p.checkedInAt || '')})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F6FA] text-[#5B6478] border border-[#E1E5EE]">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {p.checkedIn ? (
                        <button
                          type="button"
                          onClick={() => handleOneClickUndo(p.code)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B6478] hover:text-[#C0302F] px-2 py-1 rounded hover:bg-[#FCE1E1]/40 transition-colors"
                          title="Undo check-in for this student"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOneClickCheckIn(p.code)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#3345E8] hover:bg-[#2735C4] text-white px-3 py-1 rounded-[6px] transition-colors shadow-2xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Check In</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
