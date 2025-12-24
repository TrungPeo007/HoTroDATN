"use client";
import { FaFacebookF, FaYoutube, FaTiktok } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import { useLocale } from "../(admin)/context/LocaleContext";

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer
      className="px-8 py-10 text-white"
      style={{ backgroundColor: "#073447" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Cột 1: Giới thiệu */}
        <div>
          <h2 className="text-lg font-semibold mb-4">KADU SHOP</h2>
          <p className="text-sm leading-relaxed">{t("footer_intro")}</p>
          <div className="flex gap-4 mt-4">
            {/* Tiền mặt */}
            <div className="flex items-center gap-2 bg-white text-black text-xs px-3 py-1 rounded w-[120px] h-[30px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8h18M3 16h18M5 12h14"
                />
              </svg>
              <span className="font-medium">{t("payment_cash")}</span>
            </div>

            {/* Chuyển khoản */}
            <div className="flex items-center gap-2 bg-white text-black text-xs px-3 py-1 rounded w-[120px] h-[30px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v8m0 0l-4-4m4 4l4-4"
                />
              </svg>
              <span className="font-medium">{t("payment_transfer")}</span>
            </div>
          </div>
        </div>

        {/* Cột 2: Dịch vụ khách hàng */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {t("footer_customer_service")}
          </h2>
          <ul className="space-y-2 text-sm">
            <li>{t("order")}</li>
            <li>{t("blog")}</li>
            <li>{t("sales_guide")}</li>
            <li>{t("warranty_policy")}</li>
            <li>{t("purchase_guide")}</li>
          </ul>
        </div>

        {/* Cột 3: Tài khoản */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t("footer_account")}</h2>
          <ul className="space-y-2 text-sm">
            <li>{t("account")}</li>
            <li>{t("login")}</li>
            <li>{t("cart")}</li>
            <li>{t("wishlist")}</li>
            <li>{t("shop")}</li>
          </ul>
        </div>

        {/* Cột 4: Đăng ký nhận tin */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {t("footer_newsletter")}
          </h2>
          <p className="text-sm mb-4">{t("footer_newsletter_text")}</p>
          <form className="mb-4">
            <div className="flex w-full">
              <input
                type="email"
                placeholder={t("footer_email_placeholder")}
                className="flex-grow px-4 py-2 rounded-l-full bg-white text-black text-sm 
                 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-r-full 
                 text-sm font-medium transition-colors"
              >
                {t("footer_subscribe")}
              </button>
            </div>
          </form>
          <div className="flex gap-4 text-xl">
            <FaFacebookF className="cursor-pointer hover:text-blue-400" />
            <SiZalo className="cursor-pointer hover:text-blue-400" />
            <FaYoutube className="cursor-pointer hover:text-red-500" />
            <FaTiktok className="cursor-pointer hover:text-pink-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
