import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'Menunggu',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  processed: {
    label: 'Diproses',
    className: 'bg-sky-50 text-sky-700 border border-sky-200',
  },
  shipped: {
    label: 'Dikirim',
    className: 'bg-violet-50 text-violet-700 border border-violet-200',
  },
  completed: {
    label: 'Selesai',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status ?? '—',
    className: 'bg-stone-100 text-stone-500 border border-stone-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
};

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmtRp = (n) =>
  `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
const MyTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        const res = await axios.get('http://localhost:5000/api/transactions/my', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          setTransactions(res.data.data ?? []);
        } else {
          setError(res.data?.message ?? 'Gagal memuat transaksi.');
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        } else {
          setError(err.response?.data?.message ?? 'Terjadi kesalahan koneksi.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [navigate, handleLogout]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 selection:bg-amber-200">
      {/* Navbar */}
      <nav className="px-8 py-6 flex justify-between items-center border-b border-stone-200/60 bg-[#FDFBF7]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-baseline gap-4">
          <button
            onClick={() => navigate('/select-roastery')}
            className="text-sm font-medium text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Katalog
          </button>
          <span className="text-stone-300">/</span>
          <h1 className="text-lg font-serif font-semibold tracking-tight text-stone-900">
            Riwayat Pesanan<span className="text-amber-700">.</span>
          </h1>
          {user && (
            <span className="text-sm font-medium text-stone-500 tracking-wide hidden md:inline">
              {user.name}
              <span className="mx-2 opacity-40">•</span>
              <span className="capitalize">{user.role.replace('_', ' ')}</span>
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          Keluar
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12 max-w-2xl">
          <h2 className="text-4xl font-light tracking-tight text-stone-900 mb-3">
            Riwayat Pesanan.
          </h2>
          <p className="text-lg text-stone-500 leading-relaxed">
            Pantau status pengiriman setiap order yang pernah Anda buat.
          </p>
        </header>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 opacity-60">
            <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-stone-500 tracking-widest text-xs uppercase">Memuat data...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6 bg-red-50 text-red-800 border border-red-100 rounded-2xl">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && transactions.length === 0 && (
          <div className="py-24 text-center border border-dashed border-stone-300 rounded-[2rem]">
            <p className="text-stone-400 font-serif italic text-xl">Belum ada transaksi.</p>
          </div>
        )}

        {/* Transaction list */}
        {!loading && !error && transactions.length > 0 && (
          <div className="space-y-4">
            {transactions.map((trx) => {
              const id = trx.id ?? trx._id;
              const productName = trx.product_name ?? trx.product?.name ?? '—';
              const roasteryName = trx.roastery_name ?? trx.roastery?.name ?? null;
              const qty = trx.quantity ?? trx.qty ?? '—';
              const total = trx.total_price ?? trx.total ?? trx.amount;
              const date = trx.created_at ?? trx.date;

              return (
                <div
                  key={String(id)}
                  className="rounded-2xl border border-stone-200 bg-white px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Info utama */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-1.5">
                      <h3 className="text-base font-semibold text-stone-900 leading-snug truncate">
                        {productName}
                      </h3>
                      <StatusBadge status={trx.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
                      {roasteryName && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          {roasteryName}
                        </span>
                      )}
                      <span>{qty} kg</span>
                      <span>{fmtDate(date)}</span>
                    </div>
                  </div>

                  {/* Total harga */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-stone-400 uppercase tracking-widest mb-0.5">Total</p>
                    <p className="text-lg font-semibold text-stone-900">{fmtRp(total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTransactions;
