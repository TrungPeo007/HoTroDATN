import { Request, Response } from "express";
import fs from 'fs';
import express from 'express';
import { AllowedUpdateThuongHieuSp, GetAllThuongHieu, ThuongHieuSPParams } from "../types/thuonghieu";
import { ThuongHieu } from "../models";
import validate from "../middleware/validate";
import { createThuongHieuInput, createThuongHieuSpSchema, updateThuongHieuInput, updateThuongHieuSpSchema } from "../schema/thuonghieu.schema";
import { cleanUpfiles } from "../ultis/file";
import { uploadMiddleware } from "../middleware/upload";
import { generateSlug, removeVietnameseTones } from "../ultis/slugrename";
import { covertWebPathToAbsolutePath, processFilePath } from "../ultis/pathprocess";
import { Op } from "sequelize";
import { normalizeBoolean } from "../ultis/validate";
import { DanhMucSPParams } from "../types/dm_sp";
const router = express.Router();
interface CustomError {
    status?: number;
    thong_bao?: string;
    message?: string;
}
type MulterFieldFiles = {[fieldname: string]: Express.Multer.File[]};
router.get<{},{},{},GetAllThuongHieu>('/',async(req: Request, res: Response)=>{
    try {
        const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
        const  limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
        const  offset = (page-1) * limit;
        const {rows, count} = await ThuongHieu.findAndCountAll({
            limit:limit,
            offset: offset,
            order: [['createdAt','DESC']]

        });
        const totalPages = Math.ceil(count / limit);
        const result = {
            data: rows,
            pagination: {
                currentPage : page,
                limit: limit,
                totalItem: count,
                totalPages: totalPages
            }
        }
        return res.status(200).json({result, success: true});
    } catch (error) {
        const err = error as CustomError;
        return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy danh sách thuong hiệu"})
    }
})
router.post<{},{}, createThuongHieuInput>('/',uploadMiddleware,validate(createThuongHieuSpSchema) ,async(req,res)=>{
    try {
        const {ten_th, slug, an_hien} = req.body;
        const files = req.files as MulterFieldFiles;
        const newHinh = files?.['hinh_th']?.[0]?.path;
        if(!newHinh){
            throw {status: 400, thong_bao: "Bạn cần phải chèn 1 hình  vào để tạo thương hiệu"};
        }
        const existingTenTh = await ThuongHieu.findOne({
            where: {ten_th: ten_th}
        });
        if(existingTenTh){
            throw {status: 409, thong_bao: "Tên thương hiệu sản phẩm đã tồn tại vui lòng nhập tên khacs"};
        }
        let finalSlug: string = ""
        if(slug  && slug !== ""){
            // const slugNoVietnamese = removeVietnameseTones(slug);
            // if(slug !== slugNoVietnamese){
            //     throw {status: 400, thong_bao: "Slug không đc chứa dấu tiếng việt"}
            // }
            finalSlug = slug;
        }else{
            finalSlug = generateSlug(ten_th);
        }
        const slugTrung = await ThuongHieu.findOne({
            where: {
                slug: finalSlug
                
            },
            attributes: ['id']
        });
        if(slugTrung){
            throw {status: 409,thong_bao: "Lỗi do slug bị trùng với thương hiệu sản phẩm khác"};
        }
        const hinhPath  = processFilePath(newHinh);
        const newTHSp = await ThuongHieu.create({
            ten_th: ten_th,
            img: hinhPath,
            an_hien,
            slug: finalSlug
        });
        return res.status(200).json({thong_bao: ` Thêm thành công thuong hiệu sản phẩm có Id là ${newTHSp.id}`, success: true})
    } catch (error) {
        const err= error as CustomError;
        console.log(err.message);
        await cleanUpfiles(req);
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi  thêm  thương hiệu sản phẩm";
        return res.status(status).json({thong_bao});
    }
})
router.get<ThuongHieuSPParams>('/:id',async(req, res)=>{
    try {
        const {id} = req.params;
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID thương hiệu sản phẩm không hợp lệ" };
        }
        const THSP = await ThuongHieu.findByPk(id,{
            attributes: ['id','ten_th','an_hien','slug','createdAt']
        });
        if(!THSP){
            throw {status: 404, thong_bao: "ID thương hiệu không tồn tại"};
        }
        return res.status(200).json({THSP, success: true});
    } catch (error) {
        const  err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi lấy chi tiết 1 thương hiệu sản phẩm";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.put<ThuongHieuSPParams, {}, updateThuongHieuInput>('/:id',uploadMiddleware, validate(updateThuongHieuSpSchema),async(req,res)=>{
    try {
        const {id} = req.params;
    
        const {ten_th, slug, an_hien} = req.body;
        const files  = req.files as MulterFieldFiles;
        const newHinh = files?.['hinh_th']?.[0]?.path;
        const THSP = await ThuongHieu.findByPk(Number(id));
        if(!THSP){
            throw {status: 404, thong_bao: "Không tìm thấy ID để cập nhật thương hiệu sản phẩm"};
        }
        const allowedUpdate: AllowedUpdateThuongHieuSp = {};
        const oldFileToDelete: string[] = [];
        if(THSP.ten_th !== ten_th){
            const  existingTenTh = await ThuongHieu.findOne({
                where: {
                    ten_th: ten_th,
                    id: {[Op.not]: THSP.id}
                }
            })
            if(existingTenTh){
                throw {status: 409, thong_bao: "Tên thương hiệu sản phẩm đã tồn tại mới nhập  tên khác"};
            }
            allowedUpdate.ten_th = ten_th;
        }
        let finalSlug: string = "";
        let isSlugChange  = false;
        if(slug && slug !== "" && THSP.slug !== slug){
            finalSlug = slug;
            isSlugChange = true;
        }else if(allowedUpdate.ten_th && (!slug || slug === "")){
            finalSlug = generateSlug(allowedUpdate.ten_th);
            isSlugChange = true
        }
        if(isSlugChange){
            const slugTrung = await ThuongHieu.findOne({
                where: {
                    slug: finalSlug,
                    id: {[Op.not]: THSP.id}
                },
                attributes: ['id']
            })
            if(slugTrung){
                throw {status: 409, thong_bao : "Lỗi do slug bị trùng với thương hiệu sản phẩm khác vui lòng nhập cái khác"};
            }
            allowedUpdate.slug = finalSlug;
        }
        if(normalizeBoolean(THSP.an_hien) !== an_hien){
            allowedUpdate.an_hien = an_hien;
        }
        if(newHinh){
            allowedUpdate.img = processFilePath(newHinh);
            if(THSP.img){
                const oldAbsolutePath = covertWebPathToAbsolutePath(THSP.img);
                oldFileToDelete.push(oldAbsolutePath);
            }
        }
        if(Object.keys(allowedUpdate).length > 0 ){
            await THSP.update(allowedUpdate);
            const updateTHSP =  THSP.toJSON();
            await Promise.all(oldFileToDelete.map((filePath)=>{
                return fs.promises.unlink(filePath).catch((error)=>{
                    console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);   
                    return Promise.resolve();
                });
            }));
        return res.status(200).json({thong_bao: ` Đã cập nhất thương hiệu sản phẩm có ID là ${updateTHSP.id}`, success: true});
        }
        return res.status(200).json({thong_bao: "Không có thông tin nào thay đổi", success: true});

    } catch (error) {
        await cleanUpfiles(req);
        const err = error as CustomError;
        console.log(err.message);
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi cập nhật thương hiệu sản phẩm";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.delete<DanhMucSPParams>('/:id',async(req,res)=>{
    try {
        const {id} = req.params;
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID thương hiệu sản phẩm không hợp lệ" };
        }
        const THSP = await ThuongHieu.findByPk(id);
        if(!THSP){
            throw {status: 404, thong_bao: "Thương hiệu sản phẩm không tồn tại nên không thể xóa"};
        }
        const fileToUnlink: string[] = [];
        if(THSP.img){
            fileToUnlink.push(THSP.img);
        }
        await THSP.destroy();
          const deletePromies = async()=>{
            await Promise.all(
                fileToUnlink.map((filePath)=>{
                    const absolutePath = covertWebPathToAbsolutePath(filePath);
                    return fs.promises.unlink(absolutePath).catch((error)=>{
                        console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);
                        return Promise.resolve();
                    });
                })
            );
        };
        await deletePromies();
        return res.status(200).json({thong_bao: "Đã xóa thành công thương hiệu sản phẩm", success: true});
    } catch (error) {
        const err= error as CustomError;
        const status = err.status || 500;
        const thong_bao  =err.thong_bao || "LỖi máy chủ khi xóa thương hiệu sản phẩm";
        return res.status(status).json({thong_bao, success: false})
    }
})
export default router;