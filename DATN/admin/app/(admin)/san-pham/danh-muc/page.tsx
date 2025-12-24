"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../../context/LocaleContext";
import { apiFetch } from "@/app/lib/fetcher";

interface DanhMucItem {
  id: number;
  ten_dm: string;
  parent_id: number | null;
  stt: number;
  an_hien: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DanhMucManagementPage() {
  const { t } = useLocale();
  const [data, setData] = useState<DanhMucItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    ten_dm: "",
    parent_id: "",
    stt: "",
    an_hien: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        "http://localhost:5000/api/admin/danh-muc-tin",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (res.ok) {
        const json = await res.json();
        if (json) setData(json.result.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (item?: DanhMucItem) => {
    console.log(item);
    if (item) {
      setEditingId(item.id);
      setForm({
        ten_dm: item.ten_dm,
        parent_id: item.parent_id ? item.parent_id.toString() : "",
        stt: item.stt.toString(),
        an_hien: item.an_hien ? true : false,
      });
    } else {
      setEditingId(null);
      setForm({
        ten_dm: "",
        parent_id: "",
        stt: "",
        an_hien: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.ten_dm?.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    const payload = {
      ten_dm: form.ten_dm.trim(),

      parent_id:
        form.parent_id && Number(form.parent_id) > 0
          ? Number(form.parent_id)
          : null,

      stt: form.stt ? Number(form.stt) : 1,

      an_hien: form.an_hien === true,
    };

    const url = editingId
      ? `http://localhost:5000/api/admin/danh-muc-tin/${editingId}`
      : "http://localhost:5000/api/admin/danh-muc-tin";

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert("Lỗi: " + (json.thong_bao || "Không thành công"));
        return;
      }

      alert(
        editingId ? "Sửa danh mục thành công!" : "Thêm danh mục thành công!"
      );
      closeModal();
      loadData();
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa danh mục này? Không thể khôi phục!")) return;

    try {
      const res = await apiFetch(
        `http://localhost:5000/api/admin/danh-muc-tin/${id}`,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusName = (status: boolean) => {
    return status ? "Hiển thị" : "Ẩn";
  };

  const getParentName = (parentId: number | null) => {
    if (!parentId) return "Danh mục gốc";
    const parent = data.find((dm) => dm.id === parentId);
    return parent ? parent.ten_dm : "Không xác định";
  };

  const getCategoryLevel = (parentId: number | null): number => {
    if (!parentId) return 0;
    const parent = data.find((dm) => dm.id === parentId);
    return parent ? getCategoryLevel(parent.parent_id) + 1 : 1;
  };

  const getSortedData = () => {
    const sorted: DanhMucItem[] = [];
    const rootCategories = data.filter((dm) => !dm.parent_id);

    const addChildren = (parentId: number | null, level: number) => {
      const children = data.filter((dm) => dm.parent_id === parentId);
      children.forEach((child) => {
        sorted.push({ ...child, stt: sorted.length + 1 });
        addChildren(child.id, level + 1);
      });
    };

    rootCategories.forEach((root) => {
      sorted.push(root);
      addChildren(root.id, 1);
    });

    return sorted;
  };

  if (loading) return <p className="text-center text-xl py-10">Đang tải...</p>;

  const sortedData = getSortedData();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-black text-gray-900">
          Danh sách danh mục tin tức
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-md transition flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Thêm danh mục mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên danh mục
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Danh mục cha
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Cấp độ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Cập nhật
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Tác vụ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedData.map((danhMuc, index) => {
                const level = getCategoryLevel(danhMuc.parent_id);
                return (
                  <tr key={danhMuc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700 text-center">
                      {danhMuc.stt}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className="ml-2"
                          style={{ marginLeft: `${level * 20}px` }}
                        >
                          {level > 0 && (
                            <span className="text-gray-400 mr-2">↳</span>
                          )}
                          <span className="font-semibold text-gray-900 text-lg">
                            {danhMuc.ten_dm}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {danhMuc.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          danhMuc.parent_id
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getParentName(danhMuc.parent_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            level === 0
                              ? "bg-purple-100 text-purple-800"
                              : level === 1
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          Cấp {level}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          danhMuc.an_hien
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getStatusName(danhMuc.an_hien)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {formatDate(danhMuc.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-center space-x-3">
                      <button
                        onClick={() => openModal(danhMuc)}
                        className="text-blue-600 hover:underline font-medium text-sm"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(danhMuc.id)}
                        className="text-red-600 hover:underline font-medium text-sm"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="px-8 py-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? "Sửa danh mục" : "Thêm danh mục mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên danh mục *
                </label>
                <input
                  required
                  value={form.ten_dm}
                  onChange={(e) => setForm({ ...form, ten_dm: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên danh mục"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục cha
                  </label>
                  <select
                    value={form.parent_id}
                    onChange={(e) =>
                      setForm({ ...form, parent_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn danh mục cha --</option>
                    {data
                      .filter((dm) => dm.id !== editingId)
                      .map((dm) => (
                        <option key={dm.id} value={dm.id}>
                          {dm.ten_dm} (ID: {dm.id})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Để trống nếu là danh mục gốc
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.stt}
                    onChange={(e) => setForm({ ...form, stt: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số thứ tự"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Số nhỏ hơn sẽ hiển thị trước
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái *
                </label>
                <select
                  value={form.an_hien ? "1" : "0"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      an_hien: e.target.value === "1" ? true : false,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">Hiển thị</option>
                  <option value="0">Ẩn</option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">
                  Thông tin danh mục:
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Tên danh mục:</span>{" "}
                    {form.ten_dm || "Chưa nhập"}
                  </p>
                  <p>
                    <span className="font-medium">Danh mục cha:</span>{" "}
                    {form.parent_id
                      ? data.find((dm) => dm.id === parseInt(form.parent_id))
                          ?.ten_dm || "Không xác định"
                      : "Danh mục gốc"}
                  </p>
                  <p>
                    <span className="font-medium">Thứ tự:</span>{" "}
                    {form.stt || "Tự động"}
                  </p>
                  <p>
                    <span className="font-medium">Trạng thái:</span>{" "}
                    {form.an_hien ? "Hiển thị" : "Ẩn"}
                  </p>
                </div>
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
