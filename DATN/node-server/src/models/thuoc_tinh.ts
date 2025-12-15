import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class ThuocTinh extends Model {
    public id!: number;
    public ten_thuoc_tinh!: string;
}
ThuocTinh.init(
    {
        id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
        ten_thuoc_tinh: {type: DataType.STRING,
            set(val){
                this.setDataValue('ten_thuoc_tinh', typeof val === 'string' ? val.trim() : val)
            }
        }
    },{
        sequelize,
        timestamps: false,
        tableName: 'thuoc_tinh'
    }
);