import { ParsedQs } from "qs";
import { ParamsDictionary } from "express-serve-static-core";
export interface createThuocTinhSp{
    id_sp?: number;
    id_tt: number;
    value: string;
}
// export interface DataThuocTinhSp{
//     id_sp: number;
//     id_tt: number;
//     value: string
// }
export interface createBienTheSp{
    ten_bien_the: string;
    code?: string|undefined;
    gia: number;
    so_luong: number;
}
export interface GetALLSanPHam extends ParsedQs{
    page: string;
    limit: string
}
export interface ThuocTinhMap{
    id_tt: number;
    gia_tri: string;
    ten_thuoc_tinh: {
        ten_thuoc_tinh: string
    }
}
export interface ImgBienThe {
    img: string| undefined
}
export interface ImgSP {
    url: string;
}
export interface ParamsSanPhamBySlug extends ParamsDictionary{
    slug: string;
}