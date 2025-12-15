import { Model } from "sequelize";
import { sequelize } from "../config/database";
import { DataType } from "sequelize-typescript";
export class PTTT extends Model{
    public id!: number;
    public ten_pt!: string;
    public code!: string;
    public img!: string;
    public an_hien!: number;
}
PTTT.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    ten_pt: {type: DataType.STRING, allowNull: false,
        set(val) {
            this.setDataValue('ten_pt',typeof val === 'string' ? val.trim() : val);
        },
    },
    code: {type: DataType.STRING, allowNull: false, unique: true,
        set(val) {
            this.setDataValue('code',typeof val === 'string' ? val.trim() : val);
        },
    },
    img: {type: DataType.STRING},
    an_hien: {type: DataType.BOOLEAN, defaultValue: 1}
},{
    sequelize,
    tableName: 'phuong_thuc_tt',
    timestamps: true
})