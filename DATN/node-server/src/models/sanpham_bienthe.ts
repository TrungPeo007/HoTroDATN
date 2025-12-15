import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class SanPhamBienThe extends Model{
    public id!: number;
    public id_sp!: number;
    public code!: string;
    public ten_bien_the!: string;
    public gia!: number;
    public so_luong!: number;
    public img!: string;
}
SanPhamBienThe.init({
    id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
    id_sp: {type: DataType.INTEGER},
    code: {type: DataType.STRING, 
        set(val) {
            this.setDataValue('code', typeof val === 'string' ? val.trim() : val);
        },
    },
    ten_bien_the: {type: DataType.STRING, 
        set(val) {
            this.setDataValue('ten_bien_the', typeof val === 'string' ? val.trim() : val);
        },
    },
    gia: {type: DataType.INTEGER, defaultValue: 0},
    so_luong: {type: DataType.INTEGER, defaultValue: 0},
    img: {type: DataType.STRING}
},{
    sequelize,
    tableName: 'san_pham_bien_the',
    timestamps: true
}
);