import express, { Request, Response } from 'express';
import { AllowedUpdateThuocTinhSP, GetAllThuocTinh } from '../types/thuoctinh';
import { ThuocTinh } from '../models';
import { createThuocTinhInput, createThuocTinhSpschema, updateThuocTinhInput, updateThuocTinhSpSchema } from '../schema/thuoctinhsp.schema';
import validate from '../middleware/validate';
import { Op } from 'sequelize';
const router = express.Router();
interface CustomError {
    status?: number;
    thong_bao?: string;
    message?: string;
}
router.get<{},{},{}, GetAllThuocTinh>('/',async(req: Request, res: Response)=>{
    try {
        const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
        const offset = (page - 1) * limit;
        const {rows, count} = await ThuocTinh.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['id','DESC']]
        });
        const currentPages = Math.ceil(count / limit);
        const result = {
            data: rows,
            pagination: {
                currentPage: page,
                totalItem: count,
                limit: limit,
                currentPages: currentPages
            }
        }
        return res.status(200).json({result,success: true});
    } catch (error) {
        return res.status(500).json({thong_bao: "Lỗi máy chủ khi  lấy danh sách thuộc tính", success: false});
    }
});
router.post<{}, {}, createThuocTinhInput>('/',validate(createThuocTinhSpschema),async(req,res)=>{
    try {
        const {ten_thuoc_tinh} = req.body;
        const existingTenTT = await ThuocTinh.findOne({
            where: {
                ten_thuoc_tinh: ten_thuoc_tinh
            }
        })
        if(existingTenTT){
            throw {status: 409, thong_bao: "Tên thuộc tính sản phẩm đã tồn tại"};
        }
        const newThuocTinh = await ThuocTinh.create({
            ten_thuoc_tinh: ten_thuoc_tinh
        });
        return res.status(200).json({thong_bao: `Thêm thành công thuộc tính có ID là ${newThuocTinh.id}`, success: true});
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi thêm thuộc tính mới";
        return res.status(status).json({thong_bao, success: false});
    }
});
router.get<updateThuocTinhInput['params']>('/:id', async(req,res)=>{
    try {
        const {id} = req.params;
        const TTSP = await ThuocTinh.findByPk(id,{
            attributes: ['id','ten_thuoc_tinh']
        });
        if(!TTSP){
            throw {status: 404, thong_bao: "ID thuộc tính không tồn tại"};
        }
        return res.status(200).json({TTSP, success: true});
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi lấy chi tiết thuộc tính";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.put<updateThuocTinhInput['params'], {},updateThuocTinhInput['body']>('/:id',validate(updateThuocTinhSpSchema),async(req,res)=>{
    try {
        const {id} = req.params;
        const {ten_thuoc_tinh} = req.body;
        const TTSP = await ThuocTinh.findByPk(id);
        if(!TTSP){
            throw {status: 404, thong_bao: "Không tìm thấy ID để cập nhật thuốc tính sản phẩm"};
        }
        const allowedUpdate: AllowedUpdateThuocTinhSP = {};
        if(TTSP.ten_thuoc_tinh !== ten_thuoc_tinh){
            const existingTenTT = await ThuocTinh.findOne({
                where: {
                    ten_thuoc_tinh: ten_thuoc_tinh,
                    id: {[Op.not]: TTSP.id}
                }
            });
            if(existingTenTT){
                throw {status: 409, thong_bao: "Tên thuộc tính sản phẩm đã tồn tại mời nhập cái khác"};
            }
            allowedUpdate.ten_thuoc_tinh = ten_thuoc_tinh
        }
        if(Object.keys(allowedUpdate).length > 0){
            await TTSP.update(allowedUpdate);
            const updateTTSP = TTSP.toJSON();
            return res.status(200).json({thong_bao: ` Đã cập nhật thuộc tính sản phẩm có ID là ${updateTTSP.id}`, success: true});
        }
        return res.status(200).json({thong_bao: 'không có thông tin nào đc thay đổi', success: true});
    } catch (error) {
        const err = error as  CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao ||"Lỗi máy chủ khi sửa thuộc tính sản phẩm";
        return  res.status(status).json({thong_bao, success: false});
    }
})
router.delete<updateThuocTinhInput['params']>('/:id',async(req,res)=>{
    try {
        const {id} = req.params;
        const TTSP = await ThuocTinh.findByPk(id);
        if(!TTSP){
            throw {status: 404, thong_bao: "Không tìm thấy ID để xóa thuộc tính sản phẩm"};
        }
        await  TTSP.destroy();
        return res.status(200).json({thong_bao: "Đã xóa thành công thuộc tính", success: true});
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi  update thuộc tính sản phẩm";
        return res.status(status).json({thong_bao, success: false});
    }
})
export default router
