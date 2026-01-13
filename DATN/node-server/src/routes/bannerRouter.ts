import express, { Request, Response } from 'express';
import fs from 'fs';
import { AllowedUpdateBanner, getAllBanner } from '../types/banner';
import { Banner } from '../models';
import { createbannerInput, createbannerSchema, GetBannerInput, getBannerSchema, updateBannerInput, updateBannerSchema } from '../schema/banner.schema';
import { Op } from 'sequelize';
import { covertWebPathToAbsolutePath, processFilePath } from '../ultis/pathprocess';
import { uploadMiddleware } from '../middleware/upload';
import { cleanUpfiles } from '../ultis/file';
import validate from '../middleware/validate';
import { adJustOrderInDanhMucTin } from '../ultis/adjustorder';
import { normalizeBoolean } from '../ultis/validate';
import { AN_HIEN_VALUE } from '../config/explain';
const router = express.Router();
interface CustomError {
	status?: number;//dùng ? vì có khi dữ lieuj lỗi tra về ko có status
	thong_bao?: string;
	message?: string;

}
type MulterFieldFiles = {[fieldname: string]: Express.Multer.File[]};
router.get<{},{},{},getAllBanner>('/',async(req: Request, res: Response)=>{
    try {
        const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
        const offset = (page-1) * limit;
        const {rows, count} = await Banner.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['createdAt','DESC']]
        });
        const totalPages = Math.ceil(count/ limit);
        const result = {
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
        return res.status(500).json({thong_bao:"Lỗi máy chủ khi lấy danh sách  banner", success: false});
    }
})
router.post<{},{},createbannerInput>('/',uploadMiddleware,validate(createbannerSchema),async(req ,res)=>{
    try {
        const {name, url, vi_tri, an_hien} = req.body;
        const files = req.files as MulterFieldFiles;
        const newHinh = files?.['hinh_banner']?.[0]?.path;
        if(!newHinh){
            throw {status: 400, thong_bao: "Bạn cần phải chèn 1 hình vào để tạo banner "};
        }
        const existingName = await Banner.findOne({
            where: {
                name: name
            }
        });
        if(existingName){
            throw {status: 409, thong_bao: "Tên  banner đã tồn tại vui lòng nhập cái khác"}
        }
        const maxOrder: number =  await Banner.max('stt');
        const newOrder = (maxOrder || 0) +1;
        const hinhPath = processFilePath(newHinh);
        const newBanner = await  Banner.create({
            stt: newOrder,
            name,
            url,
            img: hinhPath,
            vi_tri: vi_tri ,
            an_hien
        })
        return res.status(200).json({thong_bao: ` Thêm thành công banner có ID là ${newBanner.id}`, success: true});

    } catch (error) {
        await cleanUpfiles(req);
        const err = error as  CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi  thêm  banner";
        return  res.status(status).json({thong_bao, success: false})
    }
})
router.get<updateBannerInput['params']>('/:id',async(req,res)=>{
    try {
        const {id} = req.params;

        const banner = await Banner.findByPk(id,
            {
                attributes: ['id','name','stt','url','img','vi_tri','an_hien','createdAt']
            }
        )
        if(!banner){
            throw {satus: 404, thong_bao: "ID banner không tồn tại không thể lấy  được chi tiết 1 banner"};
        }
        return res.status(200).json({data: banner, success:  true});
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy  chủ khi lấy chi tiết 1 banner";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.put<updateBannerInput['params'],{},updateBannerInput['body']>('/:id',uploadMiddleware, validate(updateBannerSchema),async(req, res)=>{
    try {
        const {id} = req.params;
        const {stt, name, url, vi_tri, an_hien} = req.body;
        const files = req.files as  MulterFieldFiles;
        const newHinh = files?.['hinh_banner']?.[0]?.path;
        const allowedUpdate: AllowedUpdateBanner = {};
        const oldFileToDelete: string[] = [];
        const banner = await Banner.findByPk(id);
        if(!banner){
            throw {status: 404, thong_bao: "không tìm thấy ID để cập nhập banner"};
        }
        
        if(stt !== undefined && banner.stt !== stt){
            if(stt > banner.stt){
                await adJustOrderInDanhMucTin(-1, Banner,{
                    stt: {[Op.gt]: banner.stt, [Op.lte]: stt}
                })
            }else{
                await adJustOrderInDanhMucTin(+1, Banner, {
                    stt: {[Op.gte]: stt, [Op.lt]: banner.stt}
                })
            }
            allowedUpdate.stt = stt;
        }
        if(banner.name !== name){
            const existingName = await  Banner.findOne({
                where: {
                    name: name,
                    id: {[Op.not]: banner.id}
                }
            });
            if(existingName){
                throw {status: 409, thong_bao: "Tên banner đã tồn tại vui lòng nhập cái khác"};
            }
            allowedUpdate.name = name;
        }
        if(banner.url !== url){
            allowedUpdate.url = url;
        }
        if(banner.vi_tri !== vi_tri){
            allowedUpdate.vi_tri = vi_tri;
        }
        if(normalizeBoolean(banner.an_hien) !== an_hien){
            allowedUpdate.an_hien = an_hien;
        }
        if(newHinh){
            allowedUpdate.img = processFilePath(newHinh);
            if(banner.img){
                const oldAbsolutePath = covertWebPathToAbsolutePath(banner.img);
                oldFileToDelete.push(oldAbsolutePath);
            }
        }
        if(Object.keys(allowedUpdate).length > 0){
            await banner.update(allowedUpdate);
            const updateBanner = banner.toJSON();
            await Promise.all(oldFileToDelete.map((filePath)=>{
                return fs.promises.unlink(filePath).catch((error)=>{
                    console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);   
                    return Promise.resolve();
                });
            }));
            return res.status(200).json({thong_bao: ` Đã cập nhật banner có ID là ${updateBanner.id}`, success: true});
        }
        return res.status(200).json({thong_bao: "Không có thông tin nào thây đổi", success: true});

    } catch (error) {
        await cleanUpfiles(req);
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao =err.thong_bao || "Lỗi máy  chủ khi cập nhật Banner";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.delete<updateBannerInput['params']>('/:id',async(req , res)=>{
    try {
        const {id} = req.params;
        const banner = await Banner.findByPk(id);
        if(!banner){
            throw {status: 404, thong_bao: "ID banner không tồn tại nên không thể xóa"};
        }
        const fileToUnlink: string[] = [];
        if(banner.img){
            fileToUnlink.push(banner.img);
        }
        const {stt} = banner;
        await banner.destroy();
        await Promise.all(
            fileToUnlink.map((filePath)=>{
                const absolutePath = covertWebPathToAbsolutePath(filePath);
                return fs.promises.unlink(absolutePath).catch((error)=>{
                    console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);
                    return Promise.resolve();
                });
            }));
        await adJustOrderInDanhMucTin(-1, Banner, {
            stt: {[Op.gt]: stt}
        });
        return res.status(200).json({thong_bao: "Đã xóa thành công banner", success: true});
    } catch (error) {
        const err= error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi xóa banner";
        return res.status(status).json({thong_bao, success: false});
    }
})
// Route: GET /api/banner?vi_tri=home_slider

export default router;