import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class DanhGia extends Model{
    public id!: number;
    public id_sp!: number;
    public id_user!: number;
    public noi_dung!: string;
    public so_sao!: number;
    public ngay_dg!: string;
    public phan_hoi!: string;
    public ngay_ph!: string;
    public tinh_nang!: string;
    public chat_luong!: string;

}
DanhGia.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    id_sp: {type: DataType.INTEGER},
    id_user: {type: DataType.INTEGER},
    noi_dung: {type: DataType.STRING},
    so_sao: {type: DataType.INTEGER, allowNull: true},
    ngay_dg: {type: DataType.DATE},
    phan_hoi: {type: DataType.STRING},
    ngay_ph: {type: DataType.DATE},
    tinh_nang: {type: DataType.STRING},
    chat_luong: {type: DataType.STRING},
},{
    sequelize,
    tableName: 'danh_gia',
    timestamps: true
})