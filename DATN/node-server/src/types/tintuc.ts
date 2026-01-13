import { ParsedQs } from "qs";
import { ParamsDictionary } from "express-serve-static-core";
export interface GetAllTinTuc extends ParsedQs{
    page: string;
    limit: string;
}
export interface ParamsTintucByID extends ParameterDecorator{
    id: string;
}
export interface AllowedUpdateTinTuc{
    tieu_de?: string;
    img?: string|null;
    id_dm?: number;
    noi_dung?: string;
    tac_gia?: string;
    an_hien?: number;
}