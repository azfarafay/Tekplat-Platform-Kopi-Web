import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Format data untuk tooltip (di luar komponen untuk menghindari render berulang)
const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// Formatter untuk sumbu Y (menyingkat jutaan)
const formatYAxis = (tickItem) => {
  if (tickItem >= 1000000) {
    return (tickItem / 1000000).toFixed(0) + " Jt";
  } else if (tickItem >= 1000) {
    return (tickItem / 1000).toFixed(0) + " Rb";
  }
  return tickItem;
};

// Custom Tooltip dipindah ke luar komponen utama
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-stone-200">
        <p className="text-sm font-semibold text-stone-800">
          {payload[0].payload.monthName}
        </p>
        <p className="text-sm text-blue-600">
          Volume:{" "}
          {(Number(payload[0].payload.totalVolume) || 0).toLocaleString(
            "id-ID",
          )}{" "}
          kg
        </p>
        <p className="text-sm text-green-600">
          Pendapatan: {formatCurrency(payload[0].payload.totalRevenue)}
        </p>
      </div>
    );
  }
  return null;
};

const TrendAnalysis = ({ roasteryId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartType, setChartType] = useState("line"); // 'line' or 'bar'

  const fetchTrendData = useCallback(async () => {
    if (!roasteryId) {
      setError("Roastery ID tidak ditemukan");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token tidak ditemukan. Silakan login kembali.");
        setLoading(false);
        return;
      }

      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      console.log("Roastery ID yang dipakai:", roasteryId);

      const response = await axios.get(
        `${BASE_URL}/api/analytics/sales/${roasteryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("Response dari API:", response.data);

      if (response.data && response.data.data) {
        const formattedData = response.data.data.map((item) => ({
          ...item,
          totalVolume: Number(item.totalVolume || item.volume || 0),
          totalRevenue: Number(item.totalRevenue || item.total_revenue || 0),
        }));
        setData(formattedData);
      } else if (Array.isArray(response.data)) {
        const formattedData = response.data.map((item) => ({
          ...item,
          totalVolume: Number(item.totalVolume || item.volume || 0),
          totalRevenue: Number(item.totalRevenue || item.total_revenue || 0),
        }));
        setData(formattedData);
      } else {
        setError("Format respons tidak sesuai");
      }
    } catch (err) {
      console.error("Error fetching trend data:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gagal mengambil data analitik",
      );
    } finally {
      setLoading(false);
    }
  }, [roasteryId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTrendData();
  }, [fetchTrendData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 bg-stone-50 rounded-2xl border border-stone-200 shadow-sm">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-amber-600 mb-4"></div>
          <p className="text-stone-600">Memuat data analitik...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
        <p className="text-red-600 font-medium">Terjadi Kesalahan</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button
          onClick={fetchTrendData}
          className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center shadow-sm">
        <p className="text-stone-600">
          Belum ada data penjualan dalam 6 bulan terakhir.
        </p>
      </div>
    );
  }

  // Hitung statistik
  const totalRevenue = data.reduce(
    (sum, item) => sum + (Number(item.totalRevenue) || 0),
    0,
  );
  const totalVolume = data.reduce(
    (sum, item) => sum + (Number(item.totalVolume) || 0),
    0,
  );
  const avgMonthlyRevenue =
    data.length > 0 ? Math.round(totalRevenue / data.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header dengan Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">
                Total Pendapatan (6 Bulan)
              </p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="text-4xl opacity-20">💰</div>
          </div>
        </div>

        {/* Total Volume Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">
                Total Volume (6 Bulan)
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {(totalVolume || 0).toLocaleString("id-ID")} kg
              </p>
            </div>
            <div className="text-4xl opacity-20">📦</div>
          </div>
        </div>

        {/* Avg Monthly Revenue Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 mb-1">
                Rata-rata per Bulan
              </p>
              <p className="text-2xl font-bold text-amber-900">
                {formatCurrency(avgMonthlyRevenue)}
              </p>
            </div>
            <div className="text-4xl opacity-20">📊</div>
          </div>
        </div>
      </div>

      {/* Chart Toggle Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setChartType("line")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            chartType === "line"
              ? "bg-amber-600 text-white shadow-md"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          Grafik Garis
        </button>
        <button
          onClick={() => setChartType("bar")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            chartType === "bar"
              ? "bg-amber-600 text-white shadow-md"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          Grafik Batang
        </button>
      </div>

      {/* Chart Container */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Tren Penjualan{" "}
          {chartType === "line" ? "- Grafik Garis" : "- Grafik Batang"}
        </h3>

        <ResponsiveContainer width="100%" height={400}>
          {chartType === "line" ? (
            <LineChart
              data={data}
              margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="monthName"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                padding={{ left: 50, right: 50 }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                yAxisId="left"
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                yAxisId="right"
                orientation="right"
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalVolume"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 5 }}
                activeDot={{ r: 8 }}
                name="Volume (kg)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalRevenue"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 5 }}
                activeDot={{ r: 8 }}
                name="Pendapatan (IDR)"
              />
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="monthName"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                padding={{ left: 50, right: 50 }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar
                dataKey="totalVolume"
                fill="#3b82f6"
                name="Volume (kg)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="totalRevenue"
                fill="#10b981"
                name="Pendapatan (IDR)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">
            Detail Per Bulan
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-3 text-left font-semibold text-stone-700">
                  Bulan
                </th>
                <th className="px-6 py-3 text-right font-semibold text-stone-700">
                  Volume (kg)
                </th>
                <th className="px-6 py-3 text-right font-semibold text-stone-700">
                  Pendapatan
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-stone-900">
                    {item.monthName}
                  </td>
                  <td className="px-6 py-3 text-right text-stone-600">
                    {(Number(item.totalVolume) || 0).toLocaleString("id-ID")} kg
                  </td>
                  <td className="px-6 py-3 text-right text-green-600 font-medium">
                    {formatCurrency(item.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;
