import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { syncProfileToFirestore } from '../../lib/firestoreSync.ts';
import { X, Camera, Upload, Check, User, Sparkles, Globe, Sliders } from 'lucide-react';

interface EditManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditManagerModal: React.FC<EditManagerModalProps> = ({ isOpen, onClose }) => {
  const { user, showToast, refreshUserData } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [nationality, setNationality] = useState(user?.nationality || 'España');
  const [tacticalStyle, setTacticalStyle] = useState(user?.tactical_style || 'Presión Alta & Posesión');
  const [themeColor, setThemeColor] = useState(user?.theme_color || '#10b981');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  // Real File Upload from Mobile Camera / Gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      showToast('La imagen debe ser menor a 12MB', 'error');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.uploadImage(base64, file.name);
        setAvatarUrl(res.url);
        showToast('Foto de mánager subida con éxito', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error al subir la imagen', 'error');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('El nombre de mánager es obligatorio', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        bio: bio.trim(),
        nationality: nationality.trim(),
        tactical_style: tacticalStyle,
        theme_color: user.premium_active ? themeColor : undefined
      });

      // Synchronize with real Firestore database
      if (res.user) {
        syncProfileToFirestore(res.user);
      }

      showToast('Perfil de mánager actualizado correctamente', 'success');
      await refreshUserData();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar perfil', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 select-none">
      <div className="w-full max-w-md bg-[#121826] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Editar Perfil del Mánager</h3>
              <span className="text-[10px] text-slate-400">Datos personales y estilo táctico</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          {/* Avatar Real Upload Section */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/50 p-0.5">
                <img
                  src={avatarUrl || user.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer shadow-md transition">
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white">Foto Oficial de Director Técnico</span>
              <span className="text-[10px] text-slate-400">
                {uploading ? 'Subiendo imagen al servidor...' : 'Sube tu foto real desde la galería o cámara'}
              </span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Nombre Mostrado del Mánager
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Nacionalidad
            </label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="ej. España, Argentina, México, Colombia"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Tactical Style */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Filosofía / Estilo Táctico Predilecto
            </label>
            <select
              value={tacticalStyle}
              onChange={(e) => setTacticalStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Tiki-Taka & Posesión Absoluta">Tiki-Taka & Posesión Absoluta</option>
              <option value="Presión Alta Gegenpressing">Presión Alta Gegenpressing</option>
              <option value="Contraataque Letal & Velocidad">Contraataque Letal & Velocidad</option>
              <option value="Catenaccio & Solidez Defensiva">Catenaccio & Solidez Defensiva</option>
              <option value="Fútbol Total Dinámico">Fútbol Total Dinámico</option>
            </select>
          </div>

          {/* Bio / Manager Philosophy */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Biografía / Frase de Mánager
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Lema táctico para inspirar al vestuario..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Theme Color (If VIP) */}
          {user.premium_active && (
            <div>
              <label className="text-[11px] font-bold text-amber-300 block mb-1">
                Color de Acento VIP
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-[10px] font-mono text-slate-400">{themeColor}</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Guardando...' : 'Guardar Perfil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
