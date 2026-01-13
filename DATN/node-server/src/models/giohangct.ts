import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class GioHangChiTiet extends Model{
    public id!: number;
    public id_gh!: number;
    public id_sp!: number;
    public id_bt!: number;
    public so_luong!: number;
    public da_chon!: number
}
GioHangChiTiet.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    id_gh: {type: DataType.INTEGER},
    id_sp: {type: DataType.INTEGER},
    id_bt: {type: DataType.INTEGER},
    so_luong: {type: DataType.INTEGER, defaultValue: 1},
    da_chon: {type: DataType.BOOLEAN, defaultValue: 0}
},{
    sequelize,
    tableName: 'gio_hang_ct',
    timestamps: true
})