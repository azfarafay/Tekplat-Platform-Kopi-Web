import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const Catalog = () => {
  const { roasteryId } = useParams();
  const [products, setProducts] = useState([]);
  const [roasteryName, setRoasteryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(
          import.meta.env.VITE_API_URL +
            `/api/products?roastery_id=${roasteryId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data && response.data.success) {
          const data = response.data.data || [];
          setProducts(data);
          // Ambil nama roastery dari produk pertama jika tersedia
          if (data.length > 0 && data[0].roastery_name) {
            setRoasteryName(data[0].roastery_name);
          }
        } else {
          setError(response.data?.message || "Gagal memuat katalog.");
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

    if (roasteryId) fetchProducts();
  }, [roasteryId, navigate]);

  const openCheckoutModal = (kopi) => {
    setSelectedProduct(kopi);
    setQuantity(1);
    setOrderMessage("");
    setIsModalOpen(true);
  };

  const closeCheckoutModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setQuantity(1);
    setOrderMessage("");
  };

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setQuantity(Number.isNaN(value) || value < 1 ? 1 : value);
  };

  const handleCheckout = async () => {
    if (!selectedProduct) return;
    setOrderLoading(true);
    setOrderMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleLogout();
        return;
      }

      const response = await axios.post(
        import.meta.env.VITE_API_URL + `/api/transactions`,
        {
          product_id: selectedProduct.id || selectedProduct._id,
          quantity,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data && response.data.success) {
        setOrderMessage(response.data.message || "Pesanan berhasil dibuat.");
        setTimeout(() => {
          closeCheckoutModal();
          // Refresh produk setelah order
          setProducts((prev) =>
            prev.map((p) =>
              (p.id || p._id) === (selectedProduct.id || selectedProduct._id)
                ? { ...p, stock: Math.max(0, p.stock - quantity) }
                : p,
            ),
          );
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Gagal membuat pesanan.");
      }
    } catch (err) {
      setOrderMessage(
        err.response?.data?.message || err.message || "Gagal membuat pesanan.",
      );
    } finally {
      setOrderLoading(false);
    }
  };

  const productPrice = Number(selectedProduct?.price || 0);
  const effectiveQuantity = quantity > 0 ? quantity : 1;
  const totalPrice = productPrice * effectiveQuantity;
  const hasDiscount = effectiveQuantity > 10;
  const finalPrice = totalPrice - (hasDiscount ? totalPrice * 0.1 : 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 selection:bg-amber-200">
      {/* Navbar */}
      <nav className="px-8 py-6 flex justify-between items-center border-b border-stone-200/60 bg-[#FDFBF7]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-baseline gap-4">
          <button
            onClick={() => navigate("/select-roastery")}
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
            Roastery
          </button>
          <span className="text-stone-300">/</span>
          <h1 className="text-lg font-serif font-semibold tracking-tight text-stone-900">
            {roasteryName || "Katalog"}
            <span className="text-amber-700">.</span>
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

      <main className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-16 max-w-2xl">
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-stone-900 mb-4">
            {roasteryName ? `Katalog ${roasteryName}.` : "Katalog Produk."}
          </h2>
          <p className="text-lg text-stone-500 leading-relaxed">
            Temukan profil sangrai yang sesuai dengan karakter kedai Anda.
            Transaksi B2B transparan, langsung dari roastery.
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

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="py-24 text-center border border-dashed border-stone-300 rounded-[2rem]">
            <p className="text-stone-400 font-serif italic text-xl">
              Katalog sedang kosong...
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {products.map((kopi) => (
              <div key={kopi.id || kopi._id} className="group cursor-pointer">
                <div className="relative w-full aspect-[4/3] bg-stone-100 rounded-[2rem] overflow-hidden mb-6">
                  <img
                    src={
                      kopi.image_url ||
                      "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=600"
                    }
                    alt={kopi.name || "Coffee Beans"}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-in-out"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#FDFBF7]/90 backdrop-blur-sm text-stone-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                      {kopi.roast_level}
                    </span>
                  </div>
                </div>

                <div className="px-2">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-medium text-stone-900 leading-snug">
                      {kopi.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-amber-700 font-medium">
                      {kopi.origin}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                    <span className="text-sm text-stone-500">
                      Stok: {kopi.stock} kg
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-stone-200/70">
                    <div className="flex flex-col">
                      <span className="text-xs text-stone-400 uppercase tracking-widest mb-1">
                        Harga B2B
                      </span>
                      <span className="text-lg font-semibold text-stone-900">
                        Rp {Number(kopi.price).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <button
                      onClick={() => openCheckoutModal(kopi)}
                      className="text-sm font-semibold border-b-2 border-stone-900 pb-0.5 text-stone-900 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                    >
                      Beli Sekarang
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-stone-200 bg-[#FDFBF7] p-8 shadow-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-amber-700">
                  Checkout
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-stone-900">
                  {selectedProduct.name}
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  Harga satuan: Rp {productPrice.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={closeCheckoutModal}
                className="text-sm font-semibold text-stone-500 hover:text-stone-900"
              >
                Tutup
              </button>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6">
                <label className="block text-sm font-medium text-stone-700 mb-3">
                  Jumlah Pesanan
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-lg text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6">
                <p className="text-sm text-stone-500 uppercase tracking-[0.18em] mb-4">
                  Ringkasan Pembayaran
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-stone-500">Harga asli</p>
                    <p className="mt-2 text-xl font-semibold text-stone-900">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </p>
                  </div>

                  {hasDiscount && (
                    <div className="rounded-3xl bg-amber-50 p-4 border border-amber-100">
                      <p className="text-sm font-semibold text-amber-700">
                        Diskon 10%
                      </p>
                      <p className="mt-2 text-sm text-stone-500 line-through">
                        Rp {totalPrice.toLocaleString("id-ID")}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-stone-900">
                        Rp {finalPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                  )}

                  {!hasDiscount && (
                    <div>
                      <p className="text-sm text-stone-500">Total akhir</p>
                      <p className="mt-2 text-3xl font-semibold text-stone-900">
                        Rp {finalPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={orderLoading}
                    className="w-full rounded-3xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {orderLoading ? "Memproses..." : "Konfirmasi Pesanan"}
                  </button>

                  {orderMessage && (
                    <p
                      className={`text-sm ${orderMessage.toLowerCase().includes("berhasil") ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {orderMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
