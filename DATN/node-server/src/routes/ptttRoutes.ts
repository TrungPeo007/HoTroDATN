import express, { Request, Response } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import validate from '../middleware/validate';
import { createPTTTInput, createPTTTschema } from '../schema/pttt.schema';
import { processFilePath } from '../ultis/pathprocess';
import { PTTT } from '../models';
import { Op } from 'sequelize';
import { cleanUpfiles } from '../ultis/file';
const router = express.Router();
interface CustomError{
    message?: string;
    status?: number;
    thong_bao?: string;
}
type MulterFieldFiles = {[filedname: string]: Express.Multer.File[]};
router.post<{},{},createPTTTInput>('/',uploadMiddleware, validate(createPTTTschema), async(req: Request, res: Response)=>{
    try {
        const {ten_pt, code, an_hien} = req.body;
        const files = req.files as MulterFieldFiles;
        const newHinh = files?.['hinh_pttt']?.[0]?.path;
        const hinhPath = newHinh ? processFilePath(newHinh) : null;
        const existing = await PTTT.findOne({
            where: {[Op.or]: [{ten_pt: ten_pt}, {code : code}]}
        });
        if(existing){
            if(existing.ten_pt === ten_pt){
                throw {status: 409, thong_bao: "Tên phương thức đã tồn tại mới  nhập cái khác"};
            }
            if(existing.code === code){
                throw {status: 409, thong_bao: "Code đã tồn tại mời nhập cái khác"}
            }
        }
        const newPTTT = await PTTT.create({
            ten_pt: ten_pt,
            code: code,
            img: hinhPath,
            an_hien: an_hien
        });
        return res.status(200).json({thong_bao: `Đã tạo thành công phương thức toán có ID là ${newPTTT.id}`, success: true});

    } catch (error) {
        await cleanUpfiles(req);
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi thêm phương thức thanh toán";
        return res.status(status).json({thong_bao, success: false});
    }
})
export default router;