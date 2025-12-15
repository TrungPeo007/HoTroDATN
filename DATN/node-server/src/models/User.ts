import { DataTypes, Model } from "sequelize";

import { sequelize } from "../config/database";

export class User extends Model {
  public id!: number; //public có thể truy cập ở mọi nơi private chi trong class  protec chỉ  trong  class extend từ class cha
  public tai_khoan!: string; //! bắt buộc có gia trị
  public email!: string;
  public mat_khau!: string | null;
  public ho_ten!: string | null;
  public vai_tro!: number;
  public hinh!: string | null;
  public provider!: string;
  public provider_id!: string;
  public khoa!: number;
  public token!: string | null;
  public token_expire!: Date | null;
  public refresh_token!: string | null;
  public xac_thuc_email_luc!: Date | null;
  public otp!: string | null;
  public otp_expire!: Date | null;
  public dien_thoai!: string | null;
  public token_version!: number;
  public login_failed_count!: number;
  public last_login_fail!: Date | null;
  public locked_until!: Date | null;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tai_khoan: { type: DataTypes.STRING, allowNull: false, 
      set(value){
        this.setDataValue('tai_khoan', typeof value === 'string' ? value.trim() : value);
      }
    },
    email: { type: DataTypes.STRING, allowNull: false ,
      set(value){
        this.setDataValue('email', typeof value === 'string' ? value.trim() : value);
      }
    },
    mat_khau: { type: DataTypes.STRING},
    ho_ten: { type: DataTypes.STRING ,
      set(value){
        this.setDataValue('ho_ten', typeof value === 'string' ? value.trim() : value);
      }
    },
    vai_tro: { type: DataTypes.TINYINT, defaultValue: 0 }, //0 public 1 admin
    hinh: {type: DataTypes.STRING, allowNull: true},
    provider: {type: DataTypes.STRING, defaultValue: 'local', allowNull: false},
    provider_id: {type: DataTypes.STRING},
    khoa: { type: DataTypes.TINYINT, defaultValue: 0 }, //1 khóa 0 bình thường
    token: { type: DataTypes.STRING },
    token_expire: {type: DataTypes.DATE},
    refresh_token: {type: DataTypes.STRING},
    xac_thuc_email_luc: { type: DataTypes.DATE },
    otp: { type: DataTypes.STRING ,
      set(value){
        this.setDataValue('otp', typeof value === 'string' ? value.trim() : value)
      }
    },
    otp_expire: { type: DataTypes.DATE },
    dien_thoai: { type: DataTypes.STRING,
      set(value){
        this.setDataValue('dien_thoai', typeof value === 'string' ? value.trim() : value)
      }
    },
    token_version: { type: DataTypes.INTEGER, defaultValue: 0 },
    login_failed_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    last_login_fail: { type: DataTypes.DATE },
    locked_until: { type: DataTypes.DATE },
  },
  {
    sequelize,
    timestamps: true,
    tableName: "users",
  }
);
