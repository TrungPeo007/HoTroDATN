"use client";
import {
  FaHome,
  FaGlobe,
  FaEnvelope,
  FaBoxOpen,
  FaClipboardList,
  FaNewspaper,
  FaImage,
  FaUserFriends,
  FaTags,
  FaCogs,
  FaCheckCircle,
  FaBoxes,
  FaLock,
  FaChartBar,
} from "react-icons/fa";

import Link from "next/link";
import { useLocale } from "../context/LocaleContext";

export default function Sidebar() {
  const { t } = useLocale();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col p-4">
      {/* Logo */}
      <div className="flex items-center mb-8">
        <span className="bg-yellow-400 text-black font-bold px-2 py-1 rounded-l">
          AD
        </span>
        <span className="text-white font-bold text-lg px-2">MIN</span>
      </div>

      {/* MENU */}
      <nav className="flex flex-col gap-4 text-sm">

        {/* Dashboard */}
        <SidebarItem icon={<FaChartBar />} label={t("dashboard")} href="/dashboard" />

        <SidebarItem icon={<FaHome />} label={t("home")} href="/" />
        <SidebarItem icon={<FaGlobe />} label={t("website")} href="/website" />
        <SidebarItem icon={<FaEnvelope />} label={t("contact")} href="/lien-he" />

        {/* --- NHÓM SẢN PHẨM --- */}
        <div>
          <SidebarItem icon={<FaBoxOpen />} label={t("product")} href="/san-pham" />

          <div className="ml-6 mt-2 flex flex-col gap-2 text-xs text-gray-300">
            <SidebarItem icon={<FaCogs />} label={t("product_setup")} href="/san-pham/thiet-lap" />
            <SidebarItem icon={<FaTags />} label={t("product_category")} href="/san-pham/danh-muc" />
            <SidebarItem icon={<FaCheckCircle />} label={t("product_feature")} href="/san-pham/tinh-nang" />
            <SidebarItem icon={<FaClipboardList />} label={t("product_status")} href="/san-pham/trang-thai" />
            <SidebarItem icon={<FaBoxes />} label={t("product_list")} href="/san-pham/danh-sach" />
          </div>
        </div>

        <SidebarItem icon={<FaClipboardList />} label={t("order")} href="/don-hang" />
        <SidebarItem icon={<FaNewspaper />} label={t("post")} href="/bai-viet" />
        <SidebarItem icon={<FaImage />} label={t("banner")} href="/banner" />
        <SidebarItem icon={<FaGlobe />} label={t("page")} href="/trang-don" />
        <SidebarItem icon={<FaUserFriends />} label={t("member")} href="/thanh-vien" />
        <SidebarItem icon={<FaImage />} label={t("gallery")} href="/thu-vien-anh" />
      </nav>
    </aside>
  );
}

/* COMPONENT ITEM */
function SidebarItem({
  label,
  icon,
  href,
}: {
  label: string;
  icon?: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 cursor-pointer hover:text-yellow-300 transition-all"
    >
      {icon ?? <FaLock className="text-xs" />}
      <span>{label}</span>
    </Link>
  );
}
