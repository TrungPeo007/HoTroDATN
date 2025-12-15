import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class DanhMucTin extends Model{
    public id!: number;
    public ten_dm!: string;
    public parent_id!: number;
    public stt!: number;
    public an_hien!: number;
}
DanhMucTin.init({
    id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
    ten_dm: {type: DataType.STRING, allowNull: false,
        set(value){
            this.setDataValue('ten_dm',typeof value === 'string' ? value.trim() : value);
        }
    },
    parent_id: {type: DataType.INTEGER},
    stt: {type: DataType.INTEGER},
    an_hien: {type: DataType.BOOLEAN, defaultValue: 1}

},{
    sequelize,
    tableName: 'dm_tin',
    timestamps: true
});