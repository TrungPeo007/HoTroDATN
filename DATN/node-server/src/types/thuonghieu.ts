import {ParsedQs} from 'qs'
import {ParamsDictionary} from 'express-serve-static-core'
export interface GetAllThuongHieu extends ParsedQs{
    page: string;
    limit: string
}
export interface ThuongHieuSPParams extends ParamsDictionary{
    id: string;
}
export interface AllowedUpdateThuongHieuSp {
    ten_th?: string;
    slug?: string;
    img?: string| null;
    an_hien?: number;
}
