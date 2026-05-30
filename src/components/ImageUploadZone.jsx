// src/components/ImageUploadZone.jsx
// Premium reusable drop zone with compression progress, stats, previews
// Used by BookingImageUpload, GalleryManagement, and any future uploader

import React from 'react';
import { Upload, X, Loader2, AlertCircle, CheckCircle, Zap, Image as ImageIcon } from 'lucide-react';

const GOLD   = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';

// ── Compression stat badge ────────────────────────────────────────────────────
const StatBadge = ({ stats }) => {
  if (!stats || stats.savingPercent <= 0) return null;
  return (
    <div
      className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <Zap className="w-2.5 h-2.5" style={{ color: GOLD_S }} />
      <span className="text-xs font-bold" style={{ color: '#f5d376', fontSize: '10px' }}>
        −{stats.savingPercent}%
      </span>
    </div>
  );
};

// ── Compression ring progress ─────────────────────────────────────────────────
const CompressRing = ({ progress = 0 }) => {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="40" height="40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
        <circle
          cx="20" cy="20" r={r}
          fill="none"
          stroke={GOLD_S}
          strokeWidth="2.5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.2s ease' }}
        />
      </svg>
      <span className="text-xs font-bold" style={{ color: GOLD_S, fontSize: '9px' }}>
        {progress}%
      </span>
    </div>
  );
};

// ── Single image tile ─────────────────────────────────────────────────────────
const ImageTile = ({ item, onRemove, size = 'md' }) => {
  const h = size === 'lg' ? '140px' : size === 'sm' ? '72px' : '96px';

  return (
    <div
      className="relative rounded-xl overflow-hidden flex-shrink-0 group"
      style={{ height: h, aspectRatio: '1', background: 'rgba(255,255,255,0.05)' }}
    >
      {/* Preview image */}
      {item.preview && (
        <img
          src={item.preview}
          alt=""
          className="w-full h-full object-cover"
          style={{ transition: 'filter 0.3s', filter: item.status === 'compressing' ? 'brightness(0.5)' : 'none' }}
        />
      )}

      {/* Compressing overlay */}
      {item.status === 'compressing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          style={{ background: 'rgba(0,0,0,0.55)' }}>
          <CompressRing progress={item.progress || 0} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px' }}>
            Compressing
          </span>
        </div>
      )}

      {/* Uploading overlay */}
      {item.status === 'uploading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
          style={{ background: 'rgba(0,0,0,0.55)' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD_S }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>
            Uploading
          </span>
        </div>
      )}

      {/* Error overlay */}
      {item.status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-center leading-tight" style={{ fontSize: '9px' }}>
            {item.error}
          </p>
        </div>
      )}

      {/* Done check */}
      {item.status === 'done' && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
        </div>
      )}

      {/* Compression stat */}
      {item.status === 'done' && <StatBadge stats={item.stats} />}

      {/* Remove button */}
      {item.status !== 'compressing' && item.status !== 'uploading' && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.tempId); }}
          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
};

// ── Summary bar ───────────────────────────────────────────────────────────────
const SummaryBar = ({ items, formatBytes }) => {
  const done    = items.filter(i => i.status === 'done');
  const saved   = done.reduce((s, i) => s + (i.stats?.savingBytes || 0), 0);
  const webpCnt = done.filter(i => i.stats?.didConvertToWebP).length;

  if (done.length === 0) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap mt-2">
      <div className="flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {done.length} photo{done.length > 1 ? 's' : ''} uploaded
        </span>
      </div>
      {saved > 1024 && (
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD_S }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {formatBytes(saved)} saved
          </span>
        </div>
      )}
      {webpCnt > 0 && (
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(201,168,76,0.1)', color: GOLD_S, fontSize: '10px' }}>
          WebP
        </span>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
/**
 * ImageUploadZone
 *
 * Props:
 *   items         — from useImageUpload hook
 *   dragOver      — from useImageUpload hook
 *   dragHandlers  — from useImageUpload hook
 *   handleFiles   — from useImageUpload hook
 *   removeItem    — from useImageUpload hook
 *   inputRef      — from useImageUpload hook
 *   canAdd        — from useImageUpload hook
 *   formatBytes   — from useImageUpload hook
 *   accept        — input accept string
 *   maxFiles      — for display
 *   multiple      — allow multiple files
 *   tileSize      — 'sm' | 'md' | 'lg'
 *   label         — drop zone label
 *   sublabel      — drop zone sublabel
 *   gridCols      — CSS grid-template-columns (default: 'repeat(4, 1fr)')
 */
const ImageUploadZone = ({
  items        = [],
  dragOver     = false,
  dragHandlers = {},
  handleFiles,
  removeItem,
  inputRef,
  canAdd       = true,
  formatBytes,
  accept       = 'image/jpeg,image/png,image/webp,image/heic',
  maxFiles     = 10,
  multiple     = true,
  tileSize     = 'md',
  label        = 'Drop photos here or browse',
  sublabel     = null,
  gridCols     = 'repeat(4, 1fr)',
  className    = '',
}) => {
  return (
    <div className={className}>
      {/* Drop zone */}
      {canAdd && (
        <div
          className="relative rounded-2xl cursor-pointer transition-all duration-200"
          style={{
            border:      `2px dashed ${dragOver ? GOLD_S : 'rgba(255,255,255,0.13)'}`,
            background:  dragOver ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)',
            padding:     '22px 20px',
            textAlign:   'center',
            transform:   dragOver ? 'scale(1.005)' : 'scale(1)',
          }}
          onClick={() => inputRef?.current?.click()}
          {...dragHandlers}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: dragOver ? GOLD : 'rgba(255,255,255,0.06)',
                transition: 'background 0.2s',
              }}
            >
              <Upload
                className="w-5 h-5 transition-colors"
                style={{ color: dragOver ? '#000' : GOLD_S, opacity: dragOver ? 1 : 0.7 }}
              />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {label.split(' ').map((w, i) =>
                  w === 'browse' ? <span key={i} style={{ color: GOLD_S }}> browse</span>
                  : <span key={i}> {w}</span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {sublabel || `JPG, PNG, WebP · Auto-optimized to WebP · Up to ${maxFiles} photos`}
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            className="hidden"
            onChange={(e) => handleFiles?.(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {items.length > 0 && (
        <div
          className="mt-3"
          style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '8px' }}
        >
          {items.map((item) => (
            <ImageTile
              key={item.tempId}
              item={item}
              onRemove={removeItem}
              size={tileSize}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      <SummaryBar items={items} formatBytes={formatBytes} />
    </div>
  );
};

export { ImageTile, SummaryBar, CompressRing };
export default ImageUploadZone;
