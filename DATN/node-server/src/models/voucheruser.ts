import { Model } from "sequelize";
import { sequelize } from "../config/database";
import { DataType } from "sequelize-typescript";
export class VoucherUser extends Model{
    public id!: number;
    public id_user!: number;
    public id_km!: number;
    public ngay_su_dung!: string;
}
VoucherUser.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    id_user: {type: DataType.INTEGER},
    id_km: {type: DataType.INTEGER},
    ngay_su_dung: {type: DataType.DATE}
}, {
    sequelize,
    tableName: 'khuyenmai_user',
    timestamps: false
});