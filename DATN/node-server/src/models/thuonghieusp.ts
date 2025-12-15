import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class ThuongHieu extends Model{
    public id!: number;
    public ten_th!: string;
    public slug!: string;
    public img!: string;
    public an_hien!: number;
}
ThuongHieu.init({
    id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
    ten_th: {type: DataType.STRING,allowNull: false,
        set(value){
            this.setDataValue('ten_th',typeof value === 'string' ? value.trim() : value);
        }
    },
    slug: {type: DataType.STRING,
        set(value){
            this.setDataValue('slug',typeof value === 'string' ? value.trim() : value);
        }
    },
    img: {type: DataType.STRING},
    an_hien: {type: DataType.BOOLEAN, defaultValue: 1}
},{
    sequelize,
    tableName: 'thuong_hieu',
    timestamps: true
})
