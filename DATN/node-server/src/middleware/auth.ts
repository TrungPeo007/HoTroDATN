import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { ADMIN_ROLE_ID } from "../config/explain";
import { CustomJwtPayload, dataToSendLogin, InfoAuth } from "../types/auth";
import { User } from "../models";
import passport from "passport";
import { taoTrangPopupPortMessage } from "../ultis/htmlhelps";
interface CustomError {
  status?: number; //dùng ? vì có khi dữ lieuj lỗi tra về ko có status
  thong_bao?: string;
  message?: string;
}
const refeshJwtExpiresIn = "7d";
const jwtExpiresIn = "15m";
const cookieMaxAgeRefresh = 7 * 24 * 60 * 60 * 1000;
const cookieMaxAge = 15 * 60 * 1000;
const HOME_URL = process.env.BASE_URL || "http://phimsẽgay.com";
export const adminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies._atkn as string | undefined; //nêu ben kai đổi tên thì ở đay cũng đổi
  if (!token)
    return res
      .status(401)
      .json({
        thong_bao: "Không tìm thấy Token xác thực. Vui lòng đăng nhập lại.",
      });
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "co_cai_nit"
    ) as CustomJwtPayload;
    const { id, vai_tro, token_version } = payload;
    const user = await User.findByPk(id, {
      attributes: ["id", "tai_khoan", "vai_tro", "ho_ten", "token_version"],
    });
    if (!user) {
      return res
        .status(404)
        .json({ thong_bao: "Người dùng không tồn tại hoặc đã bị xóa." });
    }
    if (user.token_version !== token_version) {
      return res
        .status(401)
        .json({
          thong_bao: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
        });
    }
    if (vai_tro !== ADMIN_ROLE_ID) {
      return res
        .status(403)
        .json({ thong_bao: "Bạn không có quyền truy cập quản trị viên." });
    }
    req.user = user.toJSON();
    next();
  } catch (err) {
    console.error("Lỗi JWT trong adminAuth:", err);
    return res
      .status(401)
      .json({ thong_bao: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
// check người dung để đổi mk nhá cu
//nhiệm vự  của thằng này chỉ là soát vé thôi ko nên làm in thêm vé để tránh bị lỗi sau này nó sẽ bị race condition
export const checkAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies._atkn as string | undefined;

  if (!token) return res.status(401).json({ thong_bao: "Không có Token" });
  try {
    //ép kiểu
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "co_cai_nit"
    ) as CustomJwtPayload;
    // console.log(payload);
    const { id, token_version } = payload;
    const user = await User.findByPk(id, {
      attributes: ["id", "tai_khoan", "vai_tro", "ho_ten", "token_version"],
    });
    if (!user) {
      return res
        .status(401)
        .json({ thong_bao: "Người dùng không tồn tại hoặc đã bị xóa." });
    }
    if (user.token_version !== token_version) {
      return res
        .status(401)
        .json({
          thong_bao: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
        });
    }
    req.user = user.toJSON();
    next();
  } catch (err) {
    // console.error("Lỗi JWT trong adminAuth:", err);
    return res
      .status(401)
      .json({ thong_bao: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
//không đổi thành hàm tham sô đc do nếu làm vậy lúc bắt catch phải truyền tham số và  tạo coookie
// export const refreshAccessTokenCore = async(req: Request, res: Response): Promise<RefreshResult>=>{
//
// }
export const handleGoogleAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //hàm logic đc bọc trong 1 middlewware thì phải gọi lại req,res next do nó trả về 1 middwarae
  passport.authenticate(
    "google", //khi xử dụng hàm get cho clent ko nên trả về dữ liệ json
    {
      session: false,
      // failureRedirect: '/dang-nhap'//khong cần thiết vì là dạng popup
    },
    (err: CustomError, user: User | false, info: InfoAuth) => {
      if (err) {
        const dataToSend: dataToSendLogin = {
          thong_bao: "Lỗi máy  chủ",
          success: false,
          source: "google-auth",
        };
        const html = taoTrangPopupPortMessage(HOME_URL, dataToSend);
        return res.status(500).send(html);
        // return res.status(info.status || 500).json({thong_bao: info.thong_bao || "Lỗi máy chủ"});
      }
      //nếu ko có user trả về thì đưa vào cái này
      if (!user) {
        const dataToSend: dataToSendLogin = {
          thong_bao: info.thong_bao || "Xác thực thất bại",
          success: false,
          source: "google-auth",
        };
        const html = taoTrangPopupPortMessage(HOME_URL, dataToSend);
        return res.status(info.status || 401).send(html);
        // return res.status(info.status || 401).json({
        //     thong_bao: info.thong_bao || "Xác thực thất bại"
        // });
      }
      req.user = user;
      next();
    }
  )(req, res, next);
};
export const handleFacebookAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "facebook",
    {
      session: false,
    },
    (err: CustomError, user: User, info: InfoAuth) => {
      if (err) {
        //nếu err có lỗi nó bỏ qua user với info luôn nên chỗ này truyền info là ?  để coi nos có thể là unđifine
        // console.log(err.message);
        const dataToSend: dataToSendLogin = {
          thong_bao: "lỗi máy chủ",
          success: false,
          source: "facebook-auth",
        };
        const html = taoTrangPopupPortMessage(HOME_URL, dataToSend);
        return res.status(500).send(html);
        // return res.status(info?.status || 500).json({thong_bao: info?.thong_bao || "Lỗi máy chủ"});
      }
      if (!user) {
        const dataToSend: dataToSendLogin = {
          thong_bao: info.thong_bao || "Xác thực thất bại",
          success: false,
          source: "facebook-auth",
        };
        const html = taoTrangPopupPortMessage(HOME_URL, dataToSend);
        return res.status(info.status || 401).send(html);
        // return res.status(info.status || 401).json({
        //         thong_bao: info.thong_bao || "Xác thực thất bại"
        //     });
      }
      req.user = user;
      next();
    }
  )(req, res, next);
};
// ex
