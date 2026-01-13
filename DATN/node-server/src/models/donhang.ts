import { Model } from "sequelize"
import { sequelize } from "../config/database"
import { DataType } from "sequelize-typescript";
export class DonHang extends Model{
    public id!: number;
    public ma_dh!: string;
    public id_user!: number;
    public id_km!: number;
    public id_shop!: number;
    public id_pttt!: number;
    public ten_nguoi_nhan!: string;
    public dien_thoai!: string;
    public dia_chi_gh!: string;
    public tam_tinh!: number;
    public phi_vc!: number;
    public giam_gia!: number;
    public tong_tien!: number;
    public trang_thai_dh!: number;
    public trang_thai_thanh_toan!: number;
    public ngay_hoan_thanh!: number;
    public ghi_chu!: string;
    public ly_do_huy!: string;
    
}
DonHang.init({
    id: {type: DataType.INTEGER, primaryKey: true, autoIncrement: true},
    ma_dh: {type: DataType.INTEGER, unique: true, allowNull: false},
    id_user: {type: DataType.INTEGER},
    id_km: {type: DataType.INTEGER},
    id_shop: {type: DataType.INTEGER},
    id_pttt: {type: DataType.INTEGER},
    ten_nguoi_nhan: {type: DataType.STRING,
        set(val) {
            this.setDataValue('ten_nguoi_nhan', typeof val === 'string' ? val.trim() : val);
        },
    },
    dien_thoai: {type: DataType.STRING, 
        set(val) {
            this.setDataValue('dien_thoai', typeof val === 'string' ? val.trim() : val);
        },
    },
    dia_chi_gh: {type: DataType.STRING,
        set(val) {
            this.setDataValue('dia_chi_gh', typeof val === 'string' ? val.trim() : val);
        },
    },
    tam_tinh: {type: DataType.INTEGER, defaultValue: 0},
    phi_vc: {type: DataType.INTEGER, defaultValue: 0},
    giam_gia: {type: DataType.INTEGER, defaultValue: 0},
    tong_tien: {type: DataType.INTEGER, defaultValue: 0},
    trang_thai_dh: {type: DataType.TINYINT, defaultValue: 0},
    trang_thai_thanh_toan: {type: DataType.BOOLEAN, defaultValue: 0},
    ghi_chu: {type: DataType.TEXT},
    ngay_hoan_thanh: {type: DataType.DATE, allowNull: true},
    ly_do_huy: {type: DataType.STRING,
        set(val) {
            this.setDataValue('ly_do_huy', typeof val === 'string' ? val.trim() : val);
        },
    }
},{
    sequelize,
    timestamps: true,
    tableName: 'don_hang'
});