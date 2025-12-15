import { ParsedQs } from "qs";
import {ParamsDictionary} from 'express-serve-static-core'
export interface GetAllDanhMuc extends ParsedQs{
    page: string;
    limit: string
}
export interface DanhMucSPParams extends ParamsDictionary{
    id: string;
}
export interface CreateDanhMucSP{
    ten_dm: string;
    parent_id?: number;
    an_hien: string;
    slug:string;
}
export interface UpdateDanhMucSP{
    ten_dm: string;
    stt: number;
    parent_id?: number|null;
    an_hien: boolean;
    slug: string;
    
}
export interface AllowedUpdateDanhMucSP{
    ten_dm?: string;
    stt?: number;
    img?: string|null;
    parent_id?: number|null;
    an_hien?: number;
    slug?: string;
}