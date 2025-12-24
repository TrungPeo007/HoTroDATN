import { ParsedQs } from "qs";
import {ParamsDictionary} from 'express-serve-static-core'
export interface GetAllDanhMucTin extends ParsedQs{
    page: string;
    limit: string
}
export interface DanhMucTinParams extends ParamsDictionary{
    id: string;
}
export interface AllowedUpdateDanhMucTin{
    ten_dm?: string;
    parent_id?: number|null;
    stt?: number;
    an_hien?: number;
}
