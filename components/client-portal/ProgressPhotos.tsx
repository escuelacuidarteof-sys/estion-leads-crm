import React, { useState, useEffect, useRef } from 'react';
import { Camera, ArrowLeft, Calendar, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface ProgressPhotosProps {
  clientId: string;
  onBack: () => void;
}

interface PhotoEntry {
  name: string;
  url: string;
  view: string;
  timestamp: number;
  date: string;
}

const VIEWS = [
  { id: 'front', label: 'Frontal', emoji: '🧍' },
  { id: 'profile', label: 'Perfil', emoji: '🧍‍♂️' },
  { id: 'lateral', label: 'Lateral', emoji: '🧍‍♀️' },
];

export function ProgressPhotos({ clientId, onBack }: ProgressPhotosProps) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareDates, setCompareDates] = useState<[string, string]>(['', '']);
  const [sliderPos, setSliderPos] = useState(50);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { loadPhotos(); }, [clientId]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.storage.from('client-materials').list(`progress-photos/${clientId}/`, { limit: 200, sortBy: { column: 'name', order: 'desc' } });
      if (data) {
        const entries: PhotoEntry[] = data
          .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
          .map(f => {
            const parts = f.name.replace(/\.[^.]+$/, '').split('_');
            const view = parts[0] || 'front';
            const ts = parseInt(parts[1]) || 0;
            const { data: urlData } = supabase.storage.from('client-materials').getPublicUrl(`progress-photos/${clientId}/${f.name}`);
            return { name: f.name, url: urlData.publicUrl, view, timestamp: ts, date: new Date(ts).toISOString().split('T')[0] };
          })
          .sort((a, b) => b.timestamp - a.timestamp);
        setPhotos(entries);
      }
    } catch (err) {
      console.warn('ProgressPhotos load error:', err);
    }
    setLoading(false);
  };

  const uploadPhoto = async (view: string, file: File) => {
    setUploading(view);
    try {
      const ts = Date.now();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `progress-photos/${clientId}/${view}_${ts}.${ext}`;
      const { error } = await supabase.storage.from('client-materials').upload(path, file);
      if (!error) await loadPhotos();
    } catch (err) {
      console.warn('Upload error:', err);
    }
    setUploading(null);
  };

  const deletePhoto = async (name: string) => {
    await supabase.storage.from('client-materials').remove([`progress-photos/${clientId}/${name}`]);
    setPhotos(prev => prev.filter(p => p.name !== name));
  };

  // Group by date
  const dateGroups = photos.reduce<Record<string, PhotoEntry[]>>((acc, p) => {
    if (!acc[p.date]) acc[p.date] = [];
    acc[p.date].push(p);
    return acc;
  }, {});
  const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));

  // Compare photos
  const comparePhotosA = compareDates[0] ? photos.filter(p => p.date === compareDates[0]) : [];
  const comparePhotosB = compareDates[1] ? photos.filter(p => p.date === compareDates[1]) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-green" /> Fotos de Progreso
        </h3>
        <button onClick={() => setCompareMode(!compareMode)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${compareMode ? 'bg-brand-green text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
          {compareMode ? 'Salir comparar' : 'Comparar'}
        </button>
      </div>

      {/* Upload section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Nueva foto</p>
        <div className="grid grid-cols-3 gap-3">
          {VIEWS.map(v => (
            <div key={v.id} className="text-center">
              <button
                onClick={() => fileRefs.current[v.id]?.click()}
                disabled={!!uploading}
                className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-green flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
              >
                {uploading === v.id ? (
                  <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
                ) : (
                  <>
                    <span className="text-2xl">{v.emoji}</span>
                    <Camera className="w-4 h-4 text-slate-400" />
                  </>
                )}
              </button>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">{v.label}</p>
              <input
                ref={el => { fileRefs.current[v.id] = el; }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(v.id, f); e.target.value = ''; }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Compare mode */}
      {compareMode && sortedDates.length >= 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1">ANTES</p>
              <select value={compareDates[0]} onChange={e => setCompareDates([e.target.value, compareDates[1]])} className="w-full text-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-200">
                <option value="">Seleccionar fecha</option>
                {sortedDates.map(d => <option key={d} value={d}>{new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1">DESPUÉS</p>
              <select value={compareDates[1]} onChange={e => setCompareDates([compareDates[0], e.target.value])} className="w-full text-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-200">
                <option value="">Seleccionar fecha</option>
                {sortedDates.map(d => <option key={d} value={d}>{new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</option>)}
              </select>
            </div>
          </div>
          {comparePhotosA.length > 0 && comparePhotosB.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {VIEWS.map(v => {
                const a = comparePhotosA.find(p => p.view === v.id);
                const b = comparePhotosB.find(p => p.view === v.id);
                if (!a && !b) return null;
                return (
                  <div key={v.id} className="col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 mb-1">{v.label}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {a ? <img src={a.url} className="w-full aspect-[3/4] object-cover rounded-lg" alt="" /> : <div className="w-full aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg" />}
                      {b ? <img src={b.url} className="w-full aspect-[3/4] object-cover rounded-lg" alt="" /> : <div className="w-full aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Gallery */}
      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <ImageIcon className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Aún no hay fotos de progreso</p>
          <p className="text-xs text-slate-300 mt-1">Sube tu primera foto para empezar a comparar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-bold text-slate-500">{new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="grid grid-cols-3 gap-1 p-2">
                {dateGroups[date].map(photo => (
                  <div key={photo.name} className="relative group">
                    <img src={photo.url} className="w-full aspect-[3/4] object-cover rounded-lg" alt={photo.view} />
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">{photo.view}</span>
                    <button onClick={() => deletePhoto(photo.name)} className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
