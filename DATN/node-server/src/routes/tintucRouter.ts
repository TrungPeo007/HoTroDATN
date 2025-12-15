import express, { Request, Response } from 'express';
import fs from 'fs';
import { AllowedUpdateTinTuc, GetAllTinTuc } from '../types/tintuc';
import { DanhMucTin, TinTuc } from '../models';
import { uploadMiddleware } from '../middleware/upload';
import validate from '../middleware/validate';
import { createTinTucInput, createTinTucSchema, updateTinTucInput, updateTinTucSchema } from '../schema/tintuc.schema';
import { covertWebPathToAbsolutePath, processFilePath } from '../ultis/pathprocess';
import { cleanUpfiles } from '../ultis/file';
import { Op } from 'sequelize';
import { normalizeBoolean } from '../ultis/validate';
const router = express.Router();
interface CustomError {
	status?: number;//dùng ? vì có khi dữ lieuj lỗi tra về ko có status
	thong_bao?: string;
	message?: string;

}
type MulterFieldFiles  = {[fieldname: string]: Express.Multer.File[]};
router.get<{},{},{},GetAllTinTuc>('/',async(req: Request, res: Response)=>{
	try {
		const  page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const offset = (page -1) * limit;
		const {rows, count} = await TinTuc.findAndCountAll({
			limit: limit,
			offset: offset,
			order: [['createdAt','DESC']]
		})
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
		const err = error as CustomError;
		return res.status(500).json({thong_bao:"Lỗi máy chủ khi lấy danh sách tin tức"})
	}
})
router.post<{},{},createTinTucInput>('/',uploadMiddleware, validate(createTinTucSchema),async(req,res)=>{
	try {
		const {tieu_de, id_dm, noi_dung, tac_gia,an_hien} = req.body;
		const files = req.files as MulterFieldFiles;
		const newHinh = files?.['hinh_tin']?.[0]?.path;
		if(!newHinh){
			throw {status: 400, thong_bao: "Bạn cần phải chọn 1 hình để tạo tin tưc"};
		}
		const existingTieuDe = await TinTuc.findOne({
			where: {
				tieu_de: tieu_de
			}
		})
		if(existingTieuDe){
			throw {status: 409, thong_bao: "Tiêu  đề sản phẩm đã tồn tại mời nhập tên khác"};
		}
		//có thể làm promise all để chạy  2 câu lệnh giuos nhanh  hơn
		// const [existingTieuDe, loaiTin] = await Promise.all([
		//     TinTuc.findOne({ where: { tieu_de: tieu_de } }),
		//     DanhMucTin.findByPk(id_dm)
		// ]);
		const  loaiTin = await DanhMucTin.findByPk(id_dm);
		if(!loaiTin){
			throw {status: 404, thong_bao: "danh mục tin không hợp lệ không có loại tin nào như vậy"};
		}
		const hinhPath = processFilePath(newHinh);
		const newTinTuc = await TinTuc.create({
			tieu_de,
			img: hinhPath,
			id_dm,
			noi_dung,
			tac_gia: tac_gia || "Tác giả ẩn danh",
			an_hien,
			luot_xem: 0
		})
		return res.status(200).json({thong_bao: `Đã tạo tin tức có ID là ${newTinTuc.id}`, success: true});
	} catch (error) {
		await  cleanUpfiles(req);
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi  tạo tin tức";
		return res.status(status).json({thong_bao, success: false});
	}
})
router.get<updateTinTucInput['params']>('/:id',async(req,res)=>{
	try {
		const {id} = req.params;
		const tinTuc = await TinTuc.findByPk(id,{
			attributes: ['id','tieu_de','img','id_dm','noi_dung','tac_gia','an_hien','createdAt']
		})
		if(!tinTuc){
			throw {status: 404, thong_bao: "ID tin tức không tồn tại nên không lấy đc thông tin chi tiết của 1 tin tuc"};
		}
		return res.status(200).json({tinTuc, success: true});
	} catch (error) {
		const err  = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi lấy chi tiết 1 tin tức";
		return res.status(status).json({thong_bao,success: false});
	}
});
router.put<updateTinTucInput['params'],{}, updateTinTucInput['body']>('/:id',uploadMiddleware, validate(updateTinTucSchema),async(req,res)=>{
	try {
		const {id} = req.params;
		const {tieu_de, id_dm, noi_dung, tac_gia, an_hien} = req.body;
		const files = req.files as MulterFieldFiles;
		const newHinh = files?.['hinh_tin']?.[0]?.path;
		const tinTuc = await TinTuc.findByPk(id);
		if(!tinTuc){
			throw {status: 404, thong_bao: "Không tìm thấy tin tức để cập nhật"};
		}
		const allowedUpdate: AllowedUpdateTinTuc = {};
		const oldFileToDelete: string[] = [];
		if(tinTuc.tieu_de !== tieu_de){
			const existingTieuDe = await TinTuc.findOne({
				where: {
					tieu_de: tieu_de,
					id: {[Op.not]: tinTuc.id}
				}
			})
			if(existingTieuDe){
				throw {status: 409, thong_bao: "Tiêu để đã tồn tại vui lòng nhập cái khác"};
			}
			allowedUpdate.tieu_de = tieu_de;
		}
		if(tinTuc.id_dm !== id_dm){
			const loaiTin = await DanhMucTin.findByPk(id_dm);
			if(!loaiTin){
				throw {status: 404, thong_bao: "danh mục tin không hợp lệ không có danh mục tin nào như vậy"};
			}
			allowedUpdate.id_dm = id_dm;
		}
		if(tinTuc.noi_dung !== noi_dung){
			allowedUpdate.noi_dung = noi_dung;
		}
		if(tac_gia !== undefined){
			const newTacGia = tac_gia === "" ? "Tác giả ẩn danh" : tac_gia;
			if(tinTuc.tac_gia !== newTacGia){
				allowedUpdate.tac_gia = newTacGia;
			}
		}
		
		if(an_hien !== undefined && normalizeBoolean(tinTuc.an_hien) !== an_hien){
			allowedUpdate.an_hien = an_hien;
		}
		if(newHinh){
			allowedUpdate.img = processFilePath(newHinh);
			if(tinTuc.img){
				const oldAbsolutePath = covertWebPathToAbsolutePath(tinTuc.img);
				oldFileToDelete.push(oldAbsolutePath);
			}
		}
		if(Object.keys(allowedUpdate).length > 0){
			await tinTuc.update(allowedUpdate);
			const updateTinTuc = tinTuc.toJSON();
			await Promise.all(oldFileToDelete.map((filePath)=>{
				return fs.promises.unlink(filePath).catch((error)=>{
					console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);   
					return Promise.resolve();
				});
			}));
			return res.status(200).json({thong_bao: ` Đã cập nhật tin tức có ID là ${updateTinTuc.id}`,success: true});
		}
		return res.status(200).json({thong_bao: "Không có thông tin nào được  thay đổi", success: true});


	} catch (error) {
		await cleanUpfiles(req);
		const err = error as CustomError;
		const status  = err.status || 500;
		const thong_bao = err.thong_bao	|| "Lỗi máy chủ khi cập nhật tin tức";
		return res.status(status).json({thong_bao, success: false});
	}
})
router.delete<updateTinTucInput['params']>('/:id',async(req,res)=>{
	try {
		const {id} = req.params;
		const tinTuc = await TinTuc.findByPk(id);
		if(!tinTuc){
			throw {status: 404, thong_bao: "Tin tức không tồn tại nên không thể xóa"};
		}
		const filesToUnlink: string[] = [];
		if(tinTuc.img){
			filesToUnlink.push(tinTuc.img);
		}
		await tinTuc.destroy();
		const deletePromies  = async()=>{
			await Promise.all(
				filesToUnlink.map((filePath)=>{
					const absolutePath = covertWebPathToAbsolutePath(filePath);
					return fs.promises.unlink(absolutePath).catch((error)=>{
						console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);
						return Promise.resolve();
					});
				})
			);
		};
		await deletePromies();
		return res.status(200).json({thong_bao: "Đã xóa thành công tin tức", success: true});
	} catch (error) {
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi xóa tin tức";
		return res.status(status).json({thong_bao, success: false})
	}
})
export default router;