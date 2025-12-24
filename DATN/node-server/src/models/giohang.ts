import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
export class GioHang extends Model{
    public id!: number;
    public id_user!: number;
    
}
GioHang.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    id_user: {type: DataTypes.INTEGER}
},{
    sequelize,
    tableName: 'gio_hang',
    timestamps: true
})