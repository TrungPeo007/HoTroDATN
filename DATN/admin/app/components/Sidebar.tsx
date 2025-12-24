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
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

import Link from "next/link";
import { useLocale } from "../(admin)/context/LocaleContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      product: pathname.startsWith("/san-pham"),
    }
  );

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col p-4 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center mb-8 px-2">
        <span className="bg-yellow-400 text-black font-bold px-2 py-1 rounded-l">
          AD
        </span>
        <span className="text-white font-bold text-lg px-2">MIN</span>
      </div>

      {/* MENU */}
      <nav className="flex flex-col gap-2 text-sm overflow-y-auto flex-1">
        {/* Dashboard */}
        <SidebarItem
          icon={<FaChartBar />}
          label={t("dashboard")}
          href="/dashboard"
          isActive={pathname === "/dashboard"}
        />

        <SidebarItem
          icon={<FaHome />}
          label={t("home")}
          href="/"
          isActive={pathname === "/"}
        />
        <SidebarItem
          icon={<FaGlobe />}
          label={t("website")}
          href="/website"
          isActive={pathname.startsWith("/website")}
        />
        <SidebarItem
          icon={<FaEnvelope />}
          label={t("contact")}
          href="/lien-he"
          isActive={pathname.startsWith("/lien-he")}
        />

        {/* --- NHÓM SẢN PHẨM --- */}
        <div className="mt-2">
          <button
            onClick={() => toggleGroup("product")}
            className={`w-full flex items-center justify-between gap-3 cursor-pointer transition-all px-3 py-2 rounded-lg mb-1 ${
              pathname.startsWith("/san-pham")
                ? "bg-yellow-500 text-black font-semibold"
                : "hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <FaBoxOpen
                className={
                  pathname.startsWith("/san-pham")
                    ? "text-black"
                    : "text-gray-300"
                }
              />
              <span>{t("product")}</span>
            </div>
            {expandedGroups.product ? (
              <FaChevronDown className="text-xs" />
            ) : (
              <FaChevronRight className="text-xs" />
            )}
          </button>

          {expandedGroups.product && (
            <div className="ml-6 flex flex-col gap-1 text-xs">
              <SidebarItem
                icon={<FaBoxes />}
                label={t("product_list")}
                href="/san-pham"
                isActive={pathname === "/san-pham"}
                indent={true}
              />
              <SidebarItem
                icon={<FaCogs />}
                label={t("product_setup")}
                href="/san-pham/thiet-lap"
                isActive={pathname === "/san-pham/thiet-lap"}
                indent={true}
              />
              <SidebarItem
                icon={<FaTags />}
                label={t("product_category")}
                href="/san-pham/danh-muc"
                isActive={pathname === "/san-pham/danh-muc"}
                indent={true}
              />
              <SidebarItem
                icon={<FaCheckCircle />}
                label={t("product_feature")}
                href="/san-pham/tinh-nang"
                isActive={pathname === "/san-pham/tinh-nang"}
                indent={true}
              />
              <SidebarItem
                icon={<FaClipboardList />}
                label={t("product_status")}
                href="/san-pham/trang-thai"
                isActive={pathname === "/san-pham/trang-thai"}
                indent={true}
              />
            </div>
          )}
        </div>

        <SidebarItem
          icon={<FaClipboardList />}
          label={t("order")}
          href="/don-hang"
          isActive={pathname.startsWith("/don-hang")}
        />
        <SidebarItem
          icon={<FaNewspaper />}
          label={t("post")}
          href="/tin-tuc"
          isActive={pathname.startsWith("/tin-tuc")}
        />
        <SidebarItem
          icon={<FaImage />}
          label={t("banner")}
          href="/banner"
          isActive={pathname.startsWith("/banner")}
        />
        <SidebarItem
          icon={<FaGlobe />}
          label={t("voucher")}
          href="/voucher"
          isActive={pathname.startsWith("/voucher")}
        />
        <SidebarItem
          icon={<FaUserFriends />}
          label={t("member")}
          href="/thanh-vien"
          isActive={pathname.startsWith("/thanh-vien")}
        />
        <SidebarItem
          icon={<FaImage />}
          label={t("gallery")}
          href="/thu-vien-anh"
          isActive={pathname.startsWith("/thu-vien-anh")}
        />
      </nav>

      {/* User profile at bottom */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg cursor-pointer">
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="font-bold text-black">A</span>
          </div>
          <div>
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-gray-400">admin@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* COMPONENT ITEM */
function SidebarItem({
  label,
  icon,
  href,
  isActive = false,
  indent = false,
}: {
  label: string;
  icon?: React.ReactNode;
  href: string;
  isActive?: boolean;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 cursor-pointer transition-all px-3 py-2 rounded-lg ${
        indent ? "ml-2" : ""
      } ${
        isActive
          ? "bg-yellow-500 text-black font-semibold"
          : "hover:bg-gray-800 hover:text-yellow-300"
      }`}
    >
      <span className={isActive ? "text-black" : "text-gray-300"}>
        {icon ?? <FaLock className="text-xs" />}
      </span>
      <span>{label}</span>
    </Link>
  );
}
