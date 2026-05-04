'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { X, Upload, Camera, Loader2, Moon, Sun, Monitor } from 'lucide-react';
import Avatar from './Avatar';
import { useTheme } from 'next-themes';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditProfileModal({ isOpen, onClose, onUpdated }: EditProfileModalProps) {
  const { currentUser, setCurrentUser } = useUserStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState('');
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera when closing
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen || !currentUser) return null;

  const handlePinChange = async () => {
    if (newPin.length !== 4) return;
    setIsChangingPin(true);
    setPinMessage('');
    setError('');

    try {
      const { data: updatedMember, error: updateError } = await supabase
        .from('members')
        .update({ pin: newPin })
        .eq('id', currentUser.id)
        .select();

      if (updateError) throw updateError;
      if (!updatedMember || updatedMember.length === 0) {
        throw new Error('RLS block: Faltan permisos de UPDATE en la tabla members.');
      }
      
      setPinMessage('PIN actualizado correctamente');
      setNewPin('');
      
      setCurrentUser({ ...currentUser, pin: newPin });
      onUpdated();
      setTimeout(() => setPinMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Hubo un error al cambiar el PIN.');
    } finally {
      setIsChangingPin(false);
    }
  };

  const uploadImage = async (file: File | Blob) => {
    setIsUploading(true);
    setError('');
    try {
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${currentUser.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { data: updatedMember, error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id)
        .select();

      if (updateError) throw updateError;
      if (!updatedMember || updatedMember.length === 0) {
        throw new Error('RLS block: Faltan permisos de UPDATE en la tabla members.');
      }

      setCurrentUser({ ...currentUser, avatar_url: publicUrl });
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Hubo un error al subir la imagen.');
    } finally {
      setIsUploading(false);
      stopCamera();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy pesada (máximo 5MB).');
      return;
    }

    uploadImage(file);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo acceder a la cámara.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            uploadImage(blob);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-[#303030] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-[#E5E6E6] dark:border-[#3D3D3D] bg-[#FAFAFA] dark:bg-[#2A2A2A] transition-colors">
          <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white">Editar Perfil</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#1E1E1E] dark:text-white hover:bg-[#E5E6E6] dark:hover:bg-[#3D3D3D] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            {isCameraOpen ? (
              <div className="relative w-full max-w-[200px] aspect-square rounded-full overflow-hidden bg-black border border-[#E5E6E6] dark:border-[#3D3D3D]">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Avatar member={currentUser} className="w-24 h-24 text-4xl" />
            )}
            
            <div className="flex gap-2 w-full justify-center">
              {isCameraOpen ? (
                <>
                  <button 
                    onClick={capturePhoto}
                    disabled={isUploading}
                    className="flex-1 max-w-[120px] bg-[#3584E4] hover:bg-[#1C71D8] text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    Tomar
                  </button>
                  <button 
                    onClick={stopCamera}
                    disabled={isUploading}
                    className="flex-1 max-w-[120px] bg-[#E5E6E6] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#474747] text-[#1E1E1E] dark:text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 max-w-[120px] bg-[#E5E6E6] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#474747] text-[#1E1E1E] dark:text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Subir
                  </button>
                  <button 
                    onClick={startCamera}
                    disabled={isUploading}
                    className="flex-1 max-w-[120px] bg-[#3584E4] hover:bg-[#1C71D8] text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    Cámara
                  </button>
                </>
              )}
            </div>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            {/* Hidden canvas for capturing video frame */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="border-t border-[#E5E6E6] dark:border-[#3D3D3D] pt-6 transition-colors">
            <h3 className="text-sm font-semibold text-[#1E1E1E] dark:text-white mb-3">Cambiar PIN</h3>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="Nuevo PIN"
                className="flex-1 text-center tracking-widest text-lg text-[#1E1E1E] dark:text-white dark:bg-[#242424] px-4 py-2 rounded-lg border border-[#E5E6E6] dark:border-[#3D3D3D] focus:outline-none focus:border-[#3584E4] focus:ring-1 focus:ring-[#3584E4] transition-colors"
              />
              <button
                onClick={handlePinChange}
                disabled={newPin.length !== 4 || isChangingPin}
                className="bg-[#3584E4] hover:bg-[#1C71D8] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isChangingPin ? '...' : 'Guardar'}
              </button>
            </div>
            {pinMessage && <p className="text-xs text-[#2EC27E] dark:text-[#57E389] text-center mt-2">{pinMessage}</p>}
          </div>

          {/* Theme Toggle */}
          {mounted && (
            <div className="border-t border-[#E5E6E6] dark:border-[#3D3D3D] pt-6 transition-colors">
              <h3 className="text-sm font-semibold text-[#1E1E1E] dark:text-white mb-3">Apariencia</h3>
              <div className="flex bg-[#E5E6E6] dark:bg-[#242424] p-1 rounded-lg">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'light' ? 'bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm' : 'text-[#1E1E1E]/70 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
                >
                  <Sun className="w-4 h-4" />
                  Claro
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'dark' ? 'bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm' : 'text-[#1E1E1E]/70 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
                >
                  <Moon className="w-4 h-4" />
                  Oscuro
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm' : 'text-[#1E1E1E]/70 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
                >
                  <Monitor className="w-4 h-4" />
                  Auto
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-[#E01B24] dark:text-[#FF7B63] text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
