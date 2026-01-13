"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { apiFetch } from "../lib/fetcher";

interface ChartData {
  label: string;
  value: number;
}

interface RevenueData {
  success: boolean;
  type: "month" | "day";
  year: number;
  month?: number;
  chart_data: ChartData[];
  summary: {
    total: number;
  };
}

interface RevenueColumnChartProps {
  onDataLoaded?: (data: RevenueData | null) => void;
}

export default function RevenueColumnChart({
  onDataLoaded,
}: RevenueColumnChartProps) {
  const [chartType, setChartType] = useState<"month" | "day">("month");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Generate years (last 5 years + current year)
  const years = Array.from(
    { length: 6 },
    (_, i) => new Date().getFullYear() - 5 + i
  );
  const months = [
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
  ];

  const fetchRevenueData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: chartType,
        year: year.toString(),
      });

      if (chartType === "day") {
        params.append("month", month.toString());
      }

      const response = await apiFetch(
        `http://localhost:5000/api/admin/thong-ke/doanh-thu-chart?${params}`
      );

      console.log(response);

      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu doanh thu");
      }

      const result: RevenueData = await response.json();

      if (result.success) {
        setData(result);
        if (onDataLoaded) {
          onDataLoaded(result);
        }
      } else {
        throw new Error("Dữ liệu không hợp lệ");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [chartType, year, month]);

  const handleTypeChange = (type: "month" | "day") => {
    setChartType(type);
    if (type === "month") {
      setMonth(new Date().getMonth() + 1);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(parseInt(e.target.value));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(parseInt(e.target.value));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <p className="text-sm text-purple-600">
            Doanh thu:{" "}
            <span className="font-bold">
              {formatCurrency(payload[0].value)}
            </span>
          </p>
          {data?.summary && (
            <p className="text-xs text-gray-500 mt-1">
              Đóng góp:{" "}
              {((payload[0].value / data.summary.total) * 100 || 0).toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const getBarColor = (value: number) => {
    if (!data?.chart_data?.length) return "#8884d8";

    const maxValue = Math.max(...data.chart_data.map((item) => item.value));
    const percentage = (value / maxValue) * 100;

    if (percentage > 80) return "#10b981"; // Green for high values
    if (percentage > 50) return "#3b82f6"; // Blue for medium values
    if (percentage > 20) return "#8b5cf6"; // Purple for low-medium values
    return "#ec4899"; // Pink for low values
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu doanh thu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.928-.833-2.698 0L4.196 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={fetchRevenueData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Biểu đồ doanh thu
          </h2>
          <p className="text-sm text-gray-600">
            {chartType === "month"
              ? `Doanh thu theo tháng năm ${year}`
              : `Doanh thu theo ngày tháng ${month}/${year}`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Chart Type Toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                chartType === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => handleTypeChange("month")}
            >
              Theo tháng
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                chartType === "day"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => handleTypeChange("day")}
            >
              Theo ngày
            </button>
          </div>

          {/* Year Selector */}
          <select
            value={year}
            onChange={handleYearChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>

          {/* Month Selector (only for day view) */}
          {chartType === "day" && (
            <select
              value={month}
              onChange={handleMonthChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[400px]">
        {data?.chart_data && data.chart_data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.chart_data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                stroke="#666"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#666"
                tickFormatter={(value) => {
                  if (value >= 1000000)
                    return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="Doanh thu" radius={[4, 4, 0, 0]}>
                {data.chart_data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p>Không có dữ liệu doanh thu cho khoảng thời gian này</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {data?.summary && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">
              Tổng doanh thu {chartType === "month" ? "năm" : "tháng"}
            </p>
            <p className="text-2xl font-bold text-blue-800">
              {formatCurrency(data.summary.total)}
            </p>
            <p className="text-xs text-blue-600">
              {chartType === "month"
                ? `12 tháng năm ${year}`
                : `Tháng ${month}/${year}`}
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">
              Doanh thu trung bình
            </p>
            <p className="text-2xl font-bold text-purple-800">
              {formatCurrency(
                data.summary.total / (data.chart_data?.length || 1)
              )}
            </p>
            <p className="text-xs text-purple-600">
              Trung bình {chartType === "month" ? "tháng" : "ngày"}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">
              Tháng/Ngày cao nhất
            </p>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(
                Math.max(...(data.chart_data?.map((item) => item.value) || [0]))
              )}
            </p>
            {data.chart_data && data.chart_data.length > 0 && (
              <p className="text-xs text-green-600">
                {
                  data.chart_data.find(
                    (item) =>
                      item.value ===
                      Math.max(...data.chart_data.map((item) => item.value))
                  )?.label
                }
              </p>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      {data?.chart_data && data.chart_data.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Chi tiết dữ liệu
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {chartType === "month" ? "Tháng" : "Ngày"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tỷ lệ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Biểu đồ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.chart_data.map((item, index) => {
                  const percentage = data.summary.total
                    ? (item.value / data.summary.total) * 100
                    : 0;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.label}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.value)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="w-24 h-6 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${
                                (item.value /
                                  Math.max(
                                    ...data.chart_data.map((d) => d.value)
                                  )) *
                                100
                              }%`,
                              backgroundColor: getBarColor(item.value),
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
