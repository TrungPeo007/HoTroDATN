import express, { Request, Response } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import fs from 'fs';
import validate from '../middleware/validate';
import { createPTTTInput, createPTTTschema, paramPTTTIdInput, PTTTIdSchema, updatePTTTInput, updatePTTTSchema } from '../schema/pttt.schema';
import { covertWebPathToAbsolutePath, processFilePath } from '../ultis/pathprocess';
import { PTTT } from '../models';
import { Op } from 'sequelize';
import { cleanUpfiles } from '../ultis/file';
import { allowedUpdatePTTT, GetAllPttt } from '../types/pttt';
import { normalizeBoolean } from '../ultis/validate';
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
router.get<{},{},{},GetAllPttt>('/',async(req, res)=>{{
    try {
        const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
        const offset = (page -1) * limit;
        const {rows, count} = await  PTTT.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['createdAt','DESC']]
        });
        const totalPages = Math.ceil(count / limit);
        const  result = {
            data: rows,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItem: count,
                totalPages: totalPages
            }
        };
        return res.status(200).json({result, success: true});
    } catch (error) {
        const err = error as CustomError;
        console.log(err.message);
        return res.status(500).json({thong_bao: "Lỗi máy chủ khí lấy danh  sách pttt", success: false});
    }
}})
router.get<paramPTTTIdInput>('/:id',validate(PTTTIdSchema),async(req, res)=>{
    try {
        const {id} = req.params;
        const phuongThuc = await PTTT.findByPk(id,{
            attributes: ['id','ten_pt','code','img','an_hien','createdAt']
        });
        if(!phuongThuc){
            throw {status: 404, thong_bao: "Phương thức thanh toán không tồn tại"};
        }
        return res.status(200).json({phuongThuc, success: true});
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao  = err.thong_bao || "Lỗi máy chủ khi lấy chi tiết 1 phuong thức thanh toán";
        return res.status(status).json({thong_bao});
    }
})
router.put<updatePTTTInput['params'],{},updatePTTTInput['body']>('/:id',uploadMiddleware, validate(updatePTTTSchema),async(req ,res)=>{
        try {
            const {id} = req.params;
            const {ten_pt, code, an_hien} = req.body;
            const files = req.files as MulterFieldFiles;
            const newHinh = files?.['hinh_pttt']?.[0]?.path;
            const oldFileToDelete: string[] = [];
            const phuongThuc = await PTTT.findByPk(id);
            if(!phuongThuc){
                throw {status: 404, thong_bao: "Phương thức thanh toán không tồn tại nên không thể sửa"};
            }
            const allowedUpdate: allowedUpdatePTTT = {};
            if(phuongThuc.ten_pt !== ten_pt){
                const existingTenPt = await PTTT.findOne({
                    where: {
                        ten_pt: ten_pt,
                        id: {[Op.not]: phuongThuc.id}
                    }
                });
                if(existingTenPt){
                    throw {status: 409, thong_bao: "Tên  phương  thức thanh toán đã tồn tại vui lòng nhập cái khác"}
                }
                allowedUpdate.ten_pt = ten_pt;
            }
            if(phuongThuc.code !== code){
                const existingCode = await PTTT.findOne({
                    where: {
                        code: code,
                        id: {[Op.not]: phuongThuc.id}
                    }
                });
                if(existingCode){
                    throw {status: 409, thong_bao: "Tên code đã tồn tại vui  lòng nhập cái khac"};
                }
                allowedUpdate.code = code;
            }
            if(an_hien !==undefined &&  normalizeBoolean(phuongThuc.an_hien) !== an_hien){
                allowedUpdate.an_hien = an_hien;
            }
            if(newHinh){
                allowedUpdate.img = processFilePath(newHinh);
                if(phuongThuc.img){
                    const oldAbsolutePath = covertWebPathToAbsolutePath(phuongThuc.img);
                    oldFileToDelete.push(oldAbsolutePath);
                }
            }
            if(Object.keys(allowedUpdate).length > 0){
                await phuongThuc.update(allowedUpdate);
                const updatePTTT = phuongThuc.toJSON();
                await Promise.all(oldFileToDelete.map((filePath)=>{
                    return fs.promises.unlink(filePath).catch((error)=>{
                        console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);   
                        return Promise.resolve();
                    });
                }));
                return res.status(200).json({thong_bao: ` Đã cập nhật phương thức thanh toán có ID  là ${phuongThuc.id}`,success: true});
            }
            return res.status(200).json({thong_bao: "Không có thông tin nào thay đổi", success: true});
        } catch (error) {
            await cleanUpfiles(req);
            const err = error as CustomError;
            const status = err.status || 500;
            const thong_bao = err.thong_bao || "Lỗi máy chủ khi  cập nhật phương thức thanh toán";
            return res.status(status).json({thong_bao, success: false});
        }
})
router.delete<paramPTTTIdInput>('/:id',validate(PTTTIdSchema),async(req,res)=>{
    try {
        const {id} = req.params;
        const PhuongThuc = await  PTTT.findByPk(id);
        if(!PhuongThuc){
            throw {status: 404, thong_bao: "ID phương thức không tồn tại nên không thể xóa"};
        }
        const filesToUnlink: string[] = [];
        if(PhuongThuc.img){
            filesToUnlink.push(PhuongThuc.img);
        }
        await PhuongThuc.destroy();
        await Promise.all(
            filesToUnlink.map((filePath)=>{
                const absolutePath = covertWebPathToAbsolutePath(filePath);
                return fs.promises.unlink(absolutePath).catch((error)=>{
                    console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);
                    return Promise.resolve();
                });
            })
        );
        return res.status(200).json({thong_bao:"Đã xóa thành công phương thức thanh toán",success: true});
    } catch (error) {
        const err = error as CustomError;
        
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi xóa  phương thức thanh toán";
        return  res.status(status).json({thong_bao, success: false});
    }
})
export default router;