"use client";
import { useEffect, useState } from "react";
import {
  FaBoxOpen,
  FaStore,
  FaUser,
  FaClipboardList,
  FaMoneyBillWave,
  FaShoppingCart,
  FaBan,
  FaCheckCircle,
} from "react-icons/fa";
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
import RevenueColumnChart from "@/app/components/RevenueColumnChart";
import { apiFetch } from "@/app/lib/fetcher";

export default function DashboardPage() {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [timeRange, setTimeRange] = useState<string>("30days");

  // Sample data for other charts (keep your existing data)
  const categoryData = [
    { name: "Điện tử", value: 35, color: "#0088FE" },
    { name: "Thời trang", value: 25, color: "#00C49F" },
    { name: "Sách", value: 15, color: "#FFBB28" },
    { name: "Mỹ phẩm", value: 12, color: "#FF8042" },
    { name: "Khác", value: 13, color: "#8884D8" },
  ];

  const shopPerformance = [
    { name: "Shop A", revenue: 45000, orders: 156 },
    { name: "Shop B", revenue: 38000, orders: 132 },
    { name: "Shop C", revenue: 32000, orders: 118 },
    { name: "Shop D", revenue: 28000, orders: 105 },
    { name: "Shop E", revenue: 22000, orders: 89 },
  ];

  // Fetch overview data from your API
  const [overviewData, setOverviewData] = useState({
    doanh_thu: 0,
    don_da_huy: 0,
    don_hang_moi: 0,
    tong_user: 0,
    tong_shop: 0,
    san_pham_sap_het: 0,
    don_hang_thanh_toan: 0,
  });

  // Fetch order status data
  const [orderStatusData, setOrderStatusData] = useState({
    cho_xac_nhan: 0,
    da_xac_nhan: 0,
    dang_giao: 0,
    thanh_cong: 0,
    da_huy: 0,
    tong_cong: 0,
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchOverviewData();
    fetchOrderStatusData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const response = await apiFetch(
        "http://localhost:5000/api/admin/thong-ke/tong-quan"
      );
      const data = await response.json();
      if (data.success) {
        setOverviewData(data.data);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    }
  };

  const fetchOrderStatusData = async () => {
    try {
      const response = await apiFetch(
        "http://localhost:5000/api/admin/thong-ke/trang-thai-don-hang"
      );
      const data = await response.json();
      if (data.success) {
        setOrderStatusData(data.data);
      }
    } catch (error) {
      console.error("Error fetching order status data:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Thống kê tổng quan</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox
          icon={<FaMoneyBillWave className="text-blue-600" />}
          label="Tổng doanh thu"
          value={formatCurrency(overviewData.doanh_thu)}
          trend="+12%"
        />
        <StatBox
          icon={<FaShoppingCart className="text-green-600" />}
          label="Đơn hàng mới"
          value={overviewData.don_hang_moi.toString()}
          trend="+8%"
        />
        <StatBox
          icon={<FaBan className="text-red-600" />}
          label="Đơn đã hủy"
          value={overviewData.don_da_huy.toString()}
          trend="-3%"
        />
        <StatBox
          icon={<FaCheckCircle className="text-purple-600" />}
          label="Đơn đã thanh toán"
          value={overviewData.don_hang_thanh_toan.toString()}
          trend="+15%"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatBox
          icon={<FaUser className="text-indigo-600" />}
          label="Tổng người dùng"
          value={overviewData.tong_user.toString()}
          trend="+5%"
        />
        <StatBox
          icon={<FaStore className="text-yellow-600" />}
          label="Tổng Shop"
          value={overviewData.tong_shop.toString()}
          trend="+8%"
        />
        <StatBox
          icon={<FaBoxOpen className="text-pink-600" />}
          label="Sản phẩm sắp hết"
          value={overviewData.san_pham_sap_het.toString()}
          trend="+2%"
        />
      </div>

      {/* Revenue Column Chart */}
      <RevenueColumnChart
        onDataLoaded={(data) => {
          // You can use this callback to update parent state if needed
          console.log("Revenue data loaded:", data);
        }}
      />

      {/* Order Status Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Phân bổ trạng thái đơn hàng
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <OrderStatusCard
            status="Chờ xác nhận"
            count={orderStatusData.cho_xac_nhan}
            color="bg-yellow-100 text-yellow-800"
            percentage={
              (orderStatusData.cho_xac_nhan / orderStatusData.tong_cong) *
                100 || 0
            }
          />
          <OrderStatusCard
            status="Đã xác nhận"
            count={orderStatusData.da_xac_nhan}
            color="bg-blue-100 text-blue-800"
            percentage={
              (orderStatusData.da_xac_nhan / orderStatusData.tong_cong) * 100 ||
              0
            }
          />
          <OrderStatusCard
            status="Đang giao"
            count={orderStatusData.dang_giao}
            color="bg-purple-100 text-purple-800"
            percentage={
              (orderStatusData.dang_giao / orderStatusData.tong_cong) * 100 || 0
            }
          />
          <OrderStatusCard
            status="Thành công"
            count={orderStatusData.thanh_cong}
            color="bg-green-100 text-green-800"
            percentage={
              (orderStatusData.thanh_cong / orderStatusData.tong_cong) * 100 ||
              0
            }
          />
          <OrderStatusCard
            status="Đã hủy"
            count={orderStatusData.da_huy}
            color="bg-red-100 text-red-800"
            percentage={
              (orderStatusData.da_huy / orderStatusData.tong_cong) * 100 || 0
            }
          />
        </div>
      </div>

      {/* Other Charts (keep your existing charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  tickFormatter={(value) => {
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return value.toString();
                  }}
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
  trend?: string;
}

function StatBox({ icon, label, value, trend }: StatBoxProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm text-gray-700">{label}</span>
        </div>
        {trend && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

interface OrderStatusCardProps {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

function OrderStatusCard({
  status,
  count,
  color,
  percentage,
}: OrderStatusCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-700">{status}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${color} font-medium`}>
          {count}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
        <div
          className="h-2 rounded-full bg-blue-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 text-right">
        {percentage.toFixed(1)}%
      </p>
    </div>
  );
}
