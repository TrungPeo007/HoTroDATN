import "./globals.css";
import { LocaleProvider } from "./context/LocaleContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Bọc toàn bộ app bằng LocaleProvider */}
        <LocaleProvider>
          <div className="flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
              <Navbar />
              <main className="p-6 flex-grow">{children}</main>
              <Footer />
            </div>
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}