"use client";
import { FaBoxOpen, FaStore, FaUser, FaClipboardList } from "react-icons/fa";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Tiêu đề */}
      <h1 className="text-2xl font-bold text-gray-800">Thống kê tổng quan</h1>

      {/* Các ô thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox icon={<FaBoxOpen />} label="Tổng số sản phẩm" value="1,569" date="28/08/2025" />
        <StatBox icon={<FaStore />} label="Tổng số Shop" value="5,129" date="28/08/2025" />
        <StatBox icon={<FaUser />} label="Tổng số khách hàng" value="1,569" date="28/08/2025" />
        <StatBox icon={<FaClipboardList />} label="Tổng số đơn hàng" value="1,569" date="28/08/2025" />
      </div>

      {/* Biểu đồ doanh thu */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Thống kê số tiền đơn hàng</h2>
        <div className="w-full h-[300px] bg-gradient-to-b from-blue-100 to-white rounded-lg flex items-center justify-center text-gray-500">
          Biểu đồ doanh thu (giả lập)
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  date,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  date: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">Ngày: {date}</div>
    </div>
  );
}