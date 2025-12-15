import { Model } from "sequelize";
import { sequelize } from "../config/database";
import { DataType } from "sequelize-typescript";

export class IMG_DanhGia extends Model{
    public id!: number;
    public id_dg!: number;
    public url!: string;
} 
IMG_DanhGia.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    id_dg: {type: DataType.INTEGER},
    url: {type: DataType.STRING}
},{
    sequelize,
    tableName: 'img_dg',
    timestamps: false
})