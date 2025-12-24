import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import bcrypt from "bcryptjs";
import {
  CustomJwtPayload,
  DangKyBody,
  dataToSendLogin,
  DoiMatKhauBody,
  GuiLaiXacThucDKBody,
  mailOptions,
  QuenMatKhauBody,
  RefreshJwtPayload,
  SafeUserData,
  XacThucDangKy,
} from "../types/auth";
import { Op } from "sequelize";
import { ADMIN_ROLE_ID } from "../config/explain";
import { DangNhapBody } from "../types/auth";
import nodemailer from "nodemailer";
import crypto from "crypto";
import {
  taoTrangDangNhapNhanh,
  taoTrangPhanHoiDangKyHtml,
  taoTrangPhanHoiHtml,
  taoTrangPhanHoiQuenPass,
  taoTrangPopupPortMessage,
} from "../ultis/htmlhelps";
import { resendLimiter } from "../middleware/limitedreq";
import { decrypt, encrypt } from "../ultis/cipher";
import {
  checkAuth,
  handleFacebookAuth,
  handleGoogleAuth,
} from "../middleware/auth";
import { AuthUser } from "../types/express";
import { AUTH_PROVIDER } from "../ultis/auth";
import passport from "passport";

const router = express.Router();
const refreshJwtExpiresIn = "7d";
const jwtExpiresIn = "15m";
const cookieMaxAgeRefresh = 7 * 24 * 60 * 60 * 1000;
const cookieMaxAge = 15 * 60 * 1000; //cho là 15 phút thôi  để đỡ bị mấy nhok ac ăn cắp
//với sai làm là luuuw asscees token ở cookie nên trả về token để fe gửi bearer token tránh bị csRF
//tạo thêm 1 cột mới trong csdl là refre token để tự dộng gia hạn lại token khi cần sử dụng
//thêm 1 hàm mieddwware nữa để tư cập lại acess token mới
//nhung thay facebook vaf gooogle luuw vo coookie nen chac van li lam coookie vay
interface CustomError {
  status?: number; //dùng ? vì có khi dữ lieuj lỗi tra về ko có status
  thong_bao?: string;
  message?: string;
}
const HOME_URL = process.env.BASE_URL || "http://phim.com";
const LOGIN_URL = process.env.LOGIN_URL || "http://phim.com";
const now = new Date();
//dấu nhọn đàu là param thứ 2 là res.body là res thứ 3 là req.body thứ 4 là queyr
router.post(
  "/api/dang-nhap",
  async (req: Request<{}, {}, DangNhapBody>, res: Response) => {
    try {
      const { tai_khoan, mat_khau } = req.body;
      // const taiKhoanTrim = tai_khoan.trim();
      const user = await User.findOne({
        where: {
          [Op.or]: [{ tai_khoan: tai_khoan }, { email: tai_khoan }],
          provider: AUTH_PROVIDER.LOCAL,
        },
      });
      if (!user) {
        throw { status: 404, thong_bao: "Email hoặc tài khoản không tồn tại" };
      }
      const now = new Date();
      if (!user.xac_thuc_email_luc || user.xac_thuc_email_luc > now) {
        throw {
          status: 423,
          thong_bao:
            "Bạn cần phải xác thực tài khoản qua mail trước khi đăng nhập",
        };
      }
      if (user.khoa == 1) {
        throw {
          status: 423,
          thong_bao:
            "Tài khoản đã bị khóa vui lòng liên hệ với bản quản trị để xử lý",
        };
      }
      if (user.locked_until && user.locked_until > now) {
        throw {
          status: 423,
          thong_bao:
            "Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần, vui thử lại sau ít phút",
        };
      }
      if (!user.mat_khau) {
        throw {
          status: 401,
          thong_bao: "Tên tài khoản hoặc mật khẩu không hợp lệ",
        };
      }
      const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
      const MAX_FAIL = 8; //lần sai tối đã
      if (!isMatch) {
        const failCount = user.login_failed_count + 1;
        //khơi tạo updatedata với kiểu dữ liệu rõ ràng theo model user cả method and thuộc tính
        const updateData: Partial<typeof User.prototype> = {
          login_failed_count: failCount,
          last_login_fail: now,
        };
        if (failCount >= MAX_FAIL) {
          updateData.khoa = 1;
          updateData.locked_until = null;
          await user.update(updateData);
          throw {
            status: 423,
            thong_bao:
              "Bạn nhập sai mật khẩu quá số lần cho phép tài khoản đã bị khóa liên hệ quản trị viên để biết thêm chi tiết",
          };
        } else if (failCount >= 5) {
          updateData.locked_until = new Date(now.getTime() + 5 * 60 * 1000);
          await user.update(updateData);
          const remaining = MAX_FAIL - failCount;
          throw {
            status: 423,
            thong_bao: `Bạn nhập sai mật khẩu quá nhiều, còn ${remaining} lần nũa sẽ khóa tài khoản, vui  lòng thử lại sau 5 phút`,
          };
        } else {
          await user.update(updateData);
          const remaining = MAX_FAIL - failCount;
          throw {
            status: 401,
            thong_bao: `Mật khẩu không đúng, còn ${remaining} lần nũa sẽ khóa tài khoản`,
          };
        }
      }
      await user.update({
        login_failed_count: 0,
        last_login_fail: null,
        locked_until: null,
      });
      const TokenPayLoad: CustomJwtPayload = {
        id: user.id,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        ho_ten: user.ho_ten,
        token_version: user.token_version,
      };
      const RefreshPayload: RefreshJwtPayload = {
        id: user.id,
        token_version: user.token_version,
      };
      const safeUserData: SafeUserData = {
        ho_ten: user.ho_ten,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        email: user.email,
      };
      const token = jwt.sign(
        TokenPayLoad,
        process.env.JWT_SECRET || "Your-secret-pass",
        { expiresIn: jwtExpiresIn }
      );
      const refreshToken = jwt.sign(
        RefreshPayload,
        process.env.REFRESH_JWT_SECRET || "your-secret-pass-refresh",
        { expiresIn: refreshJwtExpiresIn } //7 ngay
      );
      const salt = await bcrypt.genSalt(10);
      const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
      user.refresh_token = hashedRefreshToken; //luuw ma hoa token de du lo db thi ko lo token ra ngoai
      await user.save();
      res.cookie("_rtkn", refreshToken, {
        httpOnly: true,
        secure: false, //deploy thatja thi mo len
        path: "/",
        sameSite: "strict",
        maxAge: cookieMaxAgeRefresh,
      });
      res.cookie("_atkn", token, {
        //có thể đổi tên tăng tính bao mật nhưng chô dọc cookie cần đỏi  theo luôn
        httpOnly: true,
        secure: false,
        path: "/", //chỉ định gửi request cho ai
        sameSite: "strict",
        maxAge: cookieMaxAge,
      });
      return res.status(200).json({
        thong_bao: "Đăng nhập thành công",
        token, //có thể ko  trả về token nhưng tui  thích làm vậy
        user: safeUserData,
        success: true,
      });
    } catch (err) {
      const error = err as CustomError;
      const status = error.status || 500;
      const thong_bao =
        error.thong_bao || "Lỗi sever khi xử lý dữ liệu ở đăng nhập";

      res.status(status).json({ thong_bao, success: false });
    }
  }
);
router.post(
  "/api/login",
  async (req: Request<{}, {}, DangNhapBody>, res: Response) => {
    try {
      const { tai_khoan, mat_khau } = req.body;

      const user = await User.findOne({
        where: {
          [Op.or]: [{ tai_khoan: tai_khoan }, { email: tai_khoan }],
          provider: AUTH_PROVIDER.LOCAL,
        },
      });
      if (!user) {
        throw { status: 404, thong_bao: "Tài khoản hoặc email  không tồn tại" };
      }
      const now = new Date();
      if (!user.xac_thuc_email_luc || user.xac_thuc_email_luc > now) {
        throw {
          status: 423,
          thong_bao:
            "Bạn cần phải xác thực tài khoản qua mail trước khi đăng nhập",
        };
      }
      if (user.khoa == 1) {
        throw {
          status: 423,
          thong_bao:
            "Tài khoản đã bị khóa vui lòng liên hệ với bản quản trị để xử lý",
        };
      }
      if (user.locked_until && user.locked_until > now) {
        throw {
          status: 423,
          thong_bao:
            "Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần, vui thử lại sau ít phút",
        };
      }
      if (user.vai_tro !== ADMIN_ROLE_ID) {
        throw { status: 403, thong_bao: "Bạn không có quyền để vào" };
      }
      if (!user.mat_khau) {
        throw {
          status: 401,
          thong_bao: "Tên tài khoản hoặc mật không không hợp lệ",
        };
      }
      const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
      const MAX_FAIL = 8; //lần sai tối đã
      if (!isMatch) {
        const failCount = user.login_failed_count + 1;
        //khơi tạo updatedata với kiểu dữ liệu rõ ràng theo model user cả method and thuộc tính
        const updateData: Partial<typeof User.prototype> = {
          login_failed_count: failCount,
          last_login_fail: now,
        };
        if (failCount >= MAX_FAIL) {
          updateData.khoa = 1;
          updateData.locked_until = null;
          await user.update(updateData);
          throw {
            status: 423,
            thong_bao:
              "Bạn nhập sai mật khẩu quá số lần cho phép tài khoản đã bị khóa liên hệ quản trị viên để biết thêm chi tiết",
          };
        } else if (failCount >= 5) {
          updateData.locked_until = new Date(now.getTime() + 5 * 60 * 1000);
          await user.update(updateData);
          const remaining = MAX_FAIL - failCount;
          throw {
            status: 423,
            thong_bao: `Bạn nhập sai mật khẩu quá nhiều, còn ${remaining} lần nũa sẽ khóa tài khoản, vui  lòng thử lại sau 5 phút`,
          };
        } else {
          await user.update(updateData);
          const remaining = MAX_FAIL - failCount;
          throw {
            status: 401,
            thong_bao: `Mật khẩu không đúng, còn ${remaining} lần nũa sẽ khóa tài khoản`,
          };
        }
      }
      await user.update({
        login_failed_count: 0,
        last_login_fail: null,
        locked_until: null,
      });
      const TokenPayLoad: CustomJwtPayload = {
        id: user.id,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        ho_ten: user.ho_ten,
        token_version: user.token_version,
      };
      const RefreshPayload: RefreshJwtPayload = {
        id: user.id,
        token_version: user.token_version,
      };
      const safeUserData: SafeUserData = {
        ho_ten: user.ho_ten,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        email: user.email,
      };
      const token = jwt.sign(
        TokenPayLoad,
        process.env.JWT_SECRET || "Your-secret-pass",
        { expiresIn: jwtExpiresIn }
      );
      const refreshToken = jwt.sign(
        RefreshPayload,
        process.env.REFRESH_JWT_SECRET || "your-secret-pass-refresh",
        { expiresIn: refreshJwtExpiresIn } //7 ngay
      );
      const salt = await bcrypt.genSalt(10);
      const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
      user.refresh_token = hashedRefreshToken; //luuw ma hoa token de du lo db thi ko lo token ra ngoai
      await user.save();
      res.cookie("_rtkn", refreshToken, {
        httpOnly: true,
        secure: false, //deploy thatja thi mo len
        path: "/",
        sameSite: "strict",
        maxAge: cookieMaxAgeRefresh,
      });
      res.cookie("_atkn", token, {
        //có thể đổi tên tăng tính bao mật nhưng chô dọc cookie cần đỏi  theo luôn
        httpOnly: true,
        secure: false,
        path: "/", //Hiệu lực trên toàn web
        sameSite: "strict",
        maxAge: cookieMaxAge,
      });
      return res.status(200).json({
        thong_bao: "Đăng nhập thành công",
        token,
        user: safeUserData,
        success: true,
      });
    } catch (err) {
      const error = err as CustomError;
      console.log(error.message);
      const status = error.status || 500;
      const thong_bao =
        error.thong_bao || "Lỗi sever khi xử lý dữ liệu ở đăng nhập";

      res.status(status).json({ thong_bao, success: false });
    }
  }
);

router.post("/api/logout", async (req: Request, res: Response) => {
  try {
    // Xóa cookie
    res.clearCookie("_atkn", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    res.clearCookie("_rtkn", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      thong_bao: "Đăng xuất thành công",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      thong_bao: "Lỗi server khi đăng xuất",
      success: false,
    });
  }
});

router.get("/api/me", async (req, res) => {
  try {
    const token = req.cookies._atkn;
    if (!token) {
      return res.status(401).json({ success: false });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as CustomJwtPayload;

    const user = await User.findByPk(payload.id);

    if (!user || user.khoa === 1) {
      return res.status(401).json({ success: false });
    }

    if (user.vai_tro !== ADMIN_ROLE_ID) {
      return res.status(403).json({ success: false });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(401).json({ success: false });
  }
});

router.post(
  "/api/dang-ky",
  async (req: Request<{}, {}, DangKyBody>, res: Response) => {
    try {
      const { tai_khoan, email, mat_khau, mat_khau_nhap_lai, dien_thoai } =
        req.body;
      if (
        !tai_khoan?.trim() ||
        !email?.trim() ||
        !mat_khau ||
        !mat_khau_nhap_lai ||
        !dien_thoai
      ) {
        throw { status: 400, thong_bao: "Bạn chưa nhập đủ thông tin" };
      }
      if (tai_khoan.length < 5) {
        throw { status: 400, thong_bao: "Tài khoản phải có 5 ký tự trở lên" };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw { status: 400, thong_bao: "Email chưa đúng định dạng" };
      }
      const existing = await User.findOne({
        where: { [Op.or]: [{ tai_khoan }, { email }] },
      });
      if (existing) {
        if (existing.tai_khoan == tai_khoan) {
          throw {
            status: 409,
            thong_bao: "Tài khoản đã tồn tại , vui lòng nhập tài khoản khác",
          };
        } else if (existing.email == email) {
          throw {
            status: 409,
            thong_bao: "Email đã tồn tại , vui lòng chọn email khác",
          };
        }
      }
      const hasUpperCase = /[A-Z]/;
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
      if (
        mat_khau.length < 8 ||
        !hasUpperCase.test(mat_khau) ||
        !hasSpecialChar.test(mat_khau)
      ) {
        throw {
          status: 400,
          thong_bao:
            "Mật khẩu phải trên 8 ký tự, có 1 chữ in hoa, 1 ký tự đặc biệt",
        };
      }
      if (mat_khau != mat_khau_nhap_lai) {
        throw {
          status: 400,
          thong_bao: "Mật khẩu không trùng mật khẩu nhập lại",
        };
      }
      if (isNaN(Number(dien_thoai)) || dien_thoai.length < 9) {
        throw {
          status: 400,
          thong_bao: "Điện thoại phải là số và phải hơn 9 ký tự",
        };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(mat_khau, salt);
      const token = crypto.randomBytes(32).toString("hex"); // tạo ra 32 ngẫu nhiên an toàn chuyển thành chuỗi hex hệ 16
      const tokenHetHan = new Date(now.getTime() + 15 * 60 * 1000);
      await User.create({
        tai_khoan,
        email,
        mat_khau: hashedPassword,
        dien_thoai,
        token: token,
        token_expire: tokenHetHan,
      });
      const verifyLink = `${process.env.SERVER}/xac-thuc-dang-ky?email=${email}&token=${token}`;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER || "baodbrr@gmail.com",
          pass: process.env.MAIL_PASS || "zxcs cxcv dsfd edsf",
        },
        tls: { rejectUnauthorized: false },
      });
      const noidungthu = taoTrangPhanHoiDangKyHtml(tai_khoan, verifyLink);
      const mailOption: mailOptions = {
        from: `"Thương mại điện tử KADU" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Thư xác định tài khoản của  tmdt  KADU",
        html: noidungthu,
      };
      try {
        await transporter.sendMail(mailOption);
      } catch (error) {
        console.warn("gửi mail lỗi", error);
        throw { status: 500, thong_bao: `Gửi mail thất bại` };
      }
      return res.status(200).json({
        thong_bao: "Đã đăng ký thành công tài khoản vui long xac thục qua mail",
        success: true,
      });
    } catch (error) {
      const err = error as CustomError;
      // console.log(err.message);
      const status = err.status || 500;
      const thong_bao = err.thong_bao || "Lỗi máy chử khi xử lý đăng ký";
      res.status(status).json({ thong_bao, success: false });
    }
  }
);
router.get(
  "/xac-thuc-dang-ky",
  async (req: Request<{}, {}, {}, XacThucDangKy>, res: Response) => {
    try {
      const { email, token } = req.query;
      if (!email || !token) {
        const html = taoTrangPhanHoiHtml(
          "Xác thực  thất  bại",
          "Đường dẫn không hợp lệ. Thiếu token hoặc email.",
          `${process.env.BASE_URL || "link vip không che"}`,
          "Quay lại trang chủ"
        );
        return res.status(400).send(html);
      }

      const user = await User.findOne({
        where: {
          email,
          token: token,
          provider: AUTH_PROVIDER.LOCAL,
          token_expire: {
            [Op.gt]: new Date(),
          }, //lấy lớn hơn ngày giờ hiện tại
        },
      });
      if (!user) {
        const html = taoTrangPhanHoiHtml(
          "Xác  thực thông báo",
          "Liên kết xác thực không hợp lệ hoặc hết hạn. Vui lòng thử đăng ký lại.",
          `${process.env.BASE_URL || "phimkhongche.com"}`,
          "Quay lại trang chủ"
        );
        return res.status(200).send(html);
      }
      user.xac_thuc_email_luc = new Date();
      user.token = null;
      await user.save();
      const succesMessage = `Xin chào <strong>${user.tai_khoan}</strong>, bạn đã kích hoạt tài khoản KADU Shop thành công. Hãy đăng nhập để bắt đầu trải nghiệm mua sắm tuyệt vời!`;
      const html = taoTrangPhanHoiHtml(
        "Xác thực thành công",
        succesMessage,
        `${process.env.LOGIN_URL || "phimkhongche.com"}`,
        "Đăng  nhập ngay"
      );
      return res.status(200).send(html);
    } catch (error) {
      const err = error as CustomError;
      // console.log(err.message);
      const html = taoTrangPhanHoiHtml(
        "Xác thực không thành công",
        "Lỗi máy chủ khi xác thực. Vui lòng thử lại sau.",
        `${process.env.BASE_URL || "phimkhongche.com"}`,
        "Quay lại trang chủ"
      );
      return res.status(500).send(html);
    }
  }
);
router.post(
  "/api/gui-lai-xac-thuc-dk",
  resendLimiter,
  async (req: Request<{}, {}, GuiLaiXacThucDKBody>, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        throw { status: 400, thong_bao: "Vui lòng nhập email" };
      }
      const user = await User.findOne({
        where: { [Op.or]: [{ tai_khoan: email }, { email: email }] },
      });
      if (!user) {
        throw {
          status: 404,
          thong_bao: "Nếu email này tồn tại, một thư xác thực sẽ được gửi",
        }; //tránh bị dò email
      }
      if (user.xac_thuc_email_luc) {
        throw {
          status: 400,
          thong_bao: "Tài khoản này đã đc xác thực từ trước",
        };
      }
      const token = crypto.randomBytes(32).toString("hex");

      const tokenHetHan = new Date(now.getTime() + 15 * 60 * 1000);
      // console.log(tokenHetHan);
      // console.log(new Date());
      user.token = token;
      user.token_expire = tokenHetHan;
      await user.save();
      const verifyLink = `${process.env.SERVER}/xac-thuc-dang-ky?email=${user.email}&token=${token}`;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER || "baodbrr@gmail.com",
          pass: process.env.MAIL_PASS || "zxcs cxcv dsfd edsf",
        },
        tls: { rejectUnauthorized: false },
      });
      const noidungthu = taoTrangPhanHoiDangKyHtml(user.tai_khoan, verifyLink);
      const mailOption: mailOptions = {
        from: `"Thương mại điện tử KADU" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: "Thư xác định tài khoản của  tmdt  KADU",
        html: noidungthu,
      };
      try {
        await transporter.sendMail(mailOption);
      } catch (error) {
        console.warn("gửi mail lỗi", error);
        throw { status: 500, thong_bao: `Gửi mail thất bại` };
      }
      return res.status(200).json({
        thong_bao: "Đã gửi lại thư xác thực, vui lòng kiểm tra email của bạn",
        success: true,
      });
    } catch (error) {
      const err = error as CustomError;
      const status = err.status || 500;
      const thong_bao =
        err.thong_bao || "Lỗi trong qua trình gửi lại mã xác thực đăng ký";
      return res.status(status).json({ thong_bao });
    }
  }
);
router.post(
  "/api/quen-pass",
  resendLimiter,
  async (req: Request<{}, {}, GuiLaiXacThucDKBody>, res: Response) => {
    try {
      const { email } = req.body;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw { status: 400, thong_bao: "Email chưa đúng định dạng" };
      }
      const user = await User.findOne({
        where: { email },
      });
      if (!user) {
        console.warn("Email không tồn tại");
        return res.status(200).json({
          thong_bao:
            "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc đổi mật khẩu",
        });
      }
      if (user.provider !== AUTH_PROVIDER.LOCAL || !user.mat_khau) {
        console.warn(
          "Không thể đổi  mật khẩu trong cục bộ vì tài khoản đã đăng ký bằng gmail hoặc google"
        );
        return res.status(200).json({ thong_bao: "Đã gửi mã OTP vào gmail" });
      }
      const now = new Date();
      if (!user.xac_thuc_email_luc || user.xac_thuc_email_luc > now) {
        console.warn("Email chưa được xác thực hoặc thời hạn không chính xác");
        return res.status(200).json({
          thong_bao:
            "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc đổi mật khẩu",
        });
      }
      const otp = crypto.randomInt(100000, 1000000).toString(); //min là 100000 và max là 999999
      user.otp = otp;

      user.otp_expire = new Date(now.getTime() + 5 * 60 * 1000);
      await user.save();
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        tls: { rejectUnauthorized: true },
      });
      const noidungthu = taoTrangPhanHoiQuenPass(user.tai_khoan, otp);
      const mailOptions: mailOptions = {
        from: `"Thương mại điện tử KADU" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: "Mã OTP khôi phục mật khẩu",
        html: noidungthu,
      };
      try {
        await transporter.sendMail(mailOptions);
      } catch (error) {
        console.warn("gửi mail lỗi", error);
        throw { status: 500, thong_bao: `Có lỗi trong quá trình gửi mail` };
      }
      const encryptedEmail = encrypt(user.email);
      res.cookie("_usrE", encryptedEmail, {
        httpOnly: true,
        secure: false,
        path: "/",
        maxAge: 6 * 60 * 1000,
      });
      return res.status(200).json({
        thong_bao:
          "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc đổi mật khẩu",
        success: true,
      });
    } catch (error) {
      const err = error as CustomError;
      // console.log(err.message);
      const status = err.status || 500;
      const thong_bao = err.thong_bao || "Lỗi máy chủ khi thực hiện đổi pass";
      return res.status(status).json({ thong_bao, success: false });
    }
  }
);

router.post(
  "/api/xac-thuc-otp-doi-pass",
  async (req: Request<{}, {}, QuenMatKhauBody>, res: Response) => {
    try {
      const encryptEmail = req.cookies._usrE as string;
      const { otp, mat_khau_moi, mat_khau_nhap_lai } = req.body;
      if (!mat_khau_moi || !mat_khau_nhap_lai || !otp) {
        throw { status: 400, thong_bao: "Bạn chưa nhập đủ thông tin" };
      }
      if (!encryptEmail) {
        throw { status: 404, thong_bao: "Phiên làm việc đã hết hạn" };
      }
      let email: string;
      try {
        email = decrypt(encryptEmail);
      } catch (error) {
        throw {
          status: 400,
          thong_bao: "Phiên làm việc không hợp lệ hoặc đã bị sửa đổi",
        };
      }

      if (!email) {
        throw {
          status: 404,
          thong_bao: "Không thể xác định người dùng từ phiên làm việc",
        };
      }
      if (!/^\d{6}$/.test(otp)) {
        throw { status: 400, thong_bao: "Mã OTP phải gồm 6 chữ số" };
      }
      const hasUpperCase = /[A-Z]/;
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
      if (
        mat_khau_moi.length < 8 ||
        !hasUpperCase.test(mat_khau_moi) ||
        !hasSpecialChar.test(mat_khau_moi)
      ) {
        throw {
          status: 400,
          thong_bao:
            "Mật khẩu phải trên 8 ký tự, có 1 chữ in hoa, 1 ký tự đặc biệt",
        };
      }
      if (mat_khau_moi != mat_khau_nhap_lai) {
        throw {
          status: 400,
          thong_bao: "Mật khẩu không trùng mật khẩu nhập lại",
        };
      }
      const user = await User.findOne({
        where: { email, provider: AUTH_PROVIDER.LOCAL },
      });
      if (!user) {
        throw { status: 404, thong_bao: "Thông tin xác thực không chính xác" };
      }
      //kiểm tra thời hạn trươc khi  xem  nó có đúng không
      const now = new Date();
      if (!user.otp_expire || user.otp_expire < now) {
        throw {
          status: 400,
          thong_bao:
            "OTP đã hết hạn vui lòng gửi lại mã otp để tiến hành đổi mật khẩu",
        };
      }
      if (user.otp !== otp) {
        throw {
          status: 404,
          thong_bao: "OTP không đúng vui lòng kiểm tra lại",
        };
      }
      if (!user.mat_khau) {
        throw {
          status: 403,
          thong_bao:
            "Tài khoản này không thể thay đổi mật khẩu bằng phương thức cục bộ",
        };
      }
      const isMatch = await bcrypt.compare(mat_khau_moi, user.mat_khau);
      if (isMatch) {
        throw {
          status: 400,
          thong_bao: "Mật khẩu mới không được trùng với mật khẩu cũ",
        };
      }
      const salt = await bcrypt.genSalt(10);
      user.mat_khau = await bcrypt.hash(mat_khau_moi, salt);
      user.otp = null;
      user.otp_expire = null;
      user.token_version = user.token_version + 1;
      await user.save();
      res.clearCookie("_usrE", {
        httpOnly: true,
        secure: false,
        path: "/",
      });
      return res
        .status(200)
        .json({ thong_bao: "Đổi mật khẩu thành công", success: true });
    } catch (error) {
      const err = error as CustomError;
      // console.log(err.message);
      const status = err.status || 500;
      const thong_bao = err.thong_bao || "Lỗi máy chủ khi thực hiện đổi pass";
      return res.status(status).json({ thong_bao, success: false });
    }
  }
);
router.post(
  "/api/doi-pass",
  checkAuth,
  async (req: Request<{}, {}, DoiMatKhauBody>, res: Response) => {
    try {
      const userPayload = req.user as AuthUser;
      const { id, tai_khoan } = userPayload;
      const { mat_khau_cu, mat_khau_moi, mat_khau_nhap_lai } = req.body;
      if (!mat_khau_cu || !mat_khau_moi || !mat_khau_nhap_lai) {
        throw { status: 400, thong_bao: "Vui lòng nhập đủ thông tin" };
      }
      const hasUpperCase = /[A-Z]/;
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
      if (
        !hasSpecialChar.test(mat_khau_moi) ||
        !hasUpperCase.test(mat_khau_moi) ||
        mat_khau_moi.length < 8
      ) {
        throw {
          status: 400,
          thong_bao:
            "Mật khẩu mới tối thiểu 8 ký tự và mật khẩu phải có 1 ký tự đặc biệt, 1 chữ Hoa",
        };
      }
      if (mat_khau_cu == mat_khau_moi) {
        throw {
          status: 400,
          thong_bao: "Mật khẩu mới không được trùng mật khẩu cũ",
        };
      }
      if (mat_khau_moi !== mat_khau_nhap_lai) {
        throw {
          status: 400,
          thong_bao: "Mật khẩu nhập lại không khớp mật khẩu mới",
        };
      }
      const user = await User.findOne({
        where: { id, provider: AUTH_PROVIDER.LOCAL },
      });
      if (!user || user.tai_khoan !== tai_khoan) {
        throw {
          status: 404,
          thong_bao: "Tài khoản không tồn tại hoặc ko đúng",
        };
      }
      if (!user.mat_khau) {
        throw {
          status: 403,
          thong_bao:
            "Tài khoản này không thể thay đổi mật khẩu bằng phương thức cục bộ",
        };
      }
      const isMatch = await bcrypt.compare(mat_khau_cu, user.mat_khau);
      if (!isMatch) {
        throw {
          status: 401,
          thong_bao: "Mật khẩu cũ không đúng vui lòng kiểm tra lại",
        };
      }
      const salt = await bcrypt.genSalt(10);
      user.mat_khau = await bcrypt.hash(mat_khau_moi, salt);
      user.token_version = user.token_version + 1;

      const newTokenPayload: CustomJwtPayload = {
        id: user.id,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        ho_ten: user.ho_ten,
        token_version: user.token_version,
      };
      const RefreshPayload: RefreshJwtPayload = {
        id: user.id,
        token_version: user.token_version,
      };
      const newToken = jwt.sign(
        newTokenPayload,
        process.env.JWT_SECRET || "co-cai-nit",
        { expiresIn: jwtExpiresIn }
      );
      const refreshToken = jwt.sign(
        RefreshPayload,
        process.env.REFRESH_JWT_SECRET || "your-secret-pass-refresh",
        { expiresIn: refreshJwtExpiresIn } //7 ngay
      );
      const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
      user.refresh_token = hashedRefreshToken; //luuw ma hoa token de du lo db thi ko lo token ra ngoai
      await user.save();
      res.cookie("_rtkn", refreshToken, {
        httpOnly: true,
        secure: false, //deploy thatja thi mo len
        path: "/",
        sameSite: "strict",
        maxAge: cookieMaxAgeRefresh,
      });
      res.cookie("_atkn", newToken, {
        httpOnly: true,
        secure: true,
        path: "/",
        sameSite: "strict",
        maxAge: cookieMaxAge,
      });
      return res
        .status(200)
        .json({ thong_bao: "Đổi mật khẩu thành công", success: true });
    } catch (error) {
      const err = error as CustomError;
      const status = err.status || 500;
      const thong_bao = err.thong_bao || "Lỗi máy chủ khi đổi mật khẩu";
      return res.status(status).json({ thong_bao, success: false });
    }
  }
);
router.post(
  "/api/dang-nhap-nhanh",
  resendLimiter,
  async (req: Request<{}, {}, GuiLaiXacThucDKBody>, res: Response) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({
        where: { email },
      });
      if (!email) {
        throw { status: 400, thong_bao: "Bạn chưa nhập email" };
      }
      if (!user) {
        console.warn("gửi mail thất bại");
        return res.status(200).json({
          thong_bao:
            "Đã gửi link xác thực qua mail vui lòng kiểm tra mail để đăng nhập",
        });
      }
      const now = new Date();
      if (!user.xac_thuc_email_luc || user.xac_thuc_email_luc > now) {
        throw {
          status: 423,
          thong_bao:
            "Bạn cần phải xác thực  tài khoản qua mail để được sử dụng chức năng này",
        };
      }
      if (user.khoa === 1) {
        throw {
          status: 423,
          thong_bao:
            "Tài khoản đã bị khóa vui lòng liên hệ với ban quản trị viên để được hỗ trợ",
        };
      }
      if (user.locked_until && user.locked_until > now) {
        throw {
          status: 423,
          thong_bao:
            "Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần vui lòng thử lại sau ít phút",
        };
      }

      const token = crypto.randomBytes(32).toString("hex");
      const tokenHetHan = new Date(now.getTime() + 15 * 60 * 1000);
      user.token = token;
      user.token_expire = tokenHetHan;
      await user.save();
      const magicLink = `${process.env.SERVER}/api/xac-thuc-dang-nhap-nhanh?email=${email}&token=${token}`;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER || "baodbrr@gmail.com",
          pass: process.env.MAIL_PASS || "zxcs cxcv dsfd edsf",
        },
        tls: { rejectUnauthorized: false },
      });
      const noidungthu = taoTrangDangNhapNhanh(user.tai_khoan, magicLink);
      const mailOption: mailOptions = {
        from: `"Thương mại điện tử KADU" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Thư đăng nhập nhanh của tmdt KADU",
        html: noidungthu,
      };
      try {
        await transporter.sendMail(mailOption);
      } catch (error) {
        console.warn("Gửi mail lỗi", error);
        throw { status: 500, thong_bao: "Gửi mail thất bại" };
      }
      return res.status(200).json({
        thong_bao:
          "Đã gửi link xác thực qua mail vui lòng kiểm tra mail để đăng nhập",
        success: true,
      });
    } catch (error) {
      const err = error as CustomError;
      const status = err.status || 500;
      const thong_bao =
        err.thong_bao || "Lỗi máy chủ khi thực hiện đăng nhập nhanh";
      return res.status(status).json({ thong_bao, success: false });
    }
  }
);
router.get(
  "/api/xac-thuc-dang-nhap-nhanh",
  async (req: Request<{}, {}, {}, XacThucDangKy>, res: Response) => {
    try {
      const { email, token } = req.query;
      if (!email || !token) {
        throw { status: 400, thong_bao: "Thiếu token hoặc email xác thực" };
      }

      const user = await User.findOne({
        where: {
          email,
          token: token,
          token_expire: {
            [Op.gt]: new Date(),
          },
        },
      });
      if (!user) {
        throw {
          status: 404,
          thong_bao:
            "Liên kết đăng nhập không hợp lê hoặc đã  hết hạn, vui lòng thử lại",
        };
      }
      user.token = null;
      user.token_expire = null;
      user.login_failed_count = 0;
      user.locked_until = null;

      const TokenPayLoad: CustomJwtPayload = {
        id: user.id,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        ho_ten: user.ho_ten,
        token_version: user.token_version,
      };
      const RefreshPayload: RefreshJwtPayload = {
        id: user.id,
        token_version: user.token_version,
      };
      // const  safeUserData: SafeUserData = {
      // 	ho_ten: user.ho_ten, tai_khoan: user.tai_khoan, vai_tro: user.vai_tro, email: user.email
      // }
      const jwtToken = jwt.sign(
        TokenPayLoad,
        process.env.JWT_SECRET || "có cái nịt",
        { expiresIn: jwtExpiresIn }
      );
      const jwtRefreshToken = jwt.sign(
        RefreshPayload,
        process.env.REFRESH_JWT_SECRET || "your-secret-pass-refresh",
        { expiresIn: refreshJwtExpiresIn } //7 ngay
      );
      const salt = await bcrypt.genSalt(10);
      const hashedRefreshToken = await bcrypt.hash(jwtRefreshToken, salt);
      user.refresh_token = hashedRefreshToken; //luuw ma hoa token de du lo db thi ko lo token ra ngoai
      await user.save();
      res.cookie("_rtkn", jwtRefreshToken, {
        httpOnly: true,
        secure: false, //deploy thatja thi mo len
        path: "/",
        sameSite: "strict",
        maxAge: cookieMaxAgeRefresh,
      });
      res.cookie("_atkn", jwtToken, {
        httpOnly: true,
        secure: true,
        path: "/",
        sameSite: "strict",
        maxAge: cookieMaxAge,
      });
      return res.redirect(HOME_URL);
    } catch (error) {
      const err = error as CustomError;
      const status = err.status || 500;
      const thong_bao =
        err.thong_bao || "Lỗi máy chủ khi  xác thực đăng nhập nhanh";
      const html = taoTrangPhanHoiHtml(
        "Đăng nhập thất bại",
        thong_bao,
        LOGIN_URL,
        "Quay lại đăng nhập"
      );
      return res.status(status).send(html);
    }
  }
);
//thêm 1 api phụ để dùng cho đăng nhập nhanh
//nghĩa là fe lúc chạy qua trang trang chủ nếu có cookie thì sẽ get api/me
router.get(
  "/api/auth/profile",
  checkAuth,
  async (req: Request, res: Response) => {
    try {
      const userPayload = req.user as AuthUser;
      const { id } = userPayload;
      const user = await User.findOne({
        where: { id },
      });
      if (!user) {
        throw { status: 404, thong_bao: "Không tìm thấy người dùng" };
      }
      const safeUserData: SafeUserData = {
        ho_ten: user.ho_ten,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        email: user.email,
      };
      return res.status(200).json({
        user: safeUserData,
        success: true,
        thong_bao: "Đã  lấy thông tin thành công",
      });
    } catch (error) {
      const err = error as CustomError;
      const status = err.status || 500;
      const thong_bao =
        err.thong_bao || "Lỗi mấy chủ khi lấy thông tin người dùng";
      return res.status(status).json({ thong_bao, success: false });
    }
  }
);
router.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/api/auth/google/callback",
  handleGoogleAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const TokenPayLoad: CustomJwtPayload = {
        id: user.id,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        ho_ten: user.ho_ten,
        token_version: user.token_version,
      };
      const RefreshPayload: RefreshJwtPayload = {
        id: user.id,
        token_version: user.token_version,
      };
      const safeUserData: SafeUserData = {
        ho_ten: user.ho_ten,
        tai_khoan: user.tai_khoan,
        email: user.email,
        vai_tro: user.vai_tro,
      };
      const token = jwt.sign(
        TokenPayLoad,
        process.env.JWT_SECRET || "your secret pass",
        { expiresIn: jwtExpiresIn }
      );
      const refreshToken = jwt.sign(
        RefreshPayload,
        process.env.REFRESH_JWT_SECRET || "your-secret-pass-refresh",
        { expiresIn: refreshJwtExpiresIn } //7 ngay
      );
      const salt = await bcrypt.genSalt(10);
      const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
      user.refresh_token = hashedRefreshToken; //luuw ma hoa token de du lo db thi ko lo token ra ngoai
      await user.save();
      res.cookie("_rtkn", refreshToken, {
        httpOnly: true,
        secure: false, //deploy thatja thi mo len
        path: "/",
        sameSite: "strict",
        maxAge: cookieMaxAgeRefresh,
      });
      res.cookie("_atkn", token, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict", //tranhs bi tan cong csrf khi nguoi dung link vao moot trang web khac no se gui rq keu chuyen tieen roi dung chinh cais acces do de xac thuc nen suy ra bi mat tien
        maxAge: cookieMaxAge,
      });
      const dataToSend: dataToSendLogin = {
        user: safeUserData,
        success: true,
        source: "google-auth", //nhận diện dùm cái
      };
      const html = taoTrangPopupPortMessage(HOME_URL, dataToSend);
      return res.status(200).send(html); //gửi dữ liệu làm trên client
      //dữ liệu test trên post man
      // return res.status(200).json({
      // 	thong_bao: "Đăng nhập thành công",
      // 	token,
      // 	user: safeUserData,
      // 	success: true
      // })
    } catch (err) {
      const error = err as CustomError;
      console.warn(error.message);
      const dataToSend: dataToSendLogin = {
        thong_bao: "Lỗi tạo phiên đăng nhập",
        success: false,
        source: "google-auth",
      };
      const html = taoTrangPopupPortMessage(HOME_URL, dataToSend);
      return res.status(500).send(html);
      // res.status(500).json({thong_bao:"Lỗi tạo phiên đăng nhập", success: false})
    }
  }
);
router.get(
  "/api/auth/facebook",
  passport.authenticate("facebook", { scope: ["email", "public_profile"] })
);
router.get(
  "/api/auth/facebook/callback",
  handleFacebookAuth,
  (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const TokenPayLoad: CustomJwtPayload = {
        id: user.id,
        tai_khoan: user.tai_khoan,
        vai_tro: user.vai_tro,
        ho_ten: user.ho_ten,
        token_version: user.token_version,
      };
      const safeUserData: SafeUserData = {
        ho_ten: user.ho_ten,
        tai_khoan: user.tai_khoan,
        email: user.email,
        vai_tro: user.vai_tro,
      };
      const token = jwt.sign(
        TokenPayLoad,
        process.env.JWT_SECRET || "your_secter-pass",
        { expiresIn: jwtExpiresIn }
      );
      res.cookie("_atkn", token, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
        maxAge: cookieMaxAge,
      });
      const dataToSend: dataToSendLogin = {
        user: safeUserData,
        success: true,
        source: "facebook-auth",
      };
      // return res.status(200).json({
      // 	thong_bao: "Đăng nhập thành công",
      // 	token,
      // 	user: safeUserData,
      // 	success: true
      // })
      const html = taoTrangPopupPortMessage(HOME_URL, dataToSend);
      return res.status(200).send(html);
    } catch (error) {
      const err = error as CustomError;
      console.log(err.message);
      const dataToSend: dataToSendLogin = {
        thong_bao: "Lỗi tạo phiên đăng nhập",
        success: false,
        source: "google-auth",
      };
      const html = taoTrangPopupPortMessage(HOME_URL, dataToSend);
      return res.status(500).send(html);
      // res.status(500).json({thong_bao:"Lỗi tạo phiên đăng nhập", success: false})
    }
  }
);
router.post("/api/refresh-token", async (req: Request, res: Response) => {
  const refreshTokenBody = req.cookies._rtkn;
  if (!refreshTokenBody) {
    return res
      .status(401)
      .json({ thong_bao: "Không có refresh token", success: false });
  }
  try {
    const payload = jwt.verify(
      refreshTokenBody,
      process.env.REFRESH_JWT_SECRET || "secret-refresh-token"
    ) as RefreshJwtPayload;
    const { id, token_version } = payload;
    const user = await User.findByPk(id);
    if (!user) {
      throw { status: 401, thong_bao: "người dùng không tồn tại" };
    }
    if (user.token_version !== token_version) {
      throw {
        status: 401,
        thong_bao: "Refresh token đã hết hạn hoặc bị thu hồi",
      };
    }
    if (user.khoa === 1) {
      throw { status: 423, thong_bao: "Tài khoán đã bị khóa" };
    }
    if (!user.refresh_token) {
      throw {
        status: 401,
        thong_bao: "Không thể xác thực do user chưa có refresh token",
      };
    }
    const match = await bcrypt.compare(refreshTokenBody, user.refresh_token);
    //cập nhập token mới
    if (!match) throw { status: 401, thong_bao: "Refresh token không hợp lệ" };
    const TokenPayLoad: CustomJwtPayload = {
      id: user.id,
      tai_khoan: user.tai_khoan,
      vai_tro: user.vai_tro,
      token_version: user.token_version,
      ho_ten: user.ho_ten,
    };
    const refreshToken: RefreshJwtPayload = {
      id: user.id,
      token_version: user.token_version,
    };
    const token = jwt.sign(
      TokenPayLoad,
      process.env.JWT_SECRET || "tour_secret_key",
      { expiresIn: jwtExpiresIn }
    );
    const token_refresh = jwt.sign(
      refreshToken,
      process.env.REFRESH_JWT_SECRET || "refresh_secret_key",
      { expiresIn: refreshJwtExpiresIn }
    );
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(token_refresh, salt);
    user.refresh_token = hashedRefreshToken;
    await user.save();
    res.cookie("_atkn", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: cookieMaxAge,
    });
    res.cookie("_rtkn", token_refresh, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: cookieMaxAgeRefresh,
    });
    const safeUserData: SafeUserData = {
      ho_ten: user.ho_ten,
      tai_khoan: user.tai_khoan,
      vai_tro: user.vai_tro,
      email: user.email,
    };

    return res.status(200).json({
      thong_bao: "lấy token AT thành công",
      token,
      user: safeUserData,
      success: true,
    });
  } catch (error) {
    const err = error as CustomError;
    const status = err.status || 401;
    const thong_bao =
      err.thong_bao || "Refresh token không hợp lệ hoặc đã  hết hạn";
    // console.error("Lỗi JWT trong adminAuth:", err);
    return res.status(status).json({ thong_bao, success: false });
  }
});

export default router;
//success
