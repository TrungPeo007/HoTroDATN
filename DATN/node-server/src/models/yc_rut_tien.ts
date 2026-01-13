import { Model } from "sequelize";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../config/database";
export class YeuCauRutTien extends Model{
    public id!: number;
    public id_shop!: number;
    public so_tien!: number;
    public ten_ngan_hang!: number;
    public so_tk!: number;
    public ten_chu_tk!: number;
    public trang_thai!: number;
    public ghi_chu!: string;
    public ngay_xu_ly!: string;
    public ly_do!: string;
}
YeuCauRutTien.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    id_shop: {type: DataType.INTEGER},
    so_tien: {type: DataType.INTEGER, allowNull: false,
        set(val) {
            this.setDataValue('ly_do',typeof val === 'string' ? val.trim() : val)
        }
    },
    ten_ngan_hang: {type: DataType.STRING, allowNull: false,
        set(val) {
            this.setDataValue('ly_do',typeof val === 'string' ? val.trim() : val)
        }
    },
    so_tk: {type: DataType.STRING, allowNull: false,
        set(val) {
            this.setDataValue('ly_do',typeof val === 'string' ? val.trim() : val)
        }
    },
    ten_chu_tk: {type: DataType.STRING, allowNull: false,
        set(val) {
            this.setDataValue('ly_do',typeof val === 'string' ? val.trim() : val)
        }
    },
    trang_thai: {type: DataType.TINYINT, defaultValue: 0},
    ghi_chu: {type: DataType.TEXT,
        set(val) {
            this.setDataValue('ly_do',typeof val === 'string' ? val.trim() : val)
        }
    },
    ngay_xu_ly: {type: DataType.DATE, allowNull: true},
    ly_do: {type: DataType.STRING, allowNull: true,
        set(val) {
            this.setDataValue('ly_do',typeof val === 'string' ? val.trim() : val)
        }
    },
},{
    sequelize,
    timestamps: true,
    tableName: 'yeu_cau_rut_tien'
})