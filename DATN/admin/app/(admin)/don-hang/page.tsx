"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/fetcher";

type TrangThaiDH = 0 | 1 | 2 | 3 | 4;

interface DonHangChiTiet {
  id: number;
  id_dh: number;
  id_sp: number;
  ten_sp: string;
  img: string;
  so_luong: number;
  gia: number;
  thanh_tien: number;
}

interface DonHangItem {
  id: number;
  ma_dh: string;
  ten_nguoi_nhan: string;
  dien_thoai: string;
  dia_chi_gh: string;
  tam_tinh: number;
  phi_vc: number;
  giam_gia: number;
  tong_tien: number;
  trang_thai_dh: number;
  chi_tiet_dh: DonHangChiTiet[];
  pttt: { ten_pt: string; code: string };
  createdAt: string;
}

const DON_HANG_STATUS = {
  0: { label: "Chờ xác nhận", color: "text-yellow-600" },
  1: { label: "Shop chuẩn bị hàng", color: "text-blue-600" },
  2: { label: "Đang giao", color: "text-indigo-600" },
  3: { label: "Giao hàng thành công", color: "text-green-600" },
  4: { label: "Đã hủy", color: "text-red-600" },
} as const;

export default function DonHangPage() {
  const [data, setData] = useState<DonHangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const [selectedDH, setSelectedDH] = useState<DonHangItem | null>(null);

  const openDetailModal = (dh: DonHangItem) => {
    setSelectedDH(dh);
  };

  const closeDetailModal = () => {
    setSelectedDH(null);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(
        `http://localhost:5000/api/admin/don-hang?limit=${limit}&page=${currentPage}`,
        { method: "GET", credentials: "include" }
      );

      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();

      if (!json.success) {
        alert(json.thong_bao || "Lỗi lấy dữ liệu");
        return;
      }

      const { data: items, pagination } = json.result;
      setData(items || []);
      setTotalPages(pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      alert("Lỗi server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage]);

  if (loading) return <p className="text-center py-10">Đang tải...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-black text-gray-900 mb-6">
        Danh sách đơn hàng
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[50px]">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-48">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Người nhận
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((dh, index) => (
                <tr
                  key={dh.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => openDetailModal(dh)}
                >
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {dh.ma_dh}
                  </td>
                  <td className="px-6 py-4">{dh.ten_nguoi_nhan}</td>
                  <td className="px-6 py-4">{dh.dien_thoai}</td>
                  <td className="px-6 py-4">{dh.dia_chi_gh}</td>
                  <td className="px-6 py-4 font-bold text-red-600">
                    {dh.tong_tien.toLocaleString()}₫
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-medium ${
                        DON_HANG_STATUS[dh.trang_thai_dh as TrangThaiDH]
                          ?.color || "text-gray-600"
                      }`}
                    >
                      {DON_HANG_STATUS[dh.trang_thai_dh as TrangThaiDH]
                        ?.label || "Không xác định"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center items-center gap-2 mt-6 mb-6">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 border rounded ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              →
            </button>
          </div>
          {selectedDH && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="px-8 py-5 border-b flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Chi tiết đơn hàng #{selectedDH.ma_dh}
                  </h2>
                  <button
                    onClick={closeDetailModal}
                    className="text-gray-500 hover:text-red-600 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Người nhận</p>
                      <p className="font-semibold">
                        {selectedDH.ten_nguoi_nhan}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Điện thoại</p>
                      <p className="font-semibold">{selectedDH.dien_thoai}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                      <p className="font-semibold">{selectedDH.dia_chi_gh}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Thanh toán</p>
                      <p className="font-semibold">
                        {selectedDH.pttt?.ten_pt} ({selectedDH.pttt?.code})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ngày tạo</p>
                      <p className="font-semibold">
                        {new Date(selectedDH.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tình trạng</p>
                      <p className="font-semibold">
                        <span
                          className={`font-medium ${
                            DON_HANG_STATUS[
                              selectedDH.trang_thai_dh as TrangThaiDH
                            ]?.color || "text-gray-600"
                          }`}
                        >
                          {DON_HANG_STATUS[
                            selectedDH.trang_thai_dh as TrangThaiDH
                          ]?.label || "Không xác định"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-4">Sản phẩm</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left">Sản phẩm</th>
                            <th className="px-4 py-2 text-center">Giá</th>
                            <th className="px-4 py-2 text-center">SL</th>
                            <th className="px-4 py-2 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedDH.chi_tiet_dh.map((ct) => (
                            <tr key={ct.id}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={`http://localhost:5000${ct.img}`}
                                    className="w-12 h-12 object-cover rounded"
                                    alt=""
                                  />
                                  <span className="font-medium">
                                    {ct.ten_sp}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {ct.gia.toLocaleString()}₫
                              </td>
                              <td className="px-4 py-3 text-center">
                                {ct.so_luong}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-red-600">
                                {ct.thanh_tien.toLocaleString()}₫
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-2 text-right">
                    <p>Tạm tính: {selectedDH.tam_tinh.toLocaleString()}₫</p>
                    <p>Phí vận chuyển: {selectedDH.phi_vc.toLocaleString()}₫</p>
                    <p>Giảm giá: -{selectedDH.giam_gia.toLocaleString()}₫</p>
                    <p className="text-2xl font-bold text-red-600">
                      Tổng tiền: {selectedDH.tong_tien.toLocaleString()}₫
                    </p>
                  </div>
                </div>

                <div className="px-8 py-4 border-t flex justify-end">
                  <button
                    onClick={closeDetailModal}
                    className="px-6 py-2 border rounded-lg hover:bg-gray-100"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
