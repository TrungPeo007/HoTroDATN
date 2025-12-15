import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
import { Model } from "sequelize";
export class SanPham extends Model{
    public id!: number;
    public ten_sp!: string;
    public code!: string;
    public slug!: string;
    public img!: string;
    public gia!: number;
    public sale!: number;
    public so_luong!: number;
    public da_ban!: number;
    public luot_xem!: number;
    public xuat_xu!: string;
    public dvctn!: string;
    public dvt!: string;
    public noi_bat!: string;
    public mo_ta!: string;
    public an_hien!: string;
    public id_user!: number;
    public id_dm!: number;
    public id_th!: number;
}
SanPham.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    ten_sp: {type: DataType.STRING, allowNull: false, 
        set(val) {
            this.setDataValue('ten_sp', typeof val === 'string' ? val.trim(): val);
        },
    },
    code: {type: DataType.STRING, allowNull: false, unique: true},
    slug: {type: DataType.STRING, allowNull: false, 
        set(val) {
            this.setDataValue('slug', typeof val === 'string' ? val.trim() : val);
        },
    },
    img: {type: DataType.STRING},
    gia: {type: DataType.INTEGER, defaultValue: 0},
    sale: {type: DataType.INTEGER, defaultValue: 0},
    so_luong: {type: DataType.INTEGER, defaultValue: 0},
    da_ban: {type: DataType.INTEGER, defaultValue: 0},
    luot_xem: {type: DataType.INTEGER, defaultValue: 0},
    xuat_xu: {type: DataType.STRING, set(val) {
        this.setDataValue('xuat_xu', typeof val === 'string' ? val.trim() : val);
    }
    },
    dvctn: {type: DataType.STRING,
        set(val) {
            this.setDataValue('dvctn', typeof val === 'string' ? val.trim() : val);
        },
    },
    dvt: {type: DataType.STRING,
        set(val) {
            this.setDataValue('dvt', typeof val === 'string' ? val.trim() : val);
        },
    },
    noi_bat : {type: DataType.BOOLEAN, defaultValue: 0},
    mo_ta: {type: DataType.STRING},
    an_hien: {type: DataType.BOOLEAN, defaultValue: 1},
    id_user: {type: DataType.INTEGER},
    id_dm: {type: DataType.INTEGER},
    id_th: {type: DataType.INTEGER},
},{
    sequelize,
    tableName: 'san_pham',
    timestamps: true
});
