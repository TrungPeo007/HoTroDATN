import {  Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
import { DM_San_Pham } from "./danhmucsp";

export class YeuThichSp extends Model {
    public id!: number;
    public id_user!: number;
    public id_sp!: number;
    // public sanpham?: SanPham//để ts gợi ý thuộc tính  không báo lỗi với những khóa ngoại
}
YeuThichSp.init(
    {
        id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
        id_user: {type: DataType.INTEGER},
        id_sp: {type: DataType.INTEGER}
        
    },{
        sequelize,
        timestamps: true,
        tableName: 'yeuthich_sanpham'
    }
)
