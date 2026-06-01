import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ─── Urutan status yang valid ─────────────────────────────────────────────────
const STATUS_FLOW = ["pending", "processed", "shipped", "completed"];

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
    dotClass: "bg-amber-400",
  },
  processed: {
    label: "Diproses",
    badgeClass: "bg-sky-50 text-sky-700 border border-sky-200",
    dotClass: "bg-sky-400",
  },
  shipped: {
    label: "Dikirim",
    badgeClass: "bg-violet-50 text-violet-700 border border-violet-200",
    dotClass: "bg-violet-400",
  },
  completed: {
    label: "Selesai",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dotClass: "bg-emerald-400",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status ?? "—",
    badgeClass: "bg-stone-100 text-stone-500 border border-stone-200",
    dotClass: "bg-stone-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${cfg.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
};

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmtRp = (n) => `Rp ${Number(n ?? 0).toLocaleString("id-ID")}`;

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

// ─── Dropdown status per baris ────────────────────────────────────────────────
const StatusDropdown = ({
  transactionId,
  currentStatus,
  onStatusChange,
  updating,
}) => {
  const isUpdating = updating === transactionId;

  return (
    <div className="relative flex items-center gap-2">
      {isUpdating && (
        <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      <select
        value={currentStatus}
        disabled={isUpdating}
        onChange={(e) => onStatusChange(transactionId, e.target.value)}
        className="text-xs font-medium rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-stone-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {STATUS_FLOW.map((s) => (
          <option key={s} value={s}>
            {STATUS_CONFIG[s]?.label ?? s}
          </option>
        ))}
      </select>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const IncomingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null); // ID transaksi yang sedang di-update
  const [updateError, setUpdateError] = useState(""); // error per-update
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState("");
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }, [navigate]);

  // ─── Fetch orders ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const res = await axios.get(
          import.meta.env.VITE_API_URL + `/api/transactions/roastery/list`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.data?.success) {
          const data = res.data.data ?? [];
          // DEBUG: lihat semua key yang dikembalikan backend untuk tiap order
          if (data.length > 0)
            console.log(
              "[IncomingOrders] sample order keys:",
              Object.keys(data[0]),
              data[0],
            );
          setOrders(data);
        } else {
          setError(res.data?.message ?? "Gagal memuat pesanan.");
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        } else {
          setError(err.response?.data?.message ?? "Terjadi kesalahan koneksi.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate, handleLogout]);

  // ─── Handler update status ──────────────────────────────────────────────────
  const handleStatusChange = useCallback(
    async (transactionId, newStatus) => {
      setUpdatingId(transactionId);
      setUpdateError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          handleLogout();
          return;
        }

        const res = await axios.put(
          import.meta.env.VITE_API_URL +
            `/api/transactions/${transactionId}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.data?.success) {
          // Update state lokal — tidak perlu refresh halaman
          setOrders((prev) =>
            prev.map((o) =>
              String(o.id ?? o._id) === String(transactionId)
                ? { ...o, status: newStatus }
                : o,
            ),
          );
        } else {
          setUpdateError(res.data?.message ?? "Gagal mengubah status.");
        }
      } catch (err) {
        setUpdateError(
          err.response?.data?.message ??
            err.message ??
            "Gagal mengubah status.",
        );
      } finally {
        setUpdatingId(null);
      }
    },
    [handleLogout],
  );

  // ─── Export CSV ───────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(async () => {
    setExportLoading(true);
    setExportError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleLogout();
        return;
      }

      const res = await fetch(
        import.meta.env.VITE_API_URL + `/api/transactions/roastery/export`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) {
        // Coba baca pesan error dari body JSON jika ada
        let msg = `Gagal mengunduh (${res.status})`;
        try {
          const json = await res.json();
          msg = json.message ?? msg;
        } catch {
          /* body bukan JSON, biarkan pesan default */
        }
        throw new Error(msg);
      }

      // Deteksi apakah server mengirim CSV atau JSON lalu konversi di client
      const contentType = res.headers.get("content-type") ?? "";
      let csvText;

      if (
        contentType.includes("text/csv") ||
        contentType.includes("text/plain")
      ) {
        // Server sudah kirim CSV langsung
        csvText = await res.text();
      } else {
        // Server kirim JSON → konversi ke CSV di sisi client sebagai fallback
        const json = await res.json();
        const rows = json.data ?? json ?? [];
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error("Tidak ada data untuk diekspor.");
        }
        const headers = Object.keys(rows[0]);
        const escape = (v) => {
          const s = String(v ?? "").replace(/"/g, '""');
          return /[,"\n]/.test(s) ? `"${s}"` : s;
        };
        csvText = [
          headers.join(","),
          ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
        ].join("\n");
      }

      // Trigger download ke perangkat user
      const blob = new Blob(["\uFEFF" + csvText], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const link = document.createElement("a");
      link.href = url;
      link.download = `laporan-penjualan-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message ?? "Gagal mengunduh laporan.");
    } finally {
      setExportLoading(false);
    }
  }, [handleLogout]);

  // ─── Filter aktif ───────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState("all");

  const displayed =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 selection:bg-amber-200">
      {/* Navbar */}
      <nav className="px-8 py-6 flex justify-between items-center border-b border-stone-200/60 bg-[#FDFBF7]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-baseline gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm font-medium text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </button>
          <span className="text-stone-300">/</span>
          <h1 className="text-lg font-serif font-semibold tracking-tight text-stone-900">
            Pesanan Masuk<span className="text-amber-700">.</span>
          </h1>
          {user && (
            <span className="text-sm font-medium text-stone-500 tracking-wide hidden md:inline">
              {user.name}
              <span className="mx-2 opacity-40">•</span>
              <span className="capitalize">{user.role.replace("_", " ")}</span>
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

      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h2 className="text-4xl font-light tracking-tight text-stone-900 mb-3">
              Pesanan Masuk.
            </h2>
            <p className="text-lg text-stone-500 leading-relaxed">
              Kelola dan perbarui status setiap order dari coffee shop.
            </p>
          </div>

          {/* Tombol export + filter tabs */}
          <div className="flex flex-col items-end gap-3">
            {/* Export button */}
            <button
              onClick={handleExportCSV}
              disabled={exportLoading || loading || orders.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 hover:border-stone-300 hover:text-stone-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 text-stone-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Unduh Laporan Penjualan (CSV)</span>
                </>
              )}
            </button>
            {exportError && (
              <p className="text-xs text-red-600">{exportError}</p>
            )}

            {/* Filter tabs */}
            {!loading && orders.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {["all", ...STATUS_FLOW].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      filterStatus === s
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    {s === "all" ? "Semua" : (STATUS_CONFIG[s]?.label ?? s)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* update error global */}
        {updateError && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-sm">
            {updateError}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 opacity-60">
            <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-stone-500 tracking-widest text-xs uppercase">
              Memuat pesanan...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6 bg-red-50 text-red-800 border border-red-100 rounded-2xl">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="py-24 text-center border border-dashed border-stone-300 rounded-[2rem]">
            <p className="text-stone-400 font-serif italic text-xl">
              Belum ada pesanan masuk.
            </p>
          </div>
        )}

        {/* Empty after filter */}
        {!loading && !error && orders.length > 0 && displayed.length === 0 && (
          <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl">
            <p className="text-stone-400 text-sm italic">
              Tidak ada pesanan dengan status ini.
            </p>
          </div>
        )}

        {/* Order list */}
        {!loading && !error && displayed.length > 0 && (
          <div className="space-y-2">
            {/* Thead label — 6 kolom: [produk] [customer] [qty] [total] [tanggal] [status+aksi] */}
            <div className="hidden sm:grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)_4.5rem_8rem_6.5rem_10rem] gap-x-4 px-6 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-widest">
              <span>Produk</span>
              <span>Customer</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Total</span>
              <span className="text-right">Tanggal</span>
              <span className="text-center">Status &amp; Aksi</span>
            </div>

            {displayed.map((order) => {
              const id = String(order.id ?? order._id);
              const productName =
                order.product_name ?? order.product?.name ?? "—";

              // Coba semua kemungkinan field nama customer dari berbagai shape response
              const buyerName =
                order.buyer_name ??
                order.customer_name ??
                order.user_name ??
                order.username ??
                order.user?.name ??
                order.user?.username ??
                order.coffee_shop_name ??
                order.buyer?.name ??
                null;

              const qty = order.quantity ?? order.qty ?? "—";
              const total = order.total_price ?? order.total ?? order.amount;
              const date = order.created_at ?? order.date;

              return (
                <div
                  key={id}
                  className="rounded-2xl border border-stone-200 bg-white px-6 py-5 grid grid-cols-1 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)_4.5rem_8rem_6.5rem_10rem] gap-x-4 items-center"
                >
                  {/* Produk */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {productName}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex w-5 h-5 rounded-full bg-stone-100 items-center justify-center shrink-0">
                        <svg
                          className="w-3 h-3 text-stone-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      {buyerName ? (
                        <p className="text-sm text-stone-700 truncate font-medium">
                          {buyerName}
                        </p>
                      ) : (
                        <p className="text-xs text-stone-300 italic truncate">
                          tidak diketahui
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Qty */}
                  <div className="text-sm text-stone-600 text-right">
                    <span className="sm:hidden text-xs text-stone-400 mr-1">
                      Qty:
                    </span>
                    {qty} kg
                  </div>

                  {/* Total */}
                  <div className="text-sm font-semibold text-stone-900 text-right">
                    <span className="sm:hidden text-xs text-stone-400 mr-1">
                      Total:
                    </span>
                    {fmtRp(total)}
                  </div>

                  {/* Tanggal */}
                  <div className="text-xs text-stone-400 text-right whitespace-nowrap">
                    {fmtDate(date)}
                  </div>

                  {/* Status badge (atas) + dropdown aksi (bawah) — rapi vertikal */}
                  <div className="flex flex-col items-center gap-1.5">
                    <StatusBadge status={order.status} />
                    <StatusDropdown
                      transactionId={id}
                      currentStatus={order.status}
                      onStatusChange={handleStatusChange}
                      updating={updatingId}
                    />
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

export default IncomingOrders;
