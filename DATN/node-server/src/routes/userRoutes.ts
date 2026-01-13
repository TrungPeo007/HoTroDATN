import express, { Request, Response } from 'express';
import { AllowedUpdateUser, CreateUser, GetAllUser, UpdateUser, UserHinh, UserParams } from '../types/user';
import {User} from '../models';

import fs from 'fs';
import bcrypt from 'bcryptjs';
import { uploadMiddleware } from '../middleware/upload';
import { Op } from 'sequelize';
import { covertWebPathToAbsolutePath, processFilePath } from '../ultis/pathprocess';
import { ROLE_MAP } from '../config/explain';
import { normalizeBoolean } from '../ultis/validate';
const router = express.Router();
interface CustomError {
	status?: number;//dùng ? vì có khi dữ lieuj lỗi tra về ko có status
	thong_bao?: string;
	message?: string;

}
type MulterFieldFiles = {[fieldname: string]: Express.Multer.File[]};
router.get('/',async(req: Request<{}, {}, {}, GetAllUser>, res: Response)=>{
    try {
        const  page = req.query.page > 0  ? req.query.page : 1;
        const limit = req.query.limit > 0 ? req.query.limit : 10;
        const offset = (page -1) * limit;
        const  {rows, count} = await User.findAndCountAll({
            limit: limit,
            offset: offset,
            attributes: ['id','tai_khoan','email','mat_khau','ho_ten','ten_shop','vai_tro','hinh','provider','provider_id','khoa','dien_thoai','login_failed_count','last_login_fail','is_shop','createdAt'],
            order: [['createdAt','DESC']]
        });
        const totalPages = Math.ceil(count / limit);
        const result = {
            data: rows,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItem: count,
                totalPages: totalPages
            }
        }
        return res.status(200).json({result});
    } catch (error) {
        return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy danh sách người dùng"});
    }
})
router.post('/',uploadMiddleware,async(req: Request<{}, {}, CreateUser>,res: Response)=>{
    let fileToClean: string[] = [];
    const cleanUpfiles = async()=>{
        await Promise.all(
            fileToClean.map((filePath)=>{
                return fs.promises.unlink(filePath).catch((error)=>{
                    console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);
                    return Promise.resolve();
                });
            })
        );
    };

    try {
        const {tai_khoan, email, mat_khau, mat_khau_nhap_lai, ho_ten, vai_tro} = req.body;
        const files = req.files as  MulterFieldFiles;
        const newHinh = files?.['hinh_user']?.[0]?.path;
        if(newHinh) fileToClean.push(newHinh);

        const taiKhoanTrim = tai_khoan.trim();
        const emailTrim = email.trim();
        const hoTenTrim = ho_ten.trim();
        if(!taiKhoanTrim || !emailTrim || !mat_khau || !mat_khau_nhap_lai || !hoTenTrim){
            throw {status: 400, thong_bao: "Bạn chưa nhập đủ thông tin"};
        }
        if(vai_tro=== undefined  || vai_tro === null){
            throw {status: 400, thong_bao: "Bạn chưa chọn vai trò"};
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(emailTrim)){
            throw {status: 400, thong_bao: "Email chưa đúng định dạng"};
        }
        const hasUpperCase = /[A-Z]/;
	    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
        if(mat_khau.length < 8 || !hasUpperCase.test(mat_khau) || !hasSpecialChar.test(mat_khau)){
            throw {status: 400, thong_bao: "Mật khẩu phải trên 8 ký tự, có 1 chữ in hoa, 1 ký tự đặc biệt"}
        };
        if(mat_khau != mat_khau_nhap_lai){
            throw {status: 400, thong_bao: "Mật khẩu không trùng mật khẩu nhập lại"};
        }
        if(hoTenTrim.length < 8 ){
            throw {status: 400, thong_bao: "Họ và tên phải lớn hơn 8 ký tự"}
        }
        const allowedRole  = [0,1];//0 là người dung bình thường 1 là amin
        if(!allowedRole.includes(Number(vai_tro))){
            throw {status: 400, thong_bao: "Vai trò không hợp lệ"};
        }
        const existing  = await User.findOne({
            where: {[Op.or]: [{tai_khoan: taiKhoanTrim}, {email: emailTrim}]}
        });
        if(existing){
            if(existing.tai_khoan === taiKhoanTrim){
                throw {status: 409, thong_bao: "Tài khoản đã tồn tại, vui lòng Nhập tài khoản khác nhá"};
            }
            if(existing.email === emailTrim){
                throw {status: 409, thong_bao: "Email đã tồn tại, vui lòng nhập email khác"};
            }
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(mat_khau, salt);
        const hinhPath = newHinh ? processFilePath(newHinh) : null;
        const newUser = await User.create({
            tai_khoan: taiKhoanTrim,
            email: emailTrim,
            mat_khau: hashedPassword,
            ho_ten: hoTenTrim,
            xac_thuc_email_luc: new Date(),
            hinh: hinhPath,
            vai_tro
        });
        //thanh cong trả magnr rỗng
        fileToClean = [];
        const role = ROLE_MAP[newUser.vai_tro];
        return res.status(200).json({thong_bao: ` Thêm thành công User có id là ${newUser.id} và role là ${role}` ,success: true});

    } catch (error) {
        await cleanUpfiles();
        const err= error as CustomError;
        console.log(err.message);
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi thêm user";
        return res.status(status).json({thong_bao, success: false})
    }
})
router.get('/:id', async(req: Request<UserParams>, res: Response)=>{
    try {
        const {id} = req.params;
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID người dùng không hợp lệ" };
        }
        const user = await User.findByPk(id,{
            attributes: [
                'id','tai_khoan','email','ho_ten','ten_shop','vai_tro','hinh','provider','khoa',
                'dien_thoai','xac_thuc_email_luc','is_shop','createdAt','updatedAt'
            ]
        });
        if(!user){
            throw {status: 404, thong_bao: "Người dùng không tồn tại"};
        }
        res.status(200).json({user, success: true});
    } catch (error) {
        const err  = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi khi lấy 1 người dùng";
        return res.status(status).json({thong_bao, success: false})
    }
})
router.put<UserParams,{},UpdateUser>('/:id',uploadMiddleware ,async(req,res)=>{
    const fileToClean: string[] = [];
    const cleanUpfiles = async()=>{
        await Promise.all(
            fileToClean.map((filePath)=>{
                return fs.promises.unlink(filePath).catch((error)=>{
                    console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);
                    return Promise.resolve();
                })
            })
        )
    }
    try {
        const {id} = req.params;
        const files = req.files as  MulterFieldFiles;
        const newHinh = files?.['hinh_user']?.[0]?.path;
        if(newHinh) fileToClean.push(newHinh);
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID người dùng không hợp lệ" };
        }
        const {mat_khau, mat_khau_nhap_lai, ho_ten, dien_thoai, vai_tro, khoa} = req.body;
        const  user = await User.findByPk(id);
        if(!user){
            throw {status: 404, thong_bao: "Không tìm thấy user để cập nhật"};
        }
        
        const allowedUpdate: AllowedUpdateUser = {};
        const oldFileToDelete:string[] = [];
        const hoTenTrim = ho_ten?.trim();
        const dienThoaiTrim = dien_thoai?.trim();
        let shouldInvalidateToken = false;
        
        if(mat_khau){
            const hasUpperCase = /[A-Z]/;
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
            if(mat_khau.length < 8 || !hasUpperCase.test(mat_khau) || !hasSpecialChar.test(mat_khau)){
                throw {status: 400, thong_bao: "Mật  khẩu phải trên  8 ký tự, có 1 chữ in hoa và 1 ký tự đặc biệt"};
            }
            if(mat_khau != mat_khau_nhap_lai){
                throw {status: 400, thong_bao: "Mật khẩu không trùng mật khẩu nhập lại"};
            } 
            const salt = await  bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(mat_khau, salt);
            allowedUpdate.mat_khau = hashedPassword;
            shouldInvalidateToken = true;
        }
        if(hoTenTrim !== undefined && user.ho_ten !== hoTenTrim){
            allowedUpdate.ho_ten = hoTenTrim;
        }
        if(dienThoaiTrim !== undefined && user.dien_thoai !== dienThoaiTrim){
            if(isNaN(Number(dienThoaiTrim)) || dienThoaiTrim.length < 9){
                throw {status: 400, thong_bao: "Điện thoại phải là số và phải hơn 9 ký tự"};
            }
            allowedUpdate.dien_thoai = dienThoaiTrim;
        }
        if(vai_tro !== undefined){
            if(user.vai_tro !== Number(vai_tro)){
                const allowedRole = [0,1];
                
                if(!allowedRole.includes(Number(vai_tro))){
                    throw {status: 400, thong_bao: "Vai Trò không hợp lệ"};
            }
            allowedUpdate.vai_tro = Number(vai_tro);
            shouldInvalidateToken = true;
        }
        }

        if(normalizeBoolean(user.khoa) !== normalizeBoolean(khoa)){
            allowedUpdate.khoa = normalizeBoolean(khoa);
            shouldInvalidateToken = true;
        }
        if(newHinh){
            allowedUpdate.hinh = processFilePath(newHinh);
            if(user.hinh){
                const oldAbsolutePath = covertWebPathToAbsolutePath(user.hinh);
                oldFileToDelete.push(oldAbsolutePath);
            }
        }
        if(shouldInvalidateToken){
            allowedUpdate.token_version = user.token_version + 1;
        }
        
        if(Object.keys(allowedUpdate).length > 0){
            await user.update(allowedUpdate);
            const updateUser = user.toJSON();
            await  Promise.all(oldFileToDelete.map((filePath)=>{
                return fs.promises.unlink(filePath).catch((error)=>{
                    console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);
                    return Promise.resolve();
                })
            }))
            return res.status(200).json({thong_bao: `Đã cập nhật user có ID là ${updateUser.id}`,success: true});
        }
        const  unUpdateUser =user.toJSON();
        return res.status(200).json({thong_bao: ` Không có cập nhật gì ở User có ID là ${unUpdateUser.id}`,success:true});
    } catch (error) {
        await cleanUpfiles();
        const err = error as  CustomError;
        console.log(err.message);
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi cập nhật User";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.delete('/:id',async(req: Request<UserParams>, res: Response)=>{
    try {
        const {id} = req.params;
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID người dùng không hợp lệ" };
        }
        const user = await User.findByPk(id);
        if(!user){
            throw {status: 404, thong_bao: "Người dùng không tồn tại nên không thể xóa"};
        }
        const fileToUnlink: string[] = [];
        if(user.hinh){
            fileToUnlink.push(user.hinh);
        }
        const  deletePromies = async()=>{
            await Promise.all(
                fileToUnlink.map((filePath)=>{
                    const  absolutePath = covertWebPathToAbsolutePath(filePath);
                    return fs.promises.unlink(absolutePath).catch((err)=>{
                        console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, err.message);
                        return Promise.resolve();
                    });
                })
            );
        };
        await deletePromies();
        await user.destroy();
        return res.status(200).json({thong_bao: "Đã xóa thành công user", success: true});
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao =err.thong_bao || "Lỗi máy chủ khi  xóa  user";
        return res.status(status).json({thong_bao,success: false});
    }
})
//success
export default router;