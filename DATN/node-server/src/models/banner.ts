import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class Banner extends Model{
    public id!: number;
    public stt!: number;
    public name!: string;
    public url!: string;
    public img!: string;
    public vi_tri!: string;
    public an_hien!: number;
};
Banner.init({
    id: {type: DataType.INTEGER, autoIncrement: true, primaryKey: true},
    stt: {type: DataType.INTEGER},
    name: {type: DataType.STRING,
        set(value){
            this.setDataValue('name', typeof value === 'string' ? value.trim() : value);
        }
    },
    url: {type:DataType.STRING,
        set(value){
            this.setDataValue('url',typeof value === 'string' ? value.trim(): value);
        }
    },
    img: {type: DataType.STRING},
    vi_tri: {type: DataType.ENUM('home_top','home_middle','home_bottom','home_slider','popup'), defaultValue: "home_slider"},
    an_hien: {type: DataType.BOOLEAN, defaultValue: 1}

},{
    timestamps: true,
    sequelize,
    tableName: 'banner'
})