"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/fetcher";

interface VoucherItem {
  id: number;
  ten_km: string;
  code: string;
  loai_km: number;
  gia_tri_giam: number;
  gia_giam_toi_da: number | null;
  gia_tri_don_min: number;
  so_luong: number;
  gioi_han_user: number;
  ngay_bd: string;
  ngay_kt: string;
  trang_thai: boolean;
}

export default function VoucherPage() {
  const [data, setData] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [form, setForm] = useState({
    ten_km: "",
    code: "",
    loai_km: 1,
    gia_tri_giam: "",
    gia_giam_toi_da: "",
    gia_tri_don_min: "",
    so_luong: "",
    gioi_han_user: "",
    ngay_bd: "",
    ngay_kt: "",
    trang_thai: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(
        `http://localhost:5000/api/admin/voucher?limit=${limit}&page=${currentPage}`
      );
      const json = await res.json();
      setData(json.result.data || []);
      setTotalPages(json.result.pagination.totalPages || 1);
    } catch {
      alert("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage]);
  const openModal = (item?: VoucherItem) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        ten_km: item.ten_km,
        code: item.code,
        loai_km: item.loai_km,
        gia_tri_giam: String(item.gia_tri_giam),
        gia_giam_toi_da: item.gia_giam_toi_da
          ? String(item.gia_giam_toi_da)
          : "",
        gia_tri_don_min: String(item.gia_tri_don_min),
        so_luong: String(item.so_luong),
        gioi_han_user: String(item.gioi_han_user),
        ngay_bd: item.ngay_bd.slice(0, 10),
        ngay_kt: item.ngay_kt.slice(0, 10),
        trang_thai: item.trang_thai,
      });
    } else {
      setEditingId(null);
      setForm({
        ten_km: "",
        code: "",
        loai_km: 1,
        gia_tri_giam: "",
        gia_giam_toi_da: "",
        gia_tri_don_min: "",
        so_luong: "",
        gioi_han_user: "",
        ngay_bd: "",
        ngay_kt: "",
        trang_thai: true,
      });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      loai_km: Number(form.loai_km),
    };

    const url = editingId
      ? `http://localhost:5000/api/admin/voucher/${editingId}`
      : "http://localhost:5000/api/admin/voucher";

    const method = editingId ? "PUT" : "POST";

    const res = await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (json.success) {
      alert("Thành công!");
      closeModal();
      loadData();
    } else {
      alert(json.thong_bao);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa khuyến mãi này?")) return;

    const res = await apiFetch(
      `http://localhost:5000/api/admin/voucher/${id}`,
      { method: "DELETE" }
    );
    const json = await res.json();

    if (json.success) {
      loadData();
    } else {
      alert(json.thong_bao);
    }
  };

  if (loading) return <p className="text-center py-10">Đang tải...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between mb-6">
        <h1 className="text-4xl font-black">Danh sách khuyến mãi</h1>
        <button
          onClick={() => openModal()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          + Thêm KM
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3">Tên KM</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Giảm</th>
              <th className="px-4 py-3">Số lượng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((km) => (
              <tr key={km.id} className="border-t text-center">
                <td className="px-4 py-3 font-semibold">{km.ten_km}</td>
                <td className="px-4 py-3">{km.code}</td>
                <td className="px-4 py-3">
                  {km.loai_km === 1
                    ? `${km.gia_tri_giam}%`
                    : `${km.gia_tri_giam.toLocaleString()}₫`}
                </td>
                <td className="px-4 py-3">{km.so_luong}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-bold ${
                      km.trang_thai ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {km.trang_thai ? "Hoạt động" : "Tắt"}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-3">
                  <button
                    onClick={() => openModal(km)}
                    className="text-blue-600 cursor-pointer"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(km.id)}
                    className="text-red-600 cursor-pointer"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-center gap-2 py-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ←
          </button>
          <span>
            {currentPage}/{totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-xl w-full max-w-3xl space-y-5"
          >
            <h2 className="text-2xl font-bold">
              {editingId ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}
            </h2>

            <input
              placeholder="Tên khuyến mãi"
              value={form.ten_km}
              onChange={(e) => setForm({ ...form, ten_km: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />

            <input
              placeholder="CODE"
              value={form.code}
              disabled={!!editingId}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full border p-2 rounded disabled:bg-gray-100"
              required
            />

            {!editingId && (
              <select
                value={form.loai_km}
                onChange={(e) =>
                  setForm({ ...form, loai_km: Number(e.target.value) })
                }
                className="w-full border p-2 rounded"
              >
                <option value={1}>Giảm theo %</option>
                <option value={2}>Giảm theo số tiền</option>
              </select>
            )}

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Giá trị giảm"
                value={form.gia_tri_giam}
                disabled={!!editingId}
                onChange={(e) =>
                  setForm({ ...form, gia_tri_giam: e.target.value })
                }
                className="border p-2 rounded disabled:bg-gray-100"
                required
              />

              {form.loai_km === 1 && (
                <input
                  type="number"
                  placeholder="Giảm tối đa"
                  value={form.gia_giam_toi_da}
                  onChange={(e) =>
                    setForm({ ...form, gia_giam_toi_da: e.target.value })
                  }
                  className="border p-2 rounded"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Đơn tối thiểu"
                value={form.gia_tri_don_min}
                onChange={(e) =>
                  setForm({ ...form, gia_tri_don_min: e.target.value })
                }
                className="border p-2 rounded"
              />

              <input
                type="number"
                placeholder="Số lượng"
                value={form.so_luong}
                onChange={(e) => setForm({ ...form, so_luong: e.target.value })}
                className="border p-2 rounded"
                required
              />

              <input
                type="number"
                placeholder="Giới hạn/user"
                value={form.gioi_han_user}
                onChange={(e) =>
                  setForm({ ...form, gioi_han_user: e.target.value })
                }
                className="border p-2 rounded"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={form.ngay_bd}
                disabled={!!editingId}
                onChange={(e) => setForm({ ...form, ngay_bd: e.target.value })}
                className="border p-2 rounded disabled:bg-gray-100"
                required
              />
              <input
                type="date"
                value={form.ngay_kt}
                onChange={(e) => setForm({ ...form, ngay_kt: e.target.value })}
                className="border p-2 rounded"
                required
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.trang_thai}
                onChange={(e) =>
                  setForm({ ...form, trang_thai: e.target.checked })
                }
              />
              Kích hoạt
            </label>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button type="button" onClick={closeModal}>
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
