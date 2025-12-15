import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class YeuThichTin extends Model{
    public id!: number;
    public id_user!: number;
    public id_tin!: number;
}
YeuThichTin.init({
    id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
    id_user : {type: DataType.INTEGER},
    id_tin: {type: DataType.INTEGER}
},{
    sequelize,
    tableName: 'yeuthich_tin',
    timestamps: true
});