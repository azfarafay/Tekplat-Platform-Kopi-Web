import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await axios.post(`${BASE}/api/auth/forgot-password`, {
        email,
      });

      setMessage(response.data?.message || "Link reset telah dikirim ke email Anda. Silakan periksa kotak masuk Anda.");
      alert("Link reset telah dikirim ke email Anda");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Gagal mengirim email reset. Pastikan email Anda benar.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Lupa Password</h1>
          <p className="mt-2 text-sm text-slate-500">
            Masukkan email Anda untuk menerima link reset password.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="nama@email.com"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Kirim Link Reset"}
          </button>

          <p className="text-center text-sm text-slate-600">
            Ingat password Anda?{" "}
            <Link
              to="/"
              className="font-semibold text-sky-600 hover:text-sky-500"
            >
              Kembali ke Login
            </Link>
          </p>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
