import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class ThuocTinhSP extends Model{
    public id_sp!: number;
    public id_tt!: number;
    public gia_tri!: string
}
ThuocTinhSP.init({
    id_sp: {type: DataType.INTEGER, primaryKey: true},
    id_tt: {type: DataType.INTEGER, primaryKey: true},
    gia_tri: {type: DataType.STRING, set(val) {
        this.setDataValue('gia_tri', typeof val === 'string' ? val.trim() : val);
    },}
},{
    sequelize, 
    timestamps: false,
    tableName: 'thuoc_tinh_sp'
})