import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class IMG_SanPham extends Model{
    public id!: number;
    public url!: string;
    public id_sp!: number;
}
IMG_SanPham.init({
    id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
    url: {type: DataType.STRING},
    id_sp: {type: DataType.INTEGER}
},{
    sequelize, 
    tableName: 'img_sp',
    timestamps: false
})