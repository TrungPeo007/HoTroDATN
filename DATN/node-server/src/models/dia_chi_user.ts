import { Model } from "sequelize";
import { sequelize } from "../config/database";
import { DataType } from "sequelize-typescript";
export class Dia_chi_User extends Model {
    public id!: number;
    public id_user!: number;
    public ho_ten!: string;
    public dien_thoai!: string;
    public dia_chi!: string;
    public tinh!: string;
    public quan!: string;
    public phuong!: string
    public mac_dinh!: number
}
Dia_chi_User.init(
    {
        id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
        id_user: {type: DataType.INTEGER},
        ho_ten: {type: DataType.STRING,
            set(value){
                this.setDataValue('ho_ten', typeof value === 'string' ? value.trim() : value);
            }
        },
        dien_thoai: {type: DataType.STRING, allowNull: false,
            set(value){
                this.setDataValue('dien_thoai', typeof value === 'string' ? value.trim() : value);
            }
        },
        dia_chi: {type: DataType.STRING, allowNull: false,
            set(value){
                this.setDataValue('dia_chi', typeof value === 'string' ? value.trim() : value);
            }
        },
        tinh: {type: DataType.STRING},
        quan: {type: DataType.STRING},
        phuong: {type: DataType.STRING},
        mac_dinh: {type: DataType.BOOLEAN, defaultValue: 0}
    },
    {sequelize,
        timestamps: true,
        tableName: 'dia_chi_user'
    }
    
);
