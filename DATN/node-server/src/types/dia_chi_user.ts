import { ParsedQs } from "qs";
import {ParamsDictionary} from 'express-serve-static-core'
export interface GetAllDiaChiByUser extends ParsedQs{
    page: string;
    limit: string;
}
export interface DiaChiParams extends ParamsDictionary{
    id: string;
}
export interface CreateDiaChiByUser {
    ho_ten: string;
    dien_thoai: string;
    dia_chi: string;
    tinh: string;
    quan: string;
    phuong: string;
    mac_dinh: boolean;
}
export interface ApiProvince {
    code: string;
    name: string;
    name_with_type: string;
}
export interface ApiDistrict{
    code: string;
    name: string;
    name_with_type: string;
    parent_code: string;
}
export interface ApiWard{
    code: string;
    name: string;
    name_with_type: string;
    parent_code: string
}
export interface LocationCache {
    provinces: Record<string, ApiProvince> | null;
    districts: Record<string, Record<string, ApiDistrict>>; // Key ngoài là provinceCode
    wards: Record<string, Record<string, ApiWard>>; // Key ngoài là districtCode
}//generic ne cu
export interface ApiResponse<T> {
    
    data: {
        data: T[]
    }
}
export interface AddressNames {
    tinh_name: string;
    quan_name: string;
    phuong_name: string;
}
export interface AllowedUpdateDiaChi {
    ho_ten?: string;
    dien_thoai?: string;
    dia_chi?: string;
    tinh?: string;
    quan?: string;
    phuong?: string;
    mac_dinh?:number;
}