import passport from "passport";
import {Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { AUTH_PROVIDER, FACEBOOK_CALLBACK_PATH, generateRandomString, GOOGLE_CALLBACK_PATH } from "../ultis/auth";
import { Strategy as FacebookStrategy } from "passport-facebook";
import {User} from "../models";
interface CustomError {
	status?: number;//dùng ? vì có khi dữ lieuj lỗi tra về ko có status
	thong_bao?: string;
	message?: string;

}
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "co_cai_nit",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "fgdfgdfgdfgdfgdfgdfgd",
    callbackURL: GOOGLE_CALLBACK_PATH,// phải khớp với googl trên console
    scope: ["profile",'email'],//lấy thông tin tử call back
    
},
    async(accessToken, refreshToken, profile, done)=>{
        //hàm này chạy khi xác thực thành công
        try {
            const googleId = profile.id;
            const email = profile.emails?.[0]?.value;
            const ho_ten = profile.displayName;
            const hinh = profile.photos?.[0]?.value;
            if(!email){
                return done(null, false, {status: 400, thong_bao: "Không thế lấy thông tin email từ google"});
            }
            let user = await User.findOne({where: {provider_id: googleId}});
            //nếu tìm thấy user tồn tại rồi cho vào luôn
            
            if(user){
                if(user.khoa ===1){
                    return done(null,false, {status: 423, thong_bao: "Tài khoản của bạn đã bị khóa vui lòng liên hệ ban quản trị viên để biết thêm chi tiết"});
                }
                return done(null, user);
            }
            //nếu chưa kiểm tra email đã tôn tại chưa so với dăng ký thường
            user = await User.findOne({where: {email}});
            if(user){
                if(user.provider !== AUTH_PROVIDER.LOCAL){
                    //email nãy đÃ ĐAngứ kyws facebook chưa
                    return done(null,false, {status: 409, thong_bao: `Email này đã được đăng ký bằng ${user.provider}`})
                }

                //nếu email  tồn tại rồi thì lk tài khaonr google với tài khoản cũ
                user.provider_id = profile.id;
                await user.save();
                return done(null,user);
            }
            //th nếu user và email không tồn tại thị tạo ngưới dung mới hoàn toàn
            //google nó ko cappas tài khoản thì cắt @ ra  tạo từ email
            let rawUserName = email?.split('@')[0];
            const safeBaseUsername = rawUserName
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, '')//chỉ giữ laaij  chữ cái và số
            .substring(0,10)//giới hạn độ dài phần đầu
            let taiKhoanMoi: string;
            let suffixLength = 6;/// đọ dài của chuỗi ngẫu nhiên
            while(true){
                const randomSuffix = generateRandomString(suffixLength);
                taiKhoanMoi = `${safeBaseUsername}${randomSuffix}`;
                const existingUser = await User.findOne({
                    where: {tai_khoan: taiKhoanMoi}
                });
                if(!existingUser){
                    break;//tên không tồn tại thì thoatas vong lặp
                }
            }
            
            const newUser = await User.create({
                provider_id: googleId,
                provider: AUTH_PROVIDER.GOOGLE,
                email,
                tai_khoan: taiKhoanMoi,
                ho_ten,
                hinh,
                xac_thuc_email_luc: new Date()
            })
            return done(null,newUser)

            
        } catch (error) {
            const err = error as CustomError;
            // console.log(err.message);
            console.error("Lỗi nghiêm trọng trong Google Strategy:", err.message);
            return done(err, false);
        }
    }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID || "11111221454",
    clientSecret: process.env.FACEBOOK_SECRET_KEY || "Tructiepgamelabatdiet",
    callbackURL: FACEBOOK_CALLBACK_PATH,
    profileFields: ['id','displayName','photos','email']
},async(accessToken, refreshToken, profile,done)=>{
    try {
        const facebookId = profile.id;
        const email = profile.emails?.[0]?.value
        const ho_ten = profile.displayName;
        const hinh = profile.photos?.[0]?.value;
        console.log(email,facebookId,ho_ten, hinh);
        
        if(!email){
            return done(null, false, {status: 400, thong_bao: "Không thể lấy thông tin email từ facebook"});
        }
        let user = await User.findOne({where: {provider_id: facebookId}});
        if(user){
            if(user.khoa === 1){
                return done(null, false, {status: 423, thong_bao: "Tài khoản của bạn đã bị khóa vui lòng liên hệ ban quản trị viên để biết thêm thông tin chi tiêt"});
            }
            return done(null,user);
        }
        user = await User.findOne({where: {email}});
        if(user){
            if(user.provider !== AUTH_PROVIDER.LOCAL){
                return done(null, false, {status: 409, thong_bao: `Email này đã được đăng ký bằng ${user.provider}`})
            }
            user.provider_id = profile.id;
            await user.save();
            return done(null, user);
        }
        let rawUserName = email?.split('@')[0];
        const safeBaseUsername = rawUserName
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0,10);
        let taiKhoanMoi: string;
        let suffixLength = 6;
        while(true){
            const randomSuffix = generateRandomString(suffixLength);
            taiKhoanMoi = `${safeBaseUsername}${randomSuffix}`;
            const existingUser = await User.findOne({
                where: {tai_khoan: taiKhoanMoi}
            })
            if(!existingUser){
                break;
            }
        }
        const newUser = await User.create({
            provider_id: facebookId,
            provider: AUTH_PROVIDER.FACEBOOK,
            email,
            tai_khoan: taiKhoanMoi,
            ho_ten,
            hinh,
            xac_thuc_email_luc: new Date()
        })
        return done(null, newUser)
        
    } catch (error) {
        const err = error as CustomError
        console.error("Lỗi nghiêm trọng trong Google Strategy:", err.message);
        return done(err, false);
    }
}))