import express from "express";
import { sequelize } from "./config/database";
import cors from "cors";
import './config/passport';
import cookieParser from "cookie-parser";

import setupSwagger from "./swagger";
import { adminAuth } from "./middleware/auth";

import passport from "passport";

import AuthRouter from "./routes/authRoutes";
import UserRouter from  "./routes/userRoutes";
import SiteRouter from './routes/siteRoutes';
import DMSPRouter from './routes/dm_spRouter';
import ThuongHieuSpRouter from './routes/thuonghieu';
import DMTinRouter from './routes/dm_tinRoutes';
import TinTucRouter from './routes/tintucRouter';
import BannerRouter from './routes/bannerRouter';
import ThuocTinhRouter from './routes/thuoctinhrouter';
import SanPhamRouter from './routes/sanphamRouter';
import PTTTRouter from './routes/ptttRoutes';
const app = express();
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001', // nếu có
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));

const port = process.env.PORT || 6000;

app.use(passport.initialize());//để passpord dùng đc trong express
app.use('/',AuthRouter);
app.use('/api/site',SiteRouter);
// app.use('/api/admin', adminAuth);
app.use('/api/admin/user', UserRouter)
app.use('/api/admin/danh-muc-sp', DMSPRouter);
app.use('/api/admin/thuong-hieu-sp',ThuongHieuSpRouter);
app.use('/api/admin/danh-muc-tin', DMTinRouter)
app.use('/api/admin/tin-tuc',TinTucRouter);
app.use('/api/admin/banner',BannerRouter);
app.use('/api/admin/thuoc-tinh-sp', ThuocTinhRouter);
app.use('/api/admin/san-pham', SanPhamRouter);
app.use('/api/admin/pttt',PTTTRouter);
// app.get("/test-admin", adminAuth, (req, res) => {
//   res.status(200).json({ msg: "Middleware passed!" });
// });

    


///router viêt dưới đây
setupSwagger(app);
(async()=>{
    try {
        await sequelize.authenticate();
        console.log("kêt nối cơ sở dữ liệu  thành công");
        app.listen(port, ()=>{
            console.log(`server đang chạy tại  cổng: ${port}`);
        })
        .on('error',function(err){
            console.log('lỗi xảy ra khi  chạy ứng dụng',err.message);
        })
    } catch (err:any) {
        console.log('kết nối cơ  sở dữ liệu thất bại :',err.message);
        process.exit(1);//dừng app nếu db bị lỗi
    }
})();