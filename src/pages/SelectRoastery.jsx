import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SelectRoastery = () => {
  const [roasteries, setRoasteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    const fetchRoasteries = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(
          "http://localhost:5000/api/products/roasteries",
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data && response.data.success) {
          setRoasteries(response.data.data || []);
        } else {
          setError(response.data?.message || "Gagal memuat daftar roastery.");
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        } else {
          setError(err.response?.data?.message || "Terjadi kesalahan koneksi.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoasteries();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 selection:bg-amber-200">
      {/* Navbar */}
      <nav className="px-8 py-6 flex justify-between items-center border-b border-stone-200/60 bg-[#FDFBF7]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-stone-900">
            Katalog<span className="text-amber-700">.</span>
          </h1>
          {user && (
            <span className="text-sm font-medium text-stone-500 tracking-wide">
              {user.name}
              <span className="mx-2 opacity-40">•</span>
              <span className="capitalize">{user.role.replace("_", " ")}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate("/my-transactions")}
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            Riwayat Pesanan
          </button>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            Keluar
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-16 max-w-2xl">
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-stone-900 mb-4">
            Pilih Roastery.
          </h2>
          <p className="text-lg text-stone-500 leading-relaxed">
            Jelajahi roastery artisan lokal pilihan kami. Pilih satu untuk
            melihat katalog stok dan harga langsung dari sumbernya.
          </p>
        </header>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 opacity-60">
            <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-stone-500 tracking-widest text-xs uppercase">
              Menyeduh Data...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6 bg-red-50 text-red-800 border border-red-100 rounded-2xl">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && roasteries.length === 0 && (
          <div className="py-24 text-center border border-dashed border-stone-300 rounded-[2rem]">
            <p className="text-stone-400 font-serif italic text-xl">
              Belum ada roastery yang terdaftar...
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && roasteries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roasteries.map((roastery) => {
              const id = roastery.id || roastery._id || roastery.roastery_id;
              const name = roastery.name || roastery.roastery_name;
              const location =
                roastery.location || roastery.city || roastery.origin || null;
              const productCount =
                roastery.product_count ?? roastery.total_products ?? null;

              return (
                <div
                  key={String(id)}
                  className="group flex flex-col rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm hover:shadow-lg hover:border-stone-300 transition-all duration-300"
                >
                  {/* Icon roastery */}
                  <div className="mb-6 w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-amber-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-stone-900 mb-2 leading-snug">
                      {name}
                    </h3>
                    {location && (
                      <p className="text-sm text-amber-700 font-medium mb-1">
                        {location}
                      </p>
                    )}
                    {productCount !== null && (
                      <p className="text-sm text-stone-400">
                        {productCount} varian produk tersedia
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-8 pt-6 border-t border-stone-100">
                    <button
                      onClick={() => navigate(`/catalog/${id}`)}
                      className="w-full rounded-3xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 group-hover:bg-amber-700"
                    >
                      Lihat Stok
                    </button>
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

export default SelectRoastery;
