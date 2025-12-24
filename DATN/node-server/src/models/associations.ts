//lk  tổng ccacs khóa ngoại nằm ở đây
// import { SanPham } from "./SanPham";
import { DanhGia } from "./danhgia";
import { DM_San_Pham } from "./danhmucsp";
import { DanhMucTin } from "./danhmuctin";
import { IMG_DanhGia } from "./img_dg";
import { IMG_SanPham } from "./img_sp";
import { SanPham } from "./sanpham";
import { SanPhamBienThe } from "./sanpham_bienthe";
import { ThuocTinh } from "./thuoc_tinh";
import { ThuocTinhSP } from "./thuoctinhsp";
import { ThuongHieu } from "./thuonghieusp";
import { TinTuc } from "./tintuc";
import { User } from "./User";
import { YeuThichSp } from "./yeuthichsp";
// import { YeuThichSp } from "./yeuthichsp";
import { YeuThichTin } from "./yeuthichtin";
import { GioHang } from "./giohang";
import { GioHangChiTiet } from "./giohangct";
import { KhuyenMaiUser } from "./kmaiuser";
import { Dia_chi_User } from "./dia_chi_user";
import { DonHang } from "./donhang";
import { DonHangChiTiet } from "./donhangct";
import { PTTT } from "./pttt";
import { Voucher } from "./voucher";
// Một sản phẩm có thể được nhiều người yêu thích
// SanPham.hasMany(YeuThichSp, { foreignKey: "id_sp", as: "yeuthichs" });

// // Một record yêu thích trỏ về sản phẩm
// YeuThichSp.belongsTo(SanPham, { foreignKey: "id_sp", as: "sanpham" });
YeuThichSp.belongsTo(SanPham, {foreignKey: 'id_sp',as: 'yeu_thich_sp'});

TinTuc.hasMany(YeuThichTin, {foreignKey: "id_tin", as: "yeu_thich_tin"});
YeuThichTin.belongsTo(TinTuc, {foreignKey: "id_tin", as: "tin_tuc"});
TinTuc.belongsTo(DanhMucTin, {foreignKey: "id_dm",as: 'loai_tin_tuc'});
SanPhamBienThe.belongsTo(SanPham, {foreignKey: 'id_sp', as: 'san_pham'})
SanPham.hasMany(SanPhamBienThe, {foreignKey: "id_sp", as: 'san_pham_bien_the'});
SanPham.hasMany(IMG_SanPham, {foreignKey: 'id_sp',as:'imgs'});
SanPham.hasMany(ThuocTinhSP, {foreignKey: 'id_sp', as: 'thuoctinhsp'});
ThuocTinhSP.belongsTo(ThuocTinh, {foreignKey: 'id_tt', as: 'ten_thuoc_tinh'});
SanPham.belongsTo(ThuongHieu, {foreignKey: 'id_th',as: 'thuong_hieu'});
SanPham.belongsTo(DM_San_Pham, {foreignKey: 'id_dm',as: 'danh_muc'});
SanPham.hasMany(DanhGia,{foreignKey: 'id_sp',as:'danh-gia'});
DanhGia.hasMany(IMG_DanhGia, {foreignKey: 'id_dg', as: 'img_dg'});
DanhGia.belongsTo(User, {foreignKey: 'id_user',as: 'nguoi_danh_gia'});
DanhGia.belongsTo(SanPham,{foreignKey: 'id_sp',as:'san_pham'});
GioHang.hasMany(GioHangChiTiet, {foreignKey: 'id_gh',as:'gh_chi_tiet'});
GioHangChiTiet.belongsTo(SanPham, {foreignKey: 'id_sp',as: 'san_pham'});
GioHangChiTiet.belongsTo(SanPhamBienThe, {foreignKey: 'id_bt', as: 'bien_the'});
GioHangChiTiet.belongsTo(GioHang, {foreignKey: 'id_gh',as: 'gio_hang'});
SanPham.belongsTo(User, {foreignKey: 'id_user',as: 'shop'});
DM_San_Pham.hasMany(DM_San_Pham, {foreignKey: 'parent_id',as: 'children'})
DonHang.hasMany(DonHangChiTiet, {foreignKey: 'id_dh',as:'chi_tiet_dh' });
DonHang.belongsTo(User, {foreignKey: 'id_shop', as: 'shop'});
DonHang.belongsTo(User, {foreignKey: "id_user",as: 'nguoi_mua'});
DonHang.belongsTo(PTTT, {foreignKey: 'id_pttt',as: 'pttt'});
DonHang.belongsTo(Voucher, {foreignKey: 'id_km',as: 'voucher'});