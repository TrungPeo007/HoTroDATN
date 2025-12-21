"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../context/LocaleContext";

interface BannerItem {
  id: number;
  stt: number;
  name: string;
  url: string;
  img: string;
  vi_tri: string;
  an_hien: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BannerManagementPage() {
  const { t } = useLocale();
  const [data, setData] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    url: "",
    vi_tri: "popup",
    an_hien: "1",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Load danh sách banner
  const loadData = async () => {
    setLoading(true);
    fetch("http://localhost:5000/api/admin/banner", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        if (json) setData(json.result.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mở modal thêm/sửa
  const openModal = (item?: BannerItem) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        name: item.name,
        url: item.url,
        vi_tri: item.vi_tri,
        an_hien: item.an_hien ? "1" : "0",
      });
      setPreviewUrl(`http://localhost:5000${item.img}`);
    } else {
      setEditingId(null);
      setForm({
        name: "",
        url: "",
        vi_tri: "popup",
        an_hien: "1",
      });
      setPreviewUrl("");
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  // Đóng modal
  const closeModal = () => {
    setIsModalOpen(false);
    setImageFile(null);
    setPreviewUrl("");
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra ảnh banner nếu là thêm mới
    if (!editingId && !imageFile) {
      alert("Vui lòng chọn ảnh banner!");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("url", form.url);
    formData.append("vi_tri", form.vi_tri);
    formData.append("an_hien", form.an_hien);

    if (imageFile) {
      formData.append("img", imageFile);
    }

    const url = editingId
      ? `http://localhost:5000/api/admin/banner/${editingId}`
      : "http://localhost:5000/api/admin/banner";

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        alert(editingId ? "Sửa banner thành công!" : "Thêm banner thành công!");
        closeModal();
        loadData(); // Reload lại danh sách
      } else {
        alert("Lỗi: " + (json.thong_bao || "Không thành công"));
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  // Xóa banner
  const handleDelete = async (id: number) => {
    if (!confirm("Xóa banner này? Không thể khôi phục!")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/banner/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

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

  // Format date
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

  // Get position name
  const getPositionName = (position: string) => {
    const positions: Record<string, string> = {
      popup: "Popup",
      slider: "Slider",
      top: "Top",
      sidebar: "Sidebar",
      bottom: "Bottom",
      main: "Trang chủ",
      category: "Danh mục",
      product: "Sản phẩm",
    };
    return positions[position] || position;
  };

  // Get status name
  const getStatusName = (status: boolean) => {
    return status ? "Hiển thị" : "Ẩn";
  };

  // Get position options
  const positionOptions = [
    { value: "popup", label: "Popup" },
    { value: "slider", label: "Slider" },
    { value: "top", label: "Top" },
    { value: "sidebar", label: "Sidebar" },
    { value: "bottom", label: "Bottom" },
    { value: "main", label: "Trang chủ" },
    { value: "category", label: "Danh mục" },
    { value: "product", label: "Sản phẩm" },
  ];

  if (loading) return <p className="text-center text-xl py-10">Đang tải...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-black text-gray-900">Danh sách banner</h1>
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
          Thêm banner mới
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
                  Banner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thông tin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Vị trí
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
              {data.map((banner, index) => (
                <tr key={banner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700 text-center">
                    {banner.stt}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`http://localhost:5000${banner.img}`}
                        className="w-24 h-16 object-cover rounded-lg border"
                        alt={banner.name}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg mb-1">
                        {banner.name}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">URL: </span>
                        <a
                          href={banner.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {banner.url.length > 40
                            ? banner.url.substring(0, 40) + "..."
                            : banner.url}
                        </a>
                      </p>
                      <p className="text-xs text-gray-500">ID: {banner.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        banner.vi_tri === "popup"
                          ? "bg-purple-100 text-purple-800"
                          : banner.vi_tri === "slider"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getPositionName(banner.vi_tri)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        banner.an_hien
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {getStatusName(banner.an_hien)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {formatDate(banner.updatedAt)}
                  </td>
                  <td className="px-6 py-4 text-center space-x-3">
                    <button
                      onClick={() => openModal(banner)}
                      className="text-blue-600 hover:underline font-medium text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="text-red-600 hover:underline font-medium text-sm"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa banner */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
            <div className="px-8 py-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? "Sửa banner" : "Thêm banner mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên banner *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên banner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL liên kết *
                  </label>
                  <input
                    type="url"
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vị trí hiển thị *
                  </label>
                  <select
                    value={form.vi_tri}
                    onChange={(e) =>
                      setForm({ ...form, vi_tri: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {positionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái *
                  </label>
                  <select
                    value={form.an_hien}
                    onChange={(e) =>
                      setForm({ ...form, an_hien: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Hiển thị</option>
                    <option value="0">Ẩn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh banner {!editingId && "*"}
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
                <p className="text-xs text-gray-500 mt-1">
                  Kích thước đề xuất: 1920x600px (cho slider), 800x600px (cho
                  popup)
                </p>

                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Xem trước:
                    </p>
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-h-64 object-contain rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl("");
                          setImageFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {editingId && !previewUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Ảnh hiện tại:
                    </p>
                    <img
                      src={previewUrl}
                      alt="Current"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                  </div>
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
