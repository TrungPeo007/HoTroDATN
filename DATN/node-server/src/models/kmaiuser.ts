import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class KhuyenMaiUser extends Model{
    public id!: number;
    public id_user!: number;
    public id_km!: number;
    public ngay_su_dung!: string;
}
KhuyenMaiUser.init({
    id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
    id_user: {type: DataType.INTEGER},
    id_km: {type: DataType.INTEGER},
    id_dh: {type: DataType.INTEGER},
    ngay_su_dung: {type: DataType.DATE}
},{
    sequelize,
    tableName: 'khuyenmai_user',
    timestamps: false
});