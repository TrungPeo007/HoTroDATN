"use client";
import {
  BellIcon,
  ChatBubbleBottomCenterTextIcon,
  GlobeAltIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { useLocale } from "../(admin)/context/LocaleContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();

  const toggleLocale = () => {
    setLocale(locale === "vi" ? "en" : "vi");
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include", // ⚠️ BẮT BUỘC
      });

      const json = await res.json();

      if (json.success) {
        router.push("/login"); // đá về login
        router.refresh(); // clear cache layout
      } else {
        alert(json.thong_bao || "Logout thất bại");
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  return (
    <header className="w-full bg-white shadow px-6 py-3 flex items-center justify-between">
      {/* Search box */}
      <div className="relative w-72">
        <input
          type="text"
          placeholder={t("Search")}
          className="w-full border border-gray-300 rounded-full px-10 py-2 text-sm 
                     focus:outline-none focus:ring focus:border-blue-500 
                     placeholder-gray-700 placeholder:font-medium"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-600 absolute left-3 top-2.5 pointer-events-none" />
      </div>

      {/* Icon group */}
      <div className="flex items-center gap-6 text-gray-600">
        <BellIcon className="w-5 h-5 cursor-pointer hover:text-blue-500 transition-colors" />

        {/* Language switcher */}
        <div
          className="flex items-center gap-1 cursor-pointer hover:text-blue-500 transition-colors"
          onClick={toggleLocale}
        >
          <GlobeAltIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            {locale === "vi" ? "Vie" : "Eng"}
          </span>
        </div>

        <div className="relative">
          <ChatBubbleBottomCenterTextIcon className="w-5 h-5 cursor-pointer hover:text-blue-500 transition-colors" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>

        <div
          className="flex items-center gap-2 cursor-pointer hover:text-blue-500 transition-colors"
          onClick={handleLogout}
        >
          <UserCircleIcon className="w-6 h-6" />
          <span className="text-sm font-medium">{t("logout")}</span>
        </div>
      </div>
    </header>
  );
}
