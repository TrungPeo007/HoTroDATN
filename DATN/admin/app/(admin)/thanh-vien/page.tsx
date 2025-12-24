"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../context/LocaleContext";
import { apiFetch } from "@/app/lib/fetcher";

interface UserItem {
  id: number;
  tai_khoan: string;
  email: string;
  ho_ten: string | null;
  vai_tro: number;
  hinh: string | null;
  provider: string;
  provider_id: string;
  khoa: number;
  dien_thoai: string | null;
  createdAt: string;
}

export default function UserManagementPage() {
  const { t } = useLocale();
  const [data, setData] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    tai_khoan: "",
    email: "",
    ho_ten: "",
    mat_khau: "",
    vai_tro: "0",
    dien_thoai: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    apiFetch("http://localhost:5000/api/admin/user", {
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

  const openModal = (item?: UserItem) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        tai_khoan: item.tai_khoan,
        email: item.email,
        ho_ten: item.ho_ten || "",
        mat_khau: "",
        vai_tro: item.vai_tro.toString(),
        dien_thoai: item.dien_thoai || "",
      });
      if (item.hinh) {
        setPreviewUrl(item.hinh);
      }
    } else {
      setEditingId(null);
      setForm({
        tai_khoan: "",
        email: "",
        ho_ten: "",
        mat_khau: "",
        vai_tro: "0",
        dien_thoai: "",
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

    if (!editingId && !form.mat_khau) {
      alert("Vui lòng nhập mật khẩu cho tài khoản mới!");
      return;
    }

    const formData = new FormData();
    formData.append("tai_khoan", form.tai_khoan);
    formData.append("email", form.email);
    formData.append("ho_ten", form.ho_ten);
    formData.append("vai_tro", form.vai_tro);
    formData.append("dien_thoai", form.dien_thoai);

    if (form.mat_khau) {
      formData.append("mat_khau", form.mat_khau);
    }

    if (imageFile) {
      formData.append("hinh", imageFile);
    }

    const url = editingId
      ? `http://localhost:5000/api/admin/user/${editingId}`
      : "http://localhost:5000/api/admin/user";

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
          editingId
            ? "Sửa người dùng thành công!"
            : "Thêm người dùng thành công!"
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
    if (!confirm("Xóa người dùng này? Không thể khôi phục!")) return;

    try {
      const res = await apiFetch(`http://localhost:5000/api/admin/user/${id}`, {
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

  const handleToggleLock = async (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 0 ? 1 : 0;
    const action = newStatus === 1 ? "khóa" : "mở khóa";

    if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

    try {
      const res = await apiFetch(`http://localhost:5000/api/admin/user/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          khoa: newStatus,
        }),
      });

      const json = await res.json();

      if (json.success) {
        alert(`${action} tài khoản thành công!`);
        loadData();
      } else {
        alert(`${action} tài khoản thất bại: ${json.thong_bao}`);
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

  const getRoleName = (role: number) => {
    return role === 1 ? "Quản trị viên" : "Người dùng";
  };

  const getProviderName = (provider: string) => {
    const providers: Record<string, string> = {
      local: "Local",
      google: "Google",
      facebook: "Facebook",
    };
    return providers[provider] || provider;
  };

  if (loading) return <p className="text-center text-xl py-10">Đang tải...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-black text-gray-900">
          Danh sách người dùng
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
          Thêm người dùng
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
                  Tài khoản
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thông tin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Đăng ký
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Tác vụ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.hinh ? (
                        <img
                          src={user.hinh}
                          className="w-12 h-12 object-cover rounded-full"
                          alt={user.ho_ten || user.tai_khoan}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            {user.ho_ten?.[0] || user.tai_khoan?.[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user.tai_khoan}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getProviderName(user.provider)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.ho_ten || "Chưa cập nhật"}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.dien_thoai && (
                        <p className="text-sm text-gray-500">
                          📞 {user.dien_thoai}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.vai_tro === 1
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {getRoleName(user.vai_tro)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.khoa === 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.khoa === 0 ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center space-x-3">
                    <button
                      onClick={() => openModal(user)}
                      className="text-blue-600 hover:underline font-medium text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleToggleLock(user.id, user.khoa)}
                      className={`font-medium text-sm ${
                        user.khoa === 0
                          ? "text-amber-600 hover:underline"
                          : "text-green-600 hover:underline"
                      }`}
                    >
                      {user.khoa === 0 ? "Khóa" : "Mở khóa"}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
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

      {/* Modal Thêm/Sửa người dùng */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="px-8 py-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? "Sửa thông tin người dùng" : "Thêm người dùng mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tài khoản *
                  </label>
                  <input
                    required
                    value={form.tai_khoan}
                    onChange={(e) =>
                      setForm({ ...form, tai_khoan: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!!editingId}
                  />
                  {editingId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Không thể thay đổi tài khoản
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    value={form.ho_ten}
                    onChange={(e) =>
                      setForm({ ...form, ho_ten: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điện thoại
                  </label>
                  <input
                    value={form.dien_thoai}
                    onChange={(e) =>
                      setForm({ ...form, dien_thoai: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingId
                      ? "Mật khẩu mới (để trống nếu không đổi)"
                      : "Mật khẩu *"}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={form.mat_khau}
                    onChange={(e) =>
                      setForm({ ...form, mat_khau: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      editingId ? "Nhập mật khẩu mới nếu muốn đổi" : ""
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vai trò *
                  </label>
                  <select
                    value={form.vai_tro}
                    onChange={(e) =>
                      setForm({ ...form, vai_tro: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">Người dùng</option>
                    <option value="1">Quản trị viên</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh đại diện
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
                  <div className="mt-4 flex items-center gap-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl("");
                        setImageFile(null);
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Xóa ảnh
                    </button>
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
