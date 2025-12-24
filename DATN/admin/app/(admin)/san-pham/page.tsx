"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../context/LocaleContext";
import { apiFetch } from "@/app/lib/fetcher";

interface SanPhamItem {
  id: number;
  ten_sp: string;
  code: string;
  gia: number;
  is_active: boolean;
  dvctn: string;
  so_luong: number;
  img: string;
  danh_muc?: { ten_dm: string };
  thuong_hieu?: { ten_th: string };
}

export default function SanPhamPage() {
  const { t } = useLocale();
  const [data, setData] = useState<SanPhamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isActiveFilter, setIsActiveFilter] = useState<"true" | "false">(
    "true"
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const [form, setForm] = useState({
    ten_sp: "",
    code: "",
    gia: "",
    so_luong: "",
    id_dm: "",
    id_th: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);

      const baseUrl =
        isActiveFilter === "true"
          ? "http://localhost:5000/api/admin/san-pham"
          : "http://localhost:5000/api/admin/san-pham/kich-hoat";

      const res = await apiFetch(
        `${baseUrl}?limit=${limit}&page=${currentPage}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Fetch failed");

      const json = await res.json();

      if (!json.success) {
        alert(json.thong_bao || "Lỗi lấy dữ liệu");
        return;
      }

      const { data, pagination } = json.result;

      setData(data || []);
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
  }, [currentPage, isActiveFilter]);

  const openModal = (item?: SanPhamItem) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        ten_sp: item.ten_sp,
        code: item.code,
        gia: item.gia.toString(),
        so_luong: item.so_luong.toString(),
        id_dm: "",
        id_th: "",
      });
      setPreviewUrl(`http://localhost:5000${item.img}`);
    } else {
      setEditingId(null);
      setForm({
        ten_sp: "",
        code: "",
        gia: "",
        so_luong: "",
        id_dm: "",
        id_th: "",
      });
      setPreviewUrl("");
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setImageFile(null);
    setPreviewUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("ten_sp", form.ten_sp);
    formData.append("code", form.code || "");
    formData.append("gia", form.gia);
    formData.append("so_luong", form.so_luong);
    formData.append("an_hien", "1");

    if (imageFile) {
      formData.append("hinh_sp", imageFile);
    }

    const url = editingId
      ? `http://localhost:5000/api/admin/san-pham/${editingId}`
      : "http://localhost:5000/api/admin/san-pham";

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await apiFetch(url, {
        method,
        credentials: "include",
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        alert(
          editingId ? "Sửa sản phẩm thành công!" : "Thêm sản phẩm thành công!"
        );
        closeModal();
        loadData();
      } else {
        alert("Lỗi: " + (json.thong_bao || "Không thành công"));
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa sản phẩm này? Không thể khôi phục!")) return;

    try {
      const res = await apiFetch(
        `http://localhost:5000/api/admin/san-pham/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await res.json();

      if (json.success) {
        alert("Xóa thành công!");
        loadData();
      } else {
        alert("Xóa thất bại: " + json.thong_bao);
      }
    } catch (err) {
      alert("Lỗi server");
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Bạn có chắc muốn duyệt sản phẩm này?")) return;

    try {
      const res = await apiFetch(
        `http://localhost:5000/api/admin/san-pham/kich-hoat/${id}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const json = await res.json();

      if (json.success) {
        alert("Duyệt sản phẩm thành công");
        loadData();
      } else {
        alert(json.thong_bao);
      }
    } catch (err) {
      alert("Lỗi server");
    }
  };

  if (loading) return <p className="text-center text-xl py-10">Đang tải...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-black text-gray-900">
          Danh sách sản phẩm
        </h1>
        <select
          value={isActiveFilter}
          onChange={(e) => {
            setCurrentPage(1);
            setIsActiveFilter(e.target.value as "true" | "false");
          }}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="true">Sản phẩm đã duyệt</option>
          <option value="false">Sản phẩm chưa duyệt</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-96">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Tình trạng
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Đơn vị CTN
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Giá
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Tác vụ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((sp, index) => (
                <tr key={sp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 min-w-96">
                    <div className="flex items-center gap-3">
                      <img
                        src={`http://localhost:5000${sp.img}`}
                        className="w-12 h-12 object-cover rounded"
                        alt=""
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {sp.ten_sp}
                        </p>
                        <p className="text-xs text-gray-500">SKU: {sp.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`font-medium ${
                        sp.is_active ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {sp.is_active ? "Đã duyệt" : "Chưa duyệt"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">
                    {sp.dvctn}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-red-600">
                    {Number(sp.gia).toLocaleString()}₫
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sp.so_luong > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sp.so_luong}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-3">
                    {!sp.is_active && (
                      <button
                        onClick={() => handleApprove(sp.id)}
                        className="text-green-600 font-medium cursor-pointer
                 transition-all duration-200 ease-out
                 hover:-translate-y-1 hover:scale-110"
                      >
                        ✅
                      </button>
                    )}
                    <button
                      onClick={() => openModal(sp)}
                      className="text-blue-600 font-medium cursor-pointer
               transition-all duration-200 ease-out
               hover:-translate-y-1 hover:scale-110 ml-6"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(sp.id)}
                      className="text-red-600 font-medium cursor-pointer
               transition-all duration-200 ease-out
               hover:-translate-y-1 hover:scale-110"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-6 mb-6">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              ←
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2
              )
              .map((page) => (
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
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="px-8 py-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên sản phẩm *
                  </label>
                  <input
                    required
                    value={form.ten_sp}
                    onChange={(e) =>
                      setForm({ ...form, ten_sp: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã SKU (tùy chọn)
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá bán *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.gia}
                    onChange={(e) => setForm({ ...form, gia: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng tồn *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.so_luong}
                    onChange={(e) =>
                      setForm({ ...form, so_luong: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh chính *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mt-4 w-48 h-48 object-cover rounded-lg border"
                  />
                )}
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
                >
                  {editingId ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
