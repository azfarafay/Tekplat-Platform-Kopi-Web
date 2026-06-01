import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const location = useLocation();
  const successMessage = location.state?.success || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + `/api/auth/login`,
        {
          email,
          password,
        },
      );

      // Handle multiple possible data structures
      let token, user;

      // Try different structures - backend ini: token di dalam data, user adalah seluruh data object
      if (response.data?.data?.token) {
        token = response.data.data.token;
        // User adalah seluruh object data (sudah berisi token, jadi extract yang perlu saja)
        // eslint-disable-next-line no-unused-vars
        const { token: _tok, ...userWithoutToken } = response.data.data;
        user = userWithoutToken;
      } else if (response.data?.token) {
        token = response.data.token;
        user = response.data;
      }

      if (!token || !user) {
        throw new Error(
          "Respons login tidak valid. Token atau user tidak ditemukan.",
        );
      }

      try {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (storageError) {
        throw new Error("Gagal menyimpan data login.", { cause: storageError });
      }

      const role = user?.role;
      if (role === "roastery") {
        navigate("/dashboard");
      } else {
        navigate("/select-roastery");
      }
    } catch (errorResponse) {
      const message =
        errorResponse?.response?.data?.message ||
        errorResponse?.message ||
        "Login gagal. Periksa kembali email dan kata sandi Anda.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Masuk</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gunakan akun Anda untuk mengakses dashboard.
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
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
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Login"}
          </button>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
