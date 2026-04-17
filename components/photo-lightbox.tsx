"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface PhotoLightboxProps {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function PhotoLightbox({
  photos,
  initialIndex = 0,
  onClose,
}: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
    resetZoom();
  }, [photos.length, resetZoom]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
    resetZoom();
  }, [photos.length, resetZoom]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s * 1.5, 8));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => {
      const next = s / 1.5;
      if (next <= 1) {
        setTranslate({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetZoom();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext, zoomIn, zoomOut, resetZoom]);

  // Mouse wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => {
        const next = Math.min(Math.max(s * delta, 1), 8);
        if (next <= 1) setTranslate({ x: 0, y: 0 });
        return next;
      });
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Mouse drag pan
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...translate };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [scale, translate],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setTranslate({
        x: translateStart.current.x + dx,
        y: translateStart.current.y + dy,
      });
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Double-click to toggle zoom
  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(3);
    }
  }, [scale, resetZoom]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Top controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {scale > 1 && (
          <button
            onClick={resetZoom}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Reset zoom (0)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={zoomOut}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          title="Zoom out (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={zoomIn}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          title="Zoom in (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div
        ref={containerRef}
        className="relative w-full h-full max-w-5xl max-h-[85vh] m-8 overflow-hidden"
        style={{
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          <Image
            src={photos[index]}
            alt={`Photo ${index + 1}`}
            fill
            className="object-contain"
            draggable={false}
            unoptimized
          />
        </div>
      </div>

      {photos.length > 1 && (
        <div className="absolute bottom-6 flex items-center gap-2">
          {photos.map((url, i) => (
            <button
              key={url}
              onClick={() => {
                setIndex(i);
                resetZoom();
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === index
                  ? "border-accent-light scale-110"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={url}
                alt={`Thumbnail ${i + 1}`}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
