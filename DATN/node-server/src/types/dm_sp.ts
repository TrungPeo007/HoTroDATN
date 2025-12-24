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
export interface FilterQuery extends ParsedQs {
    page: string;
    limit: string;
    sort: 'price_asc' | 'price_desc' | 'newest' | 'bestseller' | 'popular';
    id_ths?: string;
    min_price?: string;
    max_price?: string;
    rating?: string;
    is_on_sale?: string;// true hoặc  1
    is_stock?: string;//true hoặc  1
}
export interface ParamsDanhMucBySlug extends ParamsDictionary{
    slug: string;
}
export interface DanhMucTreeNode {
    id: number;
    ten_dm: string;
    parent_id: number| null;
    slug: string;
    children: DanhMucTreeNode[];//chứ mảng con
}

export interface DanhMucSidebarChild  {
    id: number;
    ten_dm: string;
    slug: string;
};

export interface DanhMucSidebarParent  {
    id: number;
    ten_dm: string;
    slug: string;
    children: DanhMucSidebarChild[];
};