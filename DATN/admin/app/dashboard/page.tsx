"use client";
import { useState } from "react";
import { FaBoxOpen, FaStore, FaUser, FaClipboardList } from "react-icons/fa";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [timeRange, setTimeRange] = useState<string>("30days");

  // Sample revenue data
  const revenueData = [
    { date: "01/09", revenue: 12000, orders: 45 },
    { date: "02/09", revenue: 15000, orders: 52 },
    { date: "03/09", revenue: 18000, orders: 61 },
    { date: "04/09", revenue: 14000, orders: 48 },
    { date: "05/09", revenue: 22000, orders: 78 },
    { date: "06/09", revenue: 19000, orders: 65 },
    { date: "07/09", revenue: 25000, orders: 89 },
    { date: "08/09", revenue: 21000, orders: 72 },
    { date: "09/09", revenue: 28000, orders: 95 },
    { date: "10/09", revenue: 24000, orders: 83 },
  ];

  // Sample category distribution data
  const categoryData = [
    { name: "Điện tử", value: 35, color: "#0088FE" },
    { name: "Thời trang", value: 25, color: "#00C49F" },
    { name: "Sách", value: 15, color: "#FFBB28" },
    { name: "Mỹ phẩm", value: 12, color: "#FF8042" },
    { name: "Khác", value: 13, color: "#8884D8" },
  ];

  // Sample shop performance data
  const shopPerformance = [
    { name: "Shop A", revenue: 45000, orders: 156 },
    { name: "Shop B", revenue: 38000, orders: 132 },
    { name: "Shop C", revenue: 32000, orders: 118 },
    { name: "Shop D", revenue: 28000, orders: 105 },
    { name: "Shop E", revenue: 22000, orders: 89 },
  ];

  // Type for tooltip props
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
      dataKey: string;
      payload: any;
    }>;
    label?: string;
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
          <p className="font-semibold text-gray-800">{`Ngày: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value.toLocaleString()} VND`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Tiêu đề */}
      <h1 className="text-2xl font-bold text-gray-800">Thống kê tổng quan</h1>

      {/* Các ô thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox
          icon={<FaBoxOpen />}
          label="Tổng số sản phẩm"
          value="1,569"
          date="28/08/2025"
          trend="+12%"
        />
        <StatBox
          icon={<FaStore />}
          label="Tổng số Shop"
          value="5,129"
          date="28/08/2025"
          trend="+8%"
        />
        <StatBox
          icon={<FaUser />}
          label="Tổng số khách hàng"
          value="1,569"
          date="28/08/2025"
          trend="+15%"
        />
        <StatBox
          icon={<FaClipboardList />}
          label="Tổng số đơn hàng"
          value="1,569"
          date="28/08/2025"
          trend="+23%"
        />
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Thống kê doanh thu
            </h2>
            <p className="text-sm text-gray-600">
              Biểu đồ thể hiện doanh thu theo thời gian
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="90days">90 ngày qua</option>
              <option value="year">Năm nay</option>
            </select>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`px-3 py-2 text-sm ${
                  chartType === "line"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => setChartType("line")}
              >
                Đường
              </button>
              <button
                className={`px-3 py-2 text-sm ${
                  chartType === "bar"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => setChartType("bar")}
              >
                Cột
              </button>
            </div>
          </div>
        </div>

        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart
                data={revenueData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu (VND)"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="Số đơn hàng"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={revenueData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu (VND)"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="orders"
                  name="Số đơn hàng"
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">
              Tổng doanh thu 10 ngày
            </p>
            <p className="text-2xl font-bold text-blue-800">197,000 VND</p>
            <p className="text-xs text-blue-600">+15% so với kỳ trước</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">
              Đơn hàng trung bình
            </p>
            <p className="text-2xl font-bold text-green-800">73 đơn/ngày</p>
            <p className="text-xs text-green-600">+8% so với kỳ trước</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">
              Giá trị đơn trung bình
            </p>
            <p className="text-2xl font-bold text-purple-800">269,000 VND</p>
            <p className="text-xs text-purple-600">+5% so với kỳ trước</p>
          </div>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Phân bổ theo danh mục
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Tỷ lệ"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shop Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Top Shop hiệu suất cao
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shopPerformance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  stroke="#666"
                  tickFormatter={formatYAxis}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#666"
                  width={80}
                />
                <Tooltip formatter={(value) => [value!.toLocaleString(), ""]} />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu (VND)"
                  fill="#0088FE"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="orders"
                  name="Số đơn hàng"
                  fill="#00C49F"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  date: string;
  trend?: string;
}

function StatBox({ icon, label, value, date, trend }: StatBoxProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600">
          {icon}
          <span className="font-semibold text-sm">{label}</span>
        </div>
        {trend && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">Cập nhật: {date}</div>
    </div>
  );
}
