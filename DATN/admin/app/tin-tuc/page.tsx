"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../context/LocaleContext";

interface TinTucItem {
  id: number;
  tieu_de: string;
  img: string;
  id_dm: number;
  noi_dung: string;
  tac_gia: string;
  luot_xem: number;
  an_hien: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DanhMucItem {
  id: number;
  ten_dm: string;
}

export default function TinTucManagementPage() {
  const { t } = useLocale();
  const [data, setData] = useState<TinTucItem[]>([]);
  const [danhMuc, setDanhMuc] = useState<DanhMucItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    tieu_de: "",
    id_dm: "",
    noi_dung: "",
    tac_gia: "",
    an_hien: "1",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Load danh sách tin tức
  const loadData = async () => {
    setLoading(true);
    try {
      // Load danh sách tin tức
      const resTinTuc = await fetch("http://localhost:5000/api/admin/tin-tuc", {
        method: "GET",
        credentials: "include",
      });

      if (resTinTuc.ok) {
        const json = await resTinTuc.json();
        if (json) setData(json.result.data);
      }

      // Load danh mục tin tức
      const resDanhMuc = await fetch(
        "http://localhost:5000/api/admin/danh-muc-tin",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (resDanhMuc.ok) {
        const jsonDanhMuc = await resDanhMuc.json();
        if (jsonDanhMuc) setDanhMuc(jsonDanhMuc.result.data || []);
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

  // Mở modal thêm/sửa
  const openModal = (item?: TinTucItem) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        tieu_de: item.tieu_de,
        id_dm: item.id_dm.toString(),
        noi_dung: item.noi_dung,
        tac_gia: item.tac_gia,
        an_hien: item.an_hien ? "1" : "0",
      });
      setPreviewUrl(`http://localhost:5000${item.img}`);
    } else {
      setEditingId(null);
      setForm({
        tieu_de: "",
        id_dm: "",
        noi_dung: "",
        tac_gia: "",
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

    // Kiểm tra ảnh tin tức nếu là thêm mới
    if (!editingId && !imageFile) {
      alert("Vui lòng chọn ảnh đại diện cho tin tức!");
      return;
    }

    // Kiểm tra các trường bắt buộc
    if (!form.tieu_de || !form.id_dm || !form.noi_dung || !form.tac_gia) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    const formData = new FormData();
    formData.append("tieu_de", form.tieu_de);
    formData.append("id_dm", form.id_dm);
    formData.append("noi_dung", form.noi_dung);
    formData.append("tac_gia", form.tac_gia);
    formData.append("an_hien", form.an_hien);

    if (imageFile) {
      formData.append("img", imageFile);
    }

    const url = editingId
      ? `http://localhost:5000/api/admin/tin-tuc/${editingId}`
      : "http://localhost:5000/api/admin/tin-tuc";

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        alert(
          editingId ? "Sửa tin tức thành công!" : "Thêm tin tức thành công!"
        );
        closeModal();
        loadData(); // Reload lại danh sách
      } else {
        alert("Lỗi: " + (json.thong_bao || "Không thành công"));
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  // Xóa tin tức
  const handleDelete = async (id: number) => {
    if (!confirm("Xóa tin tức này? Không thể khôi phục!")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/tin-tuc/${id}`, {
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
    });
  };

  // Get status name
  const getStatusName = (status: boolean) => {
    return status ? "Hiển thị" : "Ẩn";
  };

  // Get danh mục name
  const getDanhMucName = (id_dm: number) => {
    const dm = danhMuc.find((dm) => dm.id === id_dm);
    return dm ? dm.ten_dm : "Không xác định";
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) return <p className="text-center text-xl py-10">Đang tải...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-black text-gray-900">Danh sách tin tức</h1>
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
          Thêm tin tức mới
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
                  Ảnh đại diện
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thông tin tin tức
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Lượt xem
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Ngày đăng
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Tác vụ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((tinTuc, index) => (
                <tr key={tinTuc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700 text-center">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={`http://localhost:5000${tinTuc.img}`}
                        className="w-24 h-20 object-cover rounded-lg border"
                        alt={tinTuc.tieu_de}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg mb-2 hover:text-blue-600 cursor-pointer">
                        {truncateText(tinTuc.tieu_de, 60)}
                      </p>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Tác giả: </span>
                        <span>{tinTuc.tac_gia}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        <span className="font-medium">Nội dung: </span>
                        {truncateText(
                          tinTuc.noi_dung.replace(/<[^>]*>/g, ""),
                          80
                        )}
                      </p>
                      <p className="text-xs text-gray-400">ID: {tinTuc.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {getDanhMucName(tinTuc.id_dm)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-gray-800">
                        {tinTuc.luot_xem.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">lượt xem</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tinTuc.an_hien
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {getStatusName(tinTuc.an_hien)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {formatDate(tinTuc.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center space-x-3">
                    <button
                      onClick={() => openModal(tinTuc)}
                      className="text-blue-600 hover:underline font-medium text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(tinTuc.id)}
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

      {/* Modal Thêm/Sửa tin tức */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? "Sửa tin tức" : "Thêm tin tức mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề tin tức *
                  </label>
                  <input
                    required
                    value={form.tieu_de}
                    onChange={(e) =>
                      setForm({ ...form, tieu_de: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tiêu đề tin tức"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tác giả *
                  </label>
                  <input
                    required
                    value={form.tac_gia}
                    onChange={(e) =>
                      setForm({ ...form, tac_gia: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên tác giả"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục tin tức *
                  </label>
                  <select
                    required
                    value={form.id_dm}
                    onChange={(e) =>
                      setForm({ ...form, id_dm: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {danhMuc.map((dm) => (
                      <option key={dm.id} value={dm.id}>
                        {dm.ten_dm}
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
                  Ảnh đại diện {!editingId && "*"}
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
                  Kích thước đề xuất: 800x450px
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
                      src={`http://localhost:5000${
                        data.find((t) => t.id === editingId)?.img
                      }`}
                      alt="Current"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung tin tức *
                </label>
                <textarea
                  required
                  value={form.noi_dung}
                  onChange={(e) =>
                    setForm({ ...form, noi_dung: e.target.value })
                  }
                  rows={8}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập nội dung tin tức (có thể sử dụng HTML)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Có thể sử dụng HTML để định dạng nội dung
                </p>
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
