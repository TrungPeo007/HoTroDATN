import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class TinTuc extends Model{
    public id!: number;
    public tieu_de!: string;
    public img!: string;
    public id_dm!: number;
    public noi_dung!: string;
    public tac_gia!: string;
    public luot_xem!: number;
    public an_hien!: number;
}
TinTuc.init({
    id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
    tieu_de: {type : DataType.STRING, allowNull: false,
        set(value){
            this.setDataValue('tieu_de', typeof value === 'string' ? value.trim() : value );
        }
    },
    img: {type: DataType.STRING},
    id_dm: {type: DataType.INTEGER},
    noi_dung: {type: DataType.TEXT, allowNull: false},
    tac_gia: {type: DataType.STRING, 
        set(value){
            this.setDataValue('tac_gia',typeof value === 'string' ? value.trim() : value);
        }
    },
    luot_xem: {type: DataType.STRING, defaultValue: 0},
    an_hien: {type: DataType.BOOLEAN, defaultValue: 1}
},{
    sequelize,
    tableName: 'tin_tuc',
    timestamps: true

})