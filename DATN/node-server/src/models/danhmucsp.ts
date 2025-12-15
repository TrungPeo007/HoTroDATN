import { Model } from "sequelize"
import { DataType } from "sequelize-typescript";
import {sequelize} from '../config/database';
export class DM_San_Pham extends Model {
    public id!: number;
    public ten_dm!: string;
    public img!: string;
    public stt!: number;
    public parent_id!: number;
    public an_hien!: number;
    public slug!: string;
}
DM_San_Pham.init(
    {
        id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
        ten_dm: {type: DataType.STRING, allowNull: false,
            set(value){
                this.setDataValue('ten_dm', typeof value === 'string' ? value.trim() : value);
            }
        },
        img: {type: DataType.STRING},
        stt: {type: DataType.INTEGER},
        parent_id: {type: DataType.INTEGER},
        an_hien: {type: DataType.BOOLEAN, defaultValue: 1},
        slug: {type: DataType.STRING, unique: true,
            set(value){
                this.setDataValue('slug', typeof value === 'string' ? value.trim() : value);
            }
        }
    },{
        sequelize,
        timestamps: true,
        tableName: 'danh_muc'
    }
)
