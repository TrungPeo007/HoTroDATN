import { ParamsDictionary } from 'express-serve-static-core';
export interface GetAllUser{
    page: number;
    limit: number
}
export interface CreateUser {
    tai_khoan: string;
    email: string;
    mat_khau: string;
    mat_khau_nhap_lai: string;
    ho_ten: string;
    vai_tro: number;
}
export interface UserHinh {
    hinh_user: Express.Multer.File[];
}
export interface UpdateUser {
    mat_khau: string;
    mat_khau_nhap_lai: string;
    ho_ten: string;
    dien_thoai: string;
    vai_tro: number;
    khoa: boolean;
}
export interface AllowedUpdateUser {
    
    mat_khau?: string;
    mat_khau_nhap_lai?: string;
    ho_ten?:string;
    dien_thoai?:string;
    vai_tro?: number;
    khoa?: number;
    hinh?:string| null;
    token_version?: number;
}
export interface UserParams extends ParamsDictionary {
    id: string;
}