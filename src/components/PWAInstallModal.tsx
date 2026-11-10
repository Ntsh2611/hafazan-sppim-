import React from 'react';
import { Smartphone, Download, Share2, PlusSquare, CheckCircle, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const res = await promptInstall();
    if (res === 'accepted') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0a382c] border border-emerald-600/40 rounded-2xl shadow-2xl p-6 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/40 transition-colors"
          title="Tutup"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <Smartphone size={26} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-amber-200">
              Simpan ke Skrin Utama Telefon
            </h3>
            <p className="text-xs text-emerald-200/80">
              Aplikasi Web Progresif (PWA) SPPIM 2027
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="space-y-2.5 bg-emerald-950/40 border border-emerald-700/30 rounded-xl p-3.5 mb-5 text-xs text-emerald-100">
          <div className="flex items-start space-x-2">
            <CheckCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Kekal Log Masuk:</strong> Anda tidak akan terkeluar automatik selagi tidak menekan butang Log Keluar.</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Peringatan Jam 8.15 Malam:</strong> Terima notifikasi surah semasa terus ke telefon setiap hari pada jam 8.15 malam.</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Akses Pantas:</strong> Terus buka dari ikon skrin telefon seperti aplikasi rasmi Play Store / App Store.</span>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 bg-emerald-900/60 rounded-xl border border-emerald-500/40 text-center text-emerald-200 text-sm">
            <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
            <p className="font-semibold text-white">Aplikasi telah dipasang pada skrin utama anda!</p>
            <p className="text-xs text-emerald-300/80 mt-1">
              Buka aplikasi terus melalui ikon di telefon untuk sesi yang sentiasa aktif.
            </p>
          </div>
        ) : isIOS ? (
          /* Panduan untuk iOS Safari */
          <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-emerald-800/40 text-xs text-emerald-200">
            <p className="font-bold text-amber-300 text-sm mb-1">
              Cara Pasang di iPhone / iPad (Safari):
            </p>
            <ol className="list-decimal list-inside space-y-2 text-emerald-100">
              <li className="flex items-center space-x-2">
                <span className="font-bold text-amber-300">1.</span>
                <span>Tekan butang <strong>Kongsi (Share)</strong></span>
                <Share2 size={16} className="inline text-blue-400 ml-1" />
                <span>di bar bawah pelayar Safari.</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="font-bold text-amber-300">2.</span>
                <span>Tatal ke bawah dan pilih <strong>"Add to Home Screen"</strong></span>
                <PlusSquare size={16} className="inline text-amber-300 ml-1" />.
              </li>
              <li className="flex items-center space-x-2">
                <span className="font-bold text-amber-300">3.</span>
                <span>Tekan <strong>"Add" (Tambah)</strong> di sudut atas kanan.</span>
              </li>
            </ol>
          </div>
        ) : isInstallable ? (
          /* Butang Pasang Automatik (Android / Chrome) */
          <button
            onClick={handleInstallClick}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <Download size={18} />
            <span>Pasang ke Skrin Utama Telefon Sekarang</span>
          </button>
        ) : (
          /* Arahan alternatif Android jika prompt belum sedia */
          <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-emerald-800/40 text-xs text-emerald-200">
            <p className="font-bold text-amber-300 text-sm mb-1">
              Cara Pasang di Telefon Pintar (Android / Chrome):
            </p>
            <p className="text-emerald-100">
              1. Tekan butang menu bertitik tiga <strong>(⋮)</strong> di sudut atas kanan pelayar Chrome.
            </p>
            <p className="text-emerald-100">
              2. Pilih <strong>"Pasang aplikasi"</strong> atau <strong>"Tambah ke Skrin Utama" (Add to Home screen)</strong>.
            </p>
          </div>
        )}

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="text-xs text-emerald-300/80 hover:text-white underline underline-offset-4"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
