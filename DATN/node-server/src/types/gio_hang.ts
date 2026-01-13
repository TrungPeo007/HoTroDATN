export interface GetCartItem{
    id: number;
    id_sp: number;
    id_bt?: number;
    so_luong: number;
    da_chon: number;
    bien_the: {
        id: number;
        ten_bien_the: string;
        img?: string;
        gia: number;
        so_luong: number;
    };
    san_pham: {
        ten_sp: string;
        img: string;
        sale: number;
        gia: number;
        so_luong: number;
        slug: string;
        an_hien: number;
        shop: ShopInfo
    }
}
export interface CartItemFormatted{
    cart_item_id: number;
    id_sp: number;
    id_bt: number| null;
    ten_sp: string;
    slug: string;
    ten_bien_the: string | null;
    img: string;
    gia_goc: number;
    gia_hien_tai: number;
    gia_tong: number;
    sale: number;
    so_luong: number;
    max_so_luong: number;
    is_active: boolean;
    da_chon: number;
}

export interface ShopInfo{
    id: number;
    ten_shop: string;
    hinh: string | null;
}
export interface CartItemWithShop extends CartItemFormatted{
    shop_info: ShopInfo;
}
export interface CartGroupByShop {
    id_shop: number;
    ten_shop: string | null;
    hinh_shop: string | null;
    items: CartItemFormatted[];
}