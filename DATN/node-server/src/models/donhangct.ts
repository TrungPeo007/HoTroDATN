import { Model } from "sequelize";
import { sequelize } from "../config/database";
import { DataType } from "sequelize-typescript";
export class  DonHangChiTiet extends Model{
    public id!: number;
    public id_dh!: number;
    public id_sp!: number;
    public id_bt!: number;
    public ten_sp!: string;
    public img!: string;
    public so_luong!:  number;
    public gia!: number;
    public thanh_tien!: number;
}
DonHangChiTiet.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    id_dh: {type: DataType.INTEGER},
    id_sp: {type: DataType.INTEGER},
    id_bt: {type: DataType.INTEGER},
    ten_sp: {type: DataType.STRING, allowNull: false},
    img: {type: DataType.STRING},
    so_luong: {type: DataType.INTEGER, defaultValue: 1},
    gia: {type: DataType.INTEGER, defaultValue: 0},
    thanh_tien: {type: DataType.INTEGER, defaultValue: 0},
    
},{
    timestamps: false,
    tableName: 'don_hang_ct',
    sequelize
})