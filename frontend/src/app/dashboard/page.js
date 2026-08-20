'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WargaDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data Dashboard & Transaksi
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalWeightKg: 0,
    totalTransactions: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  // Filters & State untuk Tab Transaksi
  const [txSearch, setTxSearch] = useState('');
  const [txCategoryFilter, setTxCategoryFilter] = useState('semua');

  // State untuk Modal Tukar Poin
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeemPhone, setRedeemPhone] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [redeemError, setRedeemError] = useState('');

  // State Kalkulator Tarif Sampah
  const [calcType, setCalcType] = useState('plastik');
  const [calcWeight, setCalcWeight] = useState(1);

  // Load user data & dashboard statistics
  useEffect(() => {
    const storedUser = localStorage.getItem('ecosync_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchDashboardData(parsedUser.id);
    } catch (err) {
      console.error('Failed to load user session', err);
      router.push('/login');
    }
  }, [router]);

  const fetchDashboardData = async (userId) => {
    setLoading(true);
    try {
      // Fetch summary stats & recent transactions
      const resStats = await fetch(`http://localhost:3000/api/users/${userId}/dashboard`);
      if (resStats.ok) {
        const dataStats = await resStats.json();
        setStats(dataStats.stats || { totalPoints: 0, totalWeightKg: 0, totalTransactions: 0 });
        setRecentTransactions(dataStats.recentTransactions || []);
      }

      // Fetch all transactions
      const resTx = await fetch(`http://localhost:3000/api/transactions/user/${userId}`);
      if (resTx.ok) {
        const dataTx = await resTx.json();
        setAllTransactions(dataTx || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ecosync_user');
    router.push('/login');
  };

  // Rates Poin per Sampah
  const wasteRates = [
    { type: 'plastik', name: 'Plastik (Botol, Gelas, Ember)', points: 100, icon: '🥤', bg: 'bg-amber-50 text-amber-700 border-amber-200', examples: 'Botol mineral, gelas plastik, kemasan deterjen, mainan bekas' },
    { type: 'logam', name: 'Logam & Kaleng', points: 200, icon: '🥫', bg: 'bg-slate-50 text-slate-700 border-slate-200', examples: 'Kaleng minuman, potongan besi, aluminium foil, panci bekas' },
    { type: 'kertas', name: 'Kertas & Kardus', points: 50, icon: '📦', bg: 'bg-orange-50 text-orange-700 border-orange-200', examples: 'Kardus kemasan, majalah, koran bekas, buku sekolah' },
    { type: 'kaca', name: 'Kaca & Botol Beling', points: 75, icon: '🍾', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', examples: 'Botol kecap, sirup, toples kaca, cermin utuh' },
    { type: 'elektronik', name: 'E-Waste (Elektronik)', points: 300, icon: '⚡', bg: 'bg-purple-50 text-purple-700 border-purple-200', examples: 'Kabel bekas, HP rusak, komponen komputer, charger' }
  ];

  // Katalog Hadiah Penukaran Poin
  const rewardCatalog = [
    { id: 1, category: 'ewallet', name: 'Saldo GoPay Rp 10.000', cost: 1000, provider: 'GoPay', icon: '📱', color: 'from-emerald-500 to-teal-600' },
    { id: 2, category: 'ewallet', name: 'Saldo OVO Rp 25.000', cost: 2400, provider: 'OVO', icon: '🟣', color: 'from-purple-500 to-indigo-600' },
    { id: 3, category: 'ewallet', name: 'Saldo DANA Rp 50.000', cost: 4800, provider: 'DANA', icon: '🔵', color: 'from-blue-500 to-cyan-600' },
    { id: 4, category: 'pulsa', name: 'Pulsa All Operator Rp 20.000', cost: 2000, provider: 'Seluler', icon: '📞', color: 'from-red-500 to-rose-600' },
    { id: 5, category: 'pulsa', name: 'Paket Data Internet 5GB', cost: 3500, provider: 'Seluler', icon: '📶', color: 'from-amber-500 to-orange-600' },
    { id: 6, category: 'sembako', name: 'Voucher Sembako Minyak Goreng 1L', cost: 1500, provider: 'Toko Komunitas', icon: '🧴', color: 'from-yellow-500 to-amber-600' },
    { id: 7, category: 'sembako', name: 'Paket Beras Segar 5 Kg', cost: 6000, provider: 'Toko Komunitas', icon: '🌾', color: 'from-lime-500 to-green-600' },
    { id: 8, category: 'merchandise', name: 'Tumbler EcoSync Limited Edition', cost: 2500, provider: 'EcoSync', icon: '🥛', color: 'from-teal-500 to-emerald-700' }
  ];

  const handleRedeemSubmit = (e) => {
    e.preventDefault();
    setRedeemError('');
    setRedeemSuccess('');

    if (!selectedReward) return;

    if (stats.totalPoints < selectedReward.cost) {
      setRedeemError(`Poin Anda (${stats.totalPoints.toLocaleString()}) belum mencukupi untuk menukar ${selectedReward.name} (${selectedReward.cost.toLocaleString()} Poin).`);
      return;
    }

    if (!redeemPhone || redeemPhone.length < 9) {
      setRedeemError('Harap masukkan nomor HP / akun penukaran yang valid.');
      return;
    }

    // Simulasi penukaran sukses
    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints - selectedReward.cost
    }));

    setRedeemSuccess(`Selamat! Permintaan penukaran ${selectedReward.name} ke nomor ${redeemPhone} sedang diproses. Poin Anda telah berkurang ${selectedReward.cost.toLocaleString()}.`);
    setTimeout(() => {
      setSelectedReward(null);
      setRedeemPhone('');
      setRedeemSuccess('');
    }, 3000);
  };

  // Filtered transactions list
  const filteredTransactions = allTransactions.filter(tx => {
    const matchSearch = tx.wasteType.toLowerCase().includes(txSearch.toLowerCase()) ||
                        new Date(tx.createdAt).toLocaleDateString('id-ID').includes(txSearch);
    const matchCategory = txCategoryFilter === 'semua' || tx.wasteType.toLowerCase().includes(txCategoryFilter.toLowerCase());
    return matchSearch && matchCategory;
  });

  // Calculate carbon impact estimate (approx. 1.5 kg CO2 offset per kg recycled waste)
  const co2Offset = (stats.totalWeightKg * 1.5).toFixed(1);
  const treesEquivalent = (stats.totalWeightKg * 0.08).toFixed(1);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-emerald-200 font-medium">Memuat Dashboard Warga EcoSync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
              🌱
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">EcoSync</h1>
              <p className="text-xs text-slate-400 font-medium">Portal Warga Digital</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* User Info Pill in Sidebar */}
        <div className="p-4 mx-4 mt-4 bg-slate-800/80 rounded-xl border border-slate-700/50 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Warga EcoSync'}</p>
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
              Warga Aktif
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'overview' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <span className="text-lg">📊</span>
            <span>Beranda</span>
          </button>

          <button
            onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'transactions' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <span className="text-lg">📜</span>
            <span>Riwayat Setoran</span>
          </button>

          <button
            onClick={() => { setActiveTab('rewards'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'rewards' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <span className="text-lg">🎁</span>
            <span>Tukar Poin</span>
            {stats.totalPoints > 0 && (
              <span className="ml-auto bg-amber-500 text-slate-950 font-bold text-[11px] px-2 py-0.5 rounded-full">
                {stats.totalPoints.toLocaleString()} pt
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('guides'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'guides' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <span className="text-lg">💡</span>
            <span>Panduan & Tarif</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'profile' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <span className="text-lg">👤</span>
            <span>Profil Saya</span>
          </button>
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white rounded-xl font-medium text-sm transition duration-200"
          >
            <span>🚪</span>
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              ☰
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === 'overview' && '📊 Dashboard Utama Warga'}
                {activeTab === 'transactions' && '📜 Riwayat Setoran Sampah'}
                {activeTab === 'rewards' && '🎁 Penukaran Poin & Hadiah'}
                {activeTab === 'guides' && '💡 Panduan Pemilahan & Tarif Poin'}
                {activeTab === 'profile' && '👤 Informasi Profil Akun'}
              </h2>
              <p className="text-xs text-slate-500">Kelola dan pantau kontribusi hijau Anda bersama EcoSync</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Points Display Pill */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-full">
              <span className="text-amber-600 text-sm">⭐</span>
              <span className="text-xs font-semibold text-slate-700">Poin Anda:</span>
              <span className="text-sm font-extrabold text-emerald-700">{stats.totalPoints.toLocaleString()} pt</span>
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
              </div>
              <span className="hidden lg:inline text-sm font-medium text-slate-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* BODY TAB CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

          {/* TAB 1: OVERVIEW / BERANDA */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* WELCOME HERO CARD */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white p-6 md:p-8 shadow-xl">
                <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none text-9xl font-black select-none pr-8">
                  🌱
                </div>
                <div className="max-w-2xl space-y-3 relative z-10">
                  <span className="inline-block px-3 py-1 bg-emerald-500/30 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-200">
                    EcoSync Warga Hub
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    Selamat datang kembali, {user?.name || 'Warga EcoSync'}! 👋
                  </h3>
                  <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
                    Terima kasih telah aktif menyetorkan sampah daur ulang. Setiap kilogram sampah yang Anda setorkan membantu menjaga kebersihan lingkungan kelurahan dan mengumpulkan poin hadiah!
                  </p>
                  <div className="pt-3 flex flex-wrap gap-3">
                    <button 
                      onClick={() => setActiveTab('guides')}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg flex items-center space-x-2"
                    >
                      <span>💡 Cek Tarif & Cara Setor</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('rewards')}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl text-sm transition backdrop-blur-xs flex items-center space-x-2"
                    >
                      <span>🎁 Tukar Poin Hadiah</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* STATS METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Metric 1 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Poin</span>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold">
                      ⭐
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-3xl font-extrabold text-slate-900">{stats.totalPoints.toLocaleString()}</h4>
                    <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
                      <span>Siap ditukarkan hadiah</span>
                    </p>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Sampah Disetor</span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                      ⚖️
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-3xl font-extrabold text-slate-900">{stats.totalWeightKg} <span className="text-lg font-medium text-slate-500">kg</span></h4>
                    <p className="text-xs text-slate-500 mt-1">Akumulasi total berat</p>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Frekuensi Setor</span>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                      🔄
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-3xl font-extrabold text-slate-900">{stats.totalTransactions} <span className="text-lg font-medium text-slate-500">kali</span></h4>
                    <p className="text-xs text-slate-500 mt-1">Transaksi tercatat di bank sampah</p>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Dampak Lingkungan</span>
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold">
                      🌳
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-2xl font-extrabold text-slate-900">~{co2Offset} <span className="text-sm font-medium text-slate-500">kg CO₂</span></h4>
                    <p className="text-xs text-emerald-600 font-medium mt-1">Setara menanam ±{treesEquivalent} pohon</p>
                  </div>
                </div>
              </div>

              {/* TWO COLUMN CONTENT: RECENT TRANSACTIONS & QUICK RATES */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* RECENT TRANSACTIONS LIST */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">🕒 Setoran Terakhir</h4>
                      <p className="text-xs text-slate-500">5 aktivitas penyetoran sampah paling baru</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('transactions')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      Lihat Semua →
                    </button>
                  </div>

                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="text-4xl">📦</div>
                      <p className="text-slate-500 text-sm font-medium">Belum ada riwayat setoran sampah.</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Bawa sampah daur ulang Anda ke Bank Sampah terdekat untuk dicatat oleh petugas admin.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {recentTransactions.map((tx) => (
                        <div key={tx.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg">
                              {tx.wasteType.toLowerCase().includes('plastik') ? '🥤' :
                               tx.wasteType.toLowerCase().includes('logam') ? '🥫' :
                               tx.wasteType.toLowerCase().includes('kertas') ? '📦' :
                               tx.wasteType.toLowerCase().includes('kaca') ? '🍾' : '♻️'}
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-slate-900 capitalize">{tx.wasteType}</h5>
                              <p className="text-xs text-slate-400">
                                {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-emerald-600 block">+{tx.pointsEarned} Poin</span>
                            <span className="text-xs text-slate-500 font-medium">{tx.weightKg} kg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* QUICK RATES & CALCULATOR CARD */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                      <span>⚡ Estimator Cepat</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">Hitung Estimasi Poin</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Ketahui berapa poin yang bisa didapat sebelum membawa sampah ke Bank Sampah.
                    </p>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Jenis Sampah</label>
                        <select 
                          value={calcType}
                          onChange={(e) => setCalcType(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="plastik">Plastik (100 pt/kg)</option>
                          <option value="logam">Logam & Kaleng (200 pt/kg)</option>
                          <option value="kertas">Kertas & Kardus (50 pt/kg)</option>
                          <option value="kaca">Kaca & Beling (75 pt/kg)</option>
                          <option value="elektronik">E-Waste / Elektronik (300 pt/kg)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estimasi Berat (Kg)</label>
                        <input 
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={calcWeight}
                          onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Calculation Result */}
                      <div className="p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                        <span className="text-xs text-emerald-200">Estimasi Perolehan:</span>
                        <span className="text-xl font-extrabold text-emerald-400">
                          +{Math.round((calcWeight || 0) * (wasteRates.find(r => r.type === calcType)?.points || 50))} Poin
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('guides')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
                  >
                    Lihat Seluruh Daftar Tarif Lengkap →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT SETORAN (TRANSACTIONS) */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Header & Filter Controls */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">📜 Seluruh Transaksi Setoran</h3>
                    <p className="text-xs text-slate-500">Daftar lengkap riwayat penyetoran sampah daur ulang Anda</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-medium">Total: {filteredTransactions.length} Transaksi</span>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="Cari jenis sampah (misal: Plastik, Kertas)..."
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                  </div>

                  <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                    {['semua', 'plastik', 'logam', 'kertas', 'kaca'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setTxCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${txCategoryFilter === cat ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="text-5xl">📄</div>
                    <p className="text-slate-600 font-semibold text-base">Tidak ada transaksi ditemukan.</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Coba ganti kata kunci pencarian atau filter jenis sampah Anda.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">ID / Tanggal</th>
                          <th className="px-6 py-4">Jenis Sampah</th>
                          <th className="px-6 py-4">Berat Setoran</th>
                          <th className="px-6 py-4">Poin Diperoleh</th>
                          <th className="px-6 py-4">Status Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-semibold text-slate-900 block">#TX-{tx.id}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {tx.wasteType.toLowerCase().includes('plastik') ? '🥤' :
                                   tx.wasteType.toLowerCase().includes('logam') ? '🥫' :
                                   tx.wasteType.toLowerCase().includes('kertas') ? '📦' : '♻️'}
                                </span>
                                <span className="font-semibold text-slate-800 capitalize">{tx.wasteType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">
                              {tx.weightKg} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-extrabold text-emerald-600">
                              +{tx.pointsEarned} pt
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ✓ Terverifikasi petugas
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TUKAR POIN (REWARDS CATALOG) */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              {/* Rewards Header Banner */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="px-2.5 py-0.5 bg-black/20 text-xs font-semibold rounded-full">Katalog Hadiah Warga</span>
                  <h3 className="text-2xl font-extrabold">Tukarkan Poin Sampah Anda 🎉</h3>
                  <p className="text-amber-100 text-sm">Gunakan poin dari hasil penyetoran sampah untuk mendapatkan e-Wallet, pulsa, dan voucher sembako!</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/30 px-5 py-3 rounded-2xl text-center">
                  <span className="text-xs text-amber-100 font-medium block">Poin Tersedia</span>
                  <span className="text-2xl font-extrabold text-white">{stats.totalPoints.toLocaleString()} pt</span>
                </div>
              </div>

              {/* Reward Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {rewardCatalog.map(reward => {
                  const canRedeem = stats.totalPoints >= reward.cost;
                  return (
                    <div key={reward.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
                      <div className="p-5">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${reward.color} text-white flex items-center justify-center text-2xl shadow-sm mb-4`}>
                          {reward.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{reward.provider}</span>
                        <h4 className="text-base font-bold text-slate-900 mt-0.5">{reward.name}</h4>
                        <div className="mt-3 flex items-baseline space-x-1">
                          <span className="text-xl font-extrabold text-emerald-600">{reward.cost.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 font-semibold">Poin</span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setSelectedReward(reward);
                            setRedeemError('');
                            setRedeemSuccess('');
                          }}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${canRedeem ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          {canRedeem ? '🎁 Tukar Sekarang' : 'Poin Belum Cukup'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PANDUAN & TARIF SAMPAH */}
          {activeTab === 'guides' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <h3 className="text-xl font-bold text-slate-900">💡 Panduan Memilah & Daftar Tarif Poin Sampah</h3>
                <p className="text-sm text-slate-600">
                  Pastikan sampah yang Anda setor sudah dibersihkan, dikeringkan, dan dipilah sesuai kategorinya agar mendapatkan poin maksimal.
                </p>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wasteRates.map(rate => (
                  <div key={rate.type} className={`rounded-2xl p-6 border ${rate.bg} shadow-xs space-y-4 flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{rate.icon}</span>
                        <span className="px-3 py-1 bg-white/80 border rounded-full font-extrabold text-sm shadow-xs">
                          {rate.points} pt / kg
                        </span>
                      </div>
                      <h4 className="text-lg font-extrabold text-slate-900 mt-3">{rate.name}</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        <strong>Contoh Sampah:</strong> {rate.examples}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-500 italic">
                      💡 Tip: Bilas dan keringkan sebelum disetorkan ke petugas bank sampah.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PROFIL WARGA */}
          {activeTab === 'profile' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-100">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{user?.name}</h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                      <span className="px-3 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                        Role: {user?.role || 'warga'}
                      </span>
                      <span className="px-3 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                        Pahlawan Hijau Level 1
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                    <p className="text-base font-semibold text-slate-800 mt-1">{user?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Alamat Email</label>
                    <p className="text-base font-semibold text-slate-800 mt-1">{user?.email || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nomor Telepon / WhatsApp</label>
                    <p className="text-base font-semibold text-slate-800 mt-1">{user?.phone || 'Belum diisi'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">ID Anggota</label>
                    <p className="text-base font-semibold text-slate-800 mt-1">ECO-WARGA-{user?.id || '00'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL REDEEM REWARD */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-lg font-bold text-slate-900">Konfirmasi Penukaran Hadiah</h4>
              <button 
                onClick={() => setSelectedReward(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {redeemSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-medium border border-emerald-200 text-center space-y-2">
                <div className="text-3xl">🎉</div>
                <p>{redeemSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleRedeemSubmit} className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center space-x-3">
                  <div className="text-3xl">{selectedReward.icon}</div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{selectedReward.name}</h5>
                    <p className="text-xs text-emerald-600 font-extrabold">{selectedReward.cost.toLocaleString()} Poin EcoSync</p>
                  </div>
                </div>

                {redeemError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {redeemError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor HP / Akun Tujuan ({selectedReward.provider})</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: 081234567890"
                    value={redeemPhone}
                    onChange={(e) => setRedeemPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReward(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md"
                  >
                    Konfirmasi Tukar Poin
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
