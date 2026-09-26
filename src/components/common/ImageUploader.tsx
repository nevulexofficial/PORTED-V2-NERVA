import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { Camera, Link as LinkIcon, Upload, Check, X } from 'lucide-react';

interface ImageUploaderProps {
  label?: string;
  currentImageUrl?: string;
  onImageSelected: (url: string) => void;
  aspectRatio?: 'avatar' | 'banner' | 'square' | 'wide';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = 'Imagen',
  currentImageUrl,
  onImageSelected,
  aspectRatio = 'square',
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('La imagen debe pesar menos de 15MB');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.uploadImage(base64, file.name);
        setPreview(res.url);
        onImageSelected(res.url);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al subir la imagen');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setPreview(urlInput.trim());
    onImageSelected(urlInput.trim());
    setUrlInput('');
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">{label}</span>
        {/* Switcher Mode: Dispositivo vs URL */}
        <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md transition ${
              mode === 'upload' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dispositivo
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md transition ${
              mode === 'url' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            URL
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Preview Container */}
        <div className={`relative shrink-0 overflow-hidden bg-slate-950 border border-slate-700 p-0.5 ${
          aspectRatio === 'avatar' ? 'w-12 h-12 rounded-full' :
          aspectRatio === 'banner' ? 'w-20 h-10 rounded-xl' : 'w-12 h-12 rounded-xl'
        }`}>
          {preview ? (
            <img src={preview} alt="Vista previa" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Camera className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Input Methods */}
        <div className="flex-1 min-w-0">
          {mode === 'upload' ? (
            <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer border border-slate-700 transition">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{uploading ? 'Subiendo...' : 'Seleccionar del teléfono/PC'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          ) : (
            <form onSubmit={handleApplyUrl} className="flex gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
              >
                Aplicar
              </button>
            </form>
          )}

          {errorMsg && (
            <span className="text-[10px] text-rose-400 font-semibold block mt-1">{errorMsg}</span>
          )}
        </div>
      </div>
    </div>
  );
};
