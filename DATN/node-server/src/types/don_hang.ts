import { ParsedQs } from "qs";


export interface BienTheData{
    id: number;
    id_sp: number;
    ten_bien_the: string;
    gia: number;
    so_luong: number;
    img: string|null;
}
export interface SanPhamData{
    id: number;
    ten_sp: string;
    gia: number;
    sale: number;
    so_luong: number;
    id_user: number;
    img: string;
    slug: string;
    shop: {
        id: number;
        ten_shop: string;
        hinh: string;
    }
}
export interface createSanPhamData{
    id: number;
    ten_sp: string;
    gia: number;
    sale: number;
    so_luong: number;
    id_user: number;
    img: string;
    slug: string;
    
}
interface checkOutOrderItem{
    id_sp: number;
    id_bt: number| null;
    ten_sp: string;
    img: string;
    so_luong: number;
    gia_da_giam: number;
    gia_goc: number;
    sale: number;
    thanh_tien: number;
    hang_co_sang: number; 
}
interface createOutOrderItem{
    id_sp: number;
    id_bt: number| null;
    ten_sp: string;
    img: string;
    so_luong: number;
    gia_da_giam: number;
    gia_goc: number;
    sale: number;
    thanh_tien: number;
    hang_co_sang: number; 
    is_bienthe: boolean;
}
export interface ShopGroup{
    shop_info: {
        id: number;
        ten_shop: string;
        hinh_shop: string| null;
    }
    items: checkOutOrderItem[];
    tam_tinh: number;
    phi_ship: number;
    giam_gia_khuyen_mai: number;
    final_total: number;
}
export interface createShopGroup{
    
    items: createOutOrderItem[];
    tam_tinh: number;
    // name?: string;
    
}
export interface GetallDonHang extends ParsedQs{
    page: string;
    limit: string;
    trang_thai: string;
}
export interface whereConditionLichSuDH {
    id_user: number;
    trang_thai_dh?:number;
}

export interface DonHangWithChiTiet {
  chi_tiet_dh?: {
    id_sp: number;
    id_bt?: number | null;
    so_luong: number;
  }[];
}