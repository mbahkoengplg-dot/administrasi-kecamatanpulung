/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Desa, Layanan, Pengajuan, UserAccount, Warga } from './types';
import {
  getStoredDesa,
  getStoredLayanan,
  getStoredPengajuan,
  getStoredUsers,
  getStoredWarga,
  resetAllData,
} from './utils/storage';
import { cloudTrackKode, syncAllFromCloud } from './utils/gasApi';
import { PublicLandingView } from './views/PublicLandingView';
import { LoginView } from './views/LoginView';
import { WargaDashboard } from './views/WargaDashboard';
import { DesaDashboard } from './views/DesaDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { VerifikasiSuratView } from './views/VerifikasiSuratView';
import { GasGuideView } from './views/GasGuideView';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<
    'landing' | 'masuk' | 'warga' | 'desa' | 'admin' | 'verifikasi'
  >('landing');

  // Active Sessions
  const [currentUserWarga, setCurrentUserWarga] = useState<Warga | null>(null);
  const [currentUserPetugas, setCurrentUserPetugas] = useState<UserAccount | null>(null);

  // Verification View State (from QR code scan or search)
  const [verifikasiTarget, setVerifikasiTarget] = useState<Pengajuan | null>(null);

  // GAS Guide Modal State
  const [isGasGuideOpen, setIsGasGuideOpen] = useState(false);

  // Data State
  const [daftarDesa, setDaftarDesa] = useState<Desa[]>(getStoredDesa());
  const [daftarLayanan, setDaftarLayanan] = useState<Layanan[]>(getStoredLayanan());

  // Sync from Google Spreadsheet / GAS when deployed on Vercel + handle URL params
  useEffect(() => {
    const refreshMaster = () => {
      setDaftarDesa(getStoredDesa());
      setDaftarLayanan(getStoredLayanan());
    };
    window.addEventListener('pulung-data-synced', refreshMaster);

    const params = new URLSearchParams(window.location.search);
    const kode = params.get('kode');
    const tab = params.get('tab');

    if (kode) {
      const allPengajuan = getStoredPengajuan();
      const matched = allPengajuan.find((p) => p.kode === kode || p.nomorSurat === kode);
      if (matched) {
        setVerifikasiTarget(matched);
        setCurrentView('verifikasi');
      } else {
        void cloudTrackKode(kode).then((res) => {
          if (res.pengajuan) {
            setVerifikasiTarget(res.pengajuan);
            setCurrentView('verifikasi');
          }
        });
      }
    } else if (tab === 'masuk') {
      setCurrentView('masuk');
    }

    void syncAllFromCloud();

    return () => {
      window.removeEventListener('pulung-data-synced', refreshMaster);
    };
  }, []);

  // Handle Login Warga
  const handleLoginWargaSuccess = (warga: Warga) => {
    setCurrentUserWarga(warga);
    setCurrentUserPetugas(null);
    setCurrentView('warga');
  };

  // Handle Login Petugas
  const handleLoginPetugasSuccess = (petugas: UserAccount) => {
    setCurrentUserPetugas(petugas);
    setCurrentUserWarga(null);
    if (petugas.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('desa');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUserWarga(null);
    setCurrentUserPetugas(null);
    setCurrentView('masuk');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* MAIN VIEW ROUTING */}
      <div className="flex-1">
        {currentView === 'landing' && (
          <PublicLandingView
            daftarLayanan={daftarLayanan}
            daftarDesa={daftarDesa}
            onNavigateLogin={() => setCurrentView('masuk')}
            onOpenVerifikasiKode={(kode) => {
              const all = getStoredPengajuan();
              const matched = all.find((p) => p.kode === kode);
              if (matched) {
                setVerifikasiTarget(matched);
                setCurrentView('verifikasi');
              }
            }}
          />
        )}

        {currentView === 'masuk' && (
          <LoginView
            daftarDesa={daftarDesa}
            onLoginWarga={handleLoginWargaSuccess}
            onLoginPetugas={handleLoginPetugasSuccess}
            onNavigateHome={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'warga' && currentUserWarga && (
          <WargaDashboard
            warga={currentUserWarga}
            daftarDesa={daftarDesa}
            daftarLayanan={daftarLayanan}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'desa' && currentUserPetugas && (
          <DesaDashboard
            user={currentUserPetugas}
            daftarDesa={daftarDesa}
            daftarLayanan={daftarLayanan}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'admin' && currentUserPetugas && (
          <AdminDashboard
            user={currentUserPetugas}
            daftarDesa={daftarDesa}
            daftarLayanan={daftarLayanan}
            onLogout={handleLogout}
            onOpenGasGuide={() => setIsGasGuideOpen(true)}
            onUpdateUser={(updatedUser) => setCurrentUserPetugas(updatedUser)}
          />
        )}

        {currentView === 'verifikasi' && verifikasiTarget && (
          <VerifikasiSuratView
            pengajuan={verifikasiTarget}
            onBack={() => setCurrentView('landing')}
          />
        )}
      </div>

      {/* GOOGLE APPS SCRIPT CODE & DEPLOYMENT GUIDE MODAL */}
      {isGasGuideOpen && (
        <GasGuideView onClose={() => setIsGasGuideOpen(false)} />
      )}
    </div>
  );
}
