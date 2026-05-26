"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const OUTPUT_SIZES = {
  avatar: { width: 512, height: 512, aspect: 1, shape: "circle" },
  banner: { width: 1600, height: 600, aspect: 1600 / 600, shape: "rect" },
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function ImageCropModal({ open, file, kind = "avatar", onCancel, onConfirm }) {
  const target = OUTPUT_SIZES[kind] || OUTPUT_SIZES.avatar;
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);

  useEffect(() => {
    if (!open || !file) {
      setImgSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [open, file]);

  const computeViewport = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const availableW = rect.width;
    const aspect = target.aspect;
    const w = availableW;
    const h = w / aspect;
    setViewport({ w, h });
  }, [target.aspect]);

  useEffect(() => {
    if (!open) return;
    computeViewport();
    const onResize = () => computeViewport();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, computeViewport]);

  const recenter = useCallback(
    (nw, nh, vw, vh) => {
      if (!nw || !nh || !vw || !vh) return;
      const baseScale = Math.max(vw / nw, vh / nh);
      setMinScale(baseScale);
      setScale(baseScale);
      const drawnW = nw * baseScale;
      const drawnH = nh * baseScale;
      setOffset({ x: (vw - drawnW) / 2, y: (vh - drawnH) / 2 });
    },
    []
  );

  const handleImgLoad = useCallback(
    (e) => {
      const img = e.target;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      setImgNatural({ w: nw, h: nh });
      recenter(nw, nh, viewport.w, viewport.h);
    },
    [recenter, viewport.w, viewport.h]
  );

  useEffect(() => {
    if (imgNatural.w && imgNatural.h && viewport.w && viewport.h) {
      recenter(imgNatural.w, imgNatural.h, viewport.w, viewport.h);
    }
  }, [imgNatural.w, imgNatural.h, viewport.w, viewport.h, recenter]);

  const clampOffset = useCallback(
    (x, y, sc) => {
      const drawnW = imgNatural.w * sc;
      const drawnH = imgNatural.h * sc;
      const minX = viewport.w - drawnW;
      const minY = viewport.h - drawnH;
      return {
        x: clamp(x, minX, 0),
        y: clamp(y, minY, 0),
      };
    },
    [imgNatural.w, imgNatural.h, viewport.w, viewport.h]
  );

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offX: offset.x,
      offY: offset.y,
    };
  }

  function onPointerMove(e) {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setOffset(clampOffset(drag.offX + dx, drag.offY + dy, scale));
  }

  function onPointerUp(e) {
    if (dragRef.current?.id === e.pointerId) dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function applyScale(nextScale, anchor) {
    const newScale = clamp(nextScale, minScale, minScale * 6);
    const ax = anchor?.x ?? viewport.w / 2;
    const ay = anchor?.y ?? viewport.h / 2;
    const ratio = newScale / scale;
    const newOffsetX = ax - (ax - offset.x) * ratio;
    const newOffsetY = ay - (ay - offset.y) * ratio;
    setScale(newScale);
    setOffset(clampOffset(newOffsetX, newOffsetY, newScale));
  }

  function onWheel(e) {
    if (!imgNatural.w) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    applyScale(scale * factor, anchor);
  }

  function onSliderChange(e) {
    const value = Number(e.target.value);
    applyScale(value);
  }

  function reset() {
    recenter(imgNatural.w, imgNatural.h, viewport.w, viewport.h);
  }

  async function confirmCrop() {
    if (!imgRef.current || !imgNatural.w || !viewport.w) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = target.width;
      canvas.height = target.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível.");

      const drawnW = imgNatural.w * scale;
      const drawnH = imgNatural.h * scale;
      const sx = (-offset.x / drawnW) * imgNatural.w;
      const sy = (-offset.y / drawnH) * imgNatural.h;
      const sWidth = (viewport.w / drawnW) * imgNatural.w;
      const sHeight = (viewport.h / drawnH) * imgNatural.h;

      ctx.fillStyle = "#0a121e";
      ctx.fillRect(0, 0, target.width, target.height);
      ctx.drawImage(
        imgRef.current,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        target.width,
        target.height
      );

      const mime = "image/jpeg";
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, mime, 0.92)
      );
      if (!blob) throw new Error("Falha ao gerar imagem.");
      const ext = "jpg";
      const cropped = new File([blob], `${kind}.${ext}`, { type: mime });
      await onConfirm?.(cropped);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const cropShapeClass = useMemo(() => {
    if (target.shape === "circle") return "rounded-full";
    return "rounded-2xl";
  }, [target.shape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-papa-card shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-widest text-white">
              {kind === "avatar" ? "Enquadrar foto" : "Enquadrar banner"}
            </h3>
            <p className="mt-0.5 text-[11px] text-white/40">
              Arraste para reposicionar e use o zoom para enquadrar.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div
            ref={containerRef}
            className="relative w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-black/60"
            style={{ height: viewport.h || 240, touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {imgSrc && (
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Pré-visualização"
                onLoad={handleImgLoad}
                draggable={false}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: imgNatural.w ? imgNatural.w * scale : "auto",
                  height: imgNatural.h ? imgNatural.h * scale : "auto",
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                  willChange: "transform",
                  userSelect: "none",
                  pointerEvents: "none",
                  maxWidth: "none",
                }}
              />
            )}

            <div
              className={`pointer-events-none absolute inset-0 ${
                target.shape === "circle"
                  ? "flex items-center justify-center"
                  : ""
              }`}
            >
              {target.shape === "circle" ? (
                <div
                  className={`relative ${cropShapeClass} border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]`}
                  style={{
                    width: Math.min(viewport.w, viewport.h) - 24,
                    height: Math.min(viewport.w, viewport.h) - 24,
                  }}
                />
              ) : (
                <div className="absolute inset-2 rounded-2xl border-2 border-white/80" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => applyScale(scale / 1.15)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
              aria-label="Diminuir zoom"
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min={minScale}
              max={minScale * 6}
              step={(minScale * 5) / 100 || 0.01}
              value={scale}
              onChange={onSliderChange}
              className="flex-1 accent-papa-blue"
              aria-label="Zoom"
            />
            <button
              type="button"
              onClick={() => applyScale(scale * 1.15)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
              aria-label="Aumentar zoom"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
              aria-label="Recentralizar"
              title="Recentralizar"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/5 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-2xl border border-white/10 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-white/70 hover:bg-white/5 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmCrop}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-papa-orange px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-white hover:brightness-110 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Salvando…" : "Salvar enquadramento"}
          </button>
        </div>
      </div>
    </div>
  );
}
