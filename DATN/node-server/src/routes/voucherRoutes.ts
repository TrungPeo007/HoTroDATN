import express, { Request, Response } from 'express';
import { Voucher } from '../models';
import { getAllVoucher } from '../types/voucher';
import { createVoucherInput, createVoucherSchema, ParamVoucherIdInput, updateVoucherInput, updateVoucherschema, VoucherIdSchema } from '../schema/voucher.schema';
import validate from '../middleware/validate';
import { normalizeBoolean } from '../ultis/validate';
const router = express.Router();
interface CustomError {
	status?: number;//dùng ? vì có khi dữ lieuj lỗi tra về ko có status
	thong_bao?: string;
	message?: string;

}
router.get<{}, {}, {}, getAllVoucher>('/',async(req: Request, res: Response)=>{
    try {
        const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
        const offset = (page -1) * limit;
        const {rows, count} = await Voucher.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['createdAt','DESC']]
        });
        const totalPages = Math.ceil(count / limit);
        const result = {
            data: rows,
            pagination: {
                currentPage: page,
                totalItem: count,
                limit: limit,
                totalPages: totalPages
            }
        };
        return res.status(200).json({result, success: true});
    } catch (error) {
        return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy danh sách  Voucher"});
    }
})
router.post<{}, {}, createVoucherInput>('/',validate(createVoucherSchema),async(req, res)=>{
    try {
        const {ten_km, code, loai_km, gia_tri_giam, gia_giam_toi_da,gia_tri_don_min, so_luong, 
            gioi_han_user, ngay_bd, ngay_kt, trang_thai
        } = req.body;
        if(!loai_km){
            throw {status: 400, thong_bao: "Loại khuyến mãi không được để trống"}
        }
        const finalCode = code.toUpperCase();
        if(new Date(ngay_bd) >= new Date(ngay_kt)){
            throw {status: 400, thong_bao: "Ngày kết thúc phải diên ra sau ngay bắt đầu"};
        }
        
        if(loai_km === 1){
            if( gia_tri_giam > 100){
                throw {status: 409, thong_bao: "Giá trị giảm theo phần trăm không đc quá 100"};
            }
            if(!gia_giam_toi_da  && gia_giam_toi_da <= 0 ){
                throw {status: 400, thong_bao: "Khi giảm theo %, vui lòng nhập 'Giá giảm tối đa' hợp lệ (lớn hơn 0)"};
            }
        }
        const existingCode = await Voucher.findOne({
            where: {code: finalCode}
        });
        if(existingCode){
            throw {status: 409, thong_bao: "Mã code đã bị tồn tại, vui lòng nhập cái khác"};
        }
        const newVoucher = await Voucher.create({
            ten_km,
            code: finalCode,
            loai_km: loai_km,
            gia_tri_giam: gia_tri_giam,
            gia_giam_toi_da: gia_giam_toi_da,
            so_luong: so_luong,
            gioi_han_user: gioi_han_user,
            gia_tri_don_min: gia_tri_don_min,
            ngay_bd: ngay_bd,
            ngay_kt: ngay_kt,
            trang_thai: trang_thai
        })
        return res.status(200).json({thong_bao: ` Đã tạo voucher có ID là ${newVoucher.id}`, success: true});
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi thêm voucher";
        return res.status(status).json({thong_bao, success: false})
    }
})
router.get<ParamVoucherIdInput>('/:id',validate(VoucherIdSchema),async(req, res)=>{
    try {
        const {id} = req.params;
        const voucher = await Voucher.findByPk(id);
        if(!voucher){
            throw {status: 404, thong_bao: "Khuyến mãi không tồn tại"};
        }
        return res.status(200).json({voucher, success: true});
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi lấy chi tiết user";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.put<updateVoucherInput['params'], {}, updateVoucherInput['body']>('/:id',validate(updateVoucherschema), async(req , res)=> {
    try {
        const {id} = req.params;
        const {ten_km,so_luong, ngay_kt, trang_thai,gioi_han_user} = req.body;
        const allowedUpdate: Partial<Voucher> = {};
        const voucher = await Voucher.findByPk(id);
        if(!voucher){
            throw {status: 404, thong_bao: "Khuyến mãi không tồn tại"};
        }
        if(voucher.ten_km !== ten_km){
            allowedUpdate.ten_km = ten_km;
        }
        if(voucher.so_luong !== so_luong){
            if(so_luong < voucher.da_dung){
                throw {status: 400, thong_bao: `Không thể giảm số lượng xuống ${so_luong} vì đã có ${voucher.da_dung} lượt sử dụng.`}
            }
            allowedUpdate.so_luong = so_luong;
        }
        if(ngay_kt.getTime() !== new Date(voucher.ngay_kt).getTime()){
            if (ngay_kt.getTime() <= new Date(voucher.ngay_bd).getTime()) {
                throw { status: 400, thong_bao: "Ngày kết thúc mới phải sau ngày bắt đầu của voucher" };
            }
            allowedUpdate.ngay_kt = String(ngay_kt);
        }
        if(voucher.gioi_han_user !== gioi_han_user){
            allowedUpdate.gioi_han_user = gioi_han_user;
        }
        if(normalizeBoolean(voucher.trang_thai) !== trang_thai){
            allowedUpdate.trang_thai = trang_thai;
        }
        if(Object.keys(allowedUpdate).length > 0){
            const updateVoucher = await voucher.update(allowedUpdate);
            return res.status(200).json({thong_bao: `Đã cập nhật khuyến mãi có ID là ${updateVoucher.id}`, success: true});
        }
        return res.status(200).json({thong_bao: "Không có thông tin nào đc thay đổi", success: true})
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi cập nhật khuyến mãi";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.delete<ParamVoucherIdInput>('/:id',validate(VoucherIdSchema), async(req , res)=>{
    try {
        const {id} = req.params;
        const voucher = await Voucher.findByPk(id);
        if(!voucher){
            throw {status: 404, thong_bao: "Khuyến mãi không tồn tại"};
        }
        // const isUsed = await DonHang.findOne({
        //     where: { id_km: id } 
        // }); 
        // if(isUsed){
        //     throw {status: 400, thong_bao: "Khuyến mãi này đã có đơn hàng sử dụng. Không thể xóa! Vui lòng chọn 'Dừng hoạt động' (Sửa trạng thái)."}
        // }
        await voucher.destroy();
        return res.status(200).json({thong_bao: "Đã xóa voucher thành công",success: true});
    } catch (error) {
        const err = error as CustomError;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi xóa Khuyến mãi"
        const status = err.status || 500;
        return res.status(status).json({thong_bao, success: false})
    }
})
export default router;