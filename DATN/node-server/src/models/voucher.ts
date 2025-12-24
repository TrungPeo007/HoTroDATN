import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class Voucher extends Model{
    public id!: number;
    public ten_km!: string;
    public code!: string;
    public loai_km!: number;
    public gia_tri_giam!: number;
    public gia_giam_toi_da!: number;
    public gia_tri_don_min!: number;
    public so_luong!: number;
    public da_dung!: number;
    public gioi_han_user!: number;
    public ngay_bd!: string;
    public ngay_kt!: string;
    public trang_thai!: number;
}
Voucher.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    ten_km: {type: DataType.STRING, allowNull: false},
    code: {type: DataType.STRING, allowNull: false, unique: true},
    loai_km: {type: DataType.TINYINT, allowNull: false},
    gia_tri_giam: {type: DataType.INTEGER, defaultValue: 0},
    gia_giam_toi_da: {type: DataType.INTEGER, defaultValue: 0},
    gia_tri_don_min: {type: DataType.INTEGER, defaultValue: 0},
    so_luong: {type: DataType.INTEGER, defaultValue: 100},
    da_dung: {type: DataType.INTEGER, defaultValue: 0},
    gioi_han_user: {type: DataType.BOOLEAN, defaultValue: 1},
    ngay_bd: {type: DataType.DATE},
    ngay_kt: {type: DataType.DATE},
    trang_thai: {type: DataType.BOOLEAN, defaultValue: 1},
},{
    sequelize,
    timestamps: true,
    tableName: 'khuyen_mai'
})