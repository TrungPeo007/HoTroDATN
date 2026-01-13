import { Model } from "sequelize";
import { sequelize } from "../config/database";
import { DataType } from "sequelize-typescript";
export class ViShop extends Model{
    public id!: number;
    public id_shop!: number;
    public so_du!: number;
    public tong_da_rut!: number;
}
ViShop.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    id_shop: {type: DataType.INTEGER, unique: true},
    so_du: {type: DataType.INTEGER, defaultValue: 0},
    tong_da_rut: {type: DataType.INTEGER, defaultValue: 0},
},{
    sequelize,
    timestamps: true,
    tableName: 'vi_shop'
})