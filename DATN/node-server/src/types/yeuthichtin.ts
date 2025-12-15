import { InferAttributes } from "sequelize";
import { DanhMucTin, TinTuc, YeuThichTin } from "../models";
import {ParamsDictionary} from 'express-serve-static-core'
//cách tự tạo type với incluce
export type YeuThichTinWithInclude = InferAttributes<
  YeuThichTin & { tin_tuc: TinTuc & { loai_tin_tuc: DanhMucTin } }
>;
//tự định nghĩa
export interface formattedDataYeuThichTin {
    id: number;
    createdAt: Date;
    tin_tuc: {
        id: number;
        tieu_de: number;
        img: string;
        noi_dung: string;
        tac_gia: string;
        loai_tin_tuc: {
            id: string;
            ten_dm: string;
        }
    }

}
export interface ParamsYeuThichTin extends ParamsDictionary{
    id: string;
}