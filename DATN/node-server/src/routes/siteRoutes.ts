import express, { Request, Response } from 'express';
import fs from 'fs';
import { AllowedUpdateDiaChi, CreateDiaChiByUser, DiaChiParams, GetAllDiaChiByUser } from '../types/dia_chi_user';
import { checkAuth } from '../middleware/auth';
import {DanhGia, DanhMucTin, Dia_chi_User, DM_San_Pham, GioHang, GioHangChiTiet, IMG_SanPham, KhuyenMaiUser, PTTT, SanPham, SanPhamBienThe, ThuocTinh, ThuocTinhSP, ThuongHieu, TinTuc, User, Voucher, YeuThichSp, YeuThichTin} from '../models';
import { AuthUser } from '../types/express';
import { getNameFromCodes, normalizeBoolean, validateAddressCodes, validateForeignKey } from '../ultis/validate';
import { literal, Op, Order, Sequelize, where, WhereOptions } from 'sequelize';
import { toggleYeuThichInput, toggleYeuThichSchema } from '../schema/yeuthich.schema';
import validate from '../middleware/validate';
import { getAllYeuThichByUser, ParamsYeuthichSP } from '../types/yeuthich_sp';
import { toggleYeuThichTinInput, toggleYeuThichTinSchema } from '../schema/yeuthichtin.schema';
import { ACTIVATED_VALUE, AN_HIEN_VALUE, DON_HANG_HUY_VALUE, FIXED_SHIPPING_FEE, GiamGiaTheoPhanTram, NOi_BAT_VALUE } from '../config/explain';
import { formattedDataYeuThichTin, ParamsYeuThichTin } from '../types/yeuthichtin';
import { createDanhGiaSpInput, createDanhGiaSpSchema, traLoiDanhGiaSpInput, traLoiDanhGiaSpSchema } from '../schema/danhgia.schema';
import { uploadMiddleware } from '../middleware/upload';
import { sequelize } from '../config/database';
import { covertWebPathToAbsolutePath, processDonHangImg, processFilePath, processSanPhamImgThumanail } from '../ultis/pathprocess';
import { IMG_DanhGia } from '../models/img_dg';
import { cleanUpfiles } from '../ultis/file';
import { GetAllDanhGia, ParamsDanhGiaById, ParamsDanhGiaBySlug, RatingAggregateResult } from '../types/danhgia';
import { allowedUpdateSanPham, createBienTheSp, createThuocTinhSp, GetALLSanPHam, ImgBienThe, ParamsSanPhamBySlug, ThuocTinhMap } from '../types/sanpham';
import { createSanPhamInput, createSanPhamSchema, ParamSanPhamIdInput, sanPhamIdSchema, updateSanPhamInPut, updateSanPhamSchema } from '../schema/sanpham.schema';
import { CartGroupByShop, CartItemWithShop, GetCartItem } from '../types/gio_hang';
import { cartIdInput, cartIdSchema, createCartInput, createCartSchema, updateCartInput, updateCartSchema } from '../schema/cart.schema';
import { generateOrderCode, generateSku, generateSlug } from '../ultis/slugrename';
import { updateUserInput, updateUserSchema } from '../schema/user.schema';
import { DanhMucSidebarParent, DanhMucTreeNode, FilterQuery } from '../types/dm_sp';
import { cancelDonHangInput, cancelDonHangSchema, changeStatusDonHangShopInput, changeStatusDonHangShopSchema, createDonHangInput, createDonHangSchema,  getDonHangDetailInput,  getDonHangDetailSchema, previewDonHangInput, previewDonHangSchema } from '../schema/donhang.schema';
import { BienTheData, createSanPhamData, createShopGroup, DonHangWithChiTiet, GetallDonHang, SanPhamData, ShopGroup, whereConditionLichSuDH } from '../types/don_hang';

import { DonHang } from '../models/donhang';
import { DonHangChiTiet } from '../models/donhangct';


const router = express.Router();

interface CustomError {
	status?: number;//dùng ? vì có khi dữ lieuj lỗi tra về ko có status
	thong_bao?: string;
	message?: string;

}
type MulterFieldFiles = {[filedname: string]: Express.Multer.File[]};
//dia chi
router.get<{},{},{},GetAllDiaChiByUser>('/dia-chi',checkAuth,async(req: Request, res: Response)=>{
	try {
		const userPayload = req.user as AuthUser;
		const {id} = userPayload;
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const offset = (page - 1) * limit;
		const {rows,count} = await Dia_chi_User.findAndCountAll({
			limit: limit,
			offset: offset,
			where: {id_user: id},
			order: [['mac_dinh','DESC'],['createdAt','DESC']]
		});
		const  danhSachDayDu = await  Promise.all(
			rows.map(async(item)=>{
				const addr: Dia_chi_User = item.toJSON();
				const {tinh_name, quan_name,phuong_name} = await  getNameFromCodes(addr.tinh,addr.quan, addr.phuong);
				return {
					id: addr.id,
					ho_ten: addr.ho_ten,
					dien_thoai: addr.dien_thoai,
					dia_chi: addr.dia_chi,
					tinh: tinh_name,
					quan: quan_name,
					phuong: phuong_name,
					mac_dinh: addr.mac_dinh
				}
			})
		)
		const totalPages = Math.ceil(count / limit);
		const result = {
			data: danhSachDayDu,
			pagination: {
				currentPage : page,
				limit: limit,
				totalItem: count,
				totalPages: totalPages
			}
		}
		return res.status(200).json({result});
	} catch (error) {
		const err = error as CustomError
		// console.log(err.message);
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy  tất  cả địa chỉ của 1 user"});
	}
});
router.post<{},{},CreateDiaChiByUser>('/dia-chi',checkAuth,async(req,res)=>{
	try {
		const {ho_ten, dien_thoai, dia_chi, tinh, quan, phuong, mac_dinh} = req.body;
		const userPayload = req.user as AuthUser;
		const {id} = userPayload;
		const hoTenTrim = ho_ten?.trim();
		const dienThoaiTrim = dien_thoai?.trim();
		const diaChiTrim = dia_chi?.trim();
		if(!hoTenTrim || !dienThoaiTrim || !diaChiTrim || !tinh || !quan || !phuong ){
			throw {status: 400, thong_bao: "Bạn chưa nhập đủ thông tin"};
		}
		if(hoTenTrim.length < 5){
			throw {status: 400, thong_bao: "Họ và tên  phải hơn 5 ký tự"};
		}
		if(isNaN(Number(dienThoaiTrim)) || dienThoaiTrim.length < 9){
			throw {status: 400, thong_bao: "Điện thoại phải là số và phải hơn 9 ký tự"};
		}
		const isValid = await validateAddressCodes(tinh,quan,phuong);
		if(!isValid){
			throw {status: 400, thong_bao: "Địa chỉ tỉnh/quận/phường không hợp lệ"}
		}
		// const allowedMacDinh = [0,1];
		// if(!allowedMacDinh.includes(Number(mac_dinh))){
		//     throw {status: 400 , thong_bao: "Giá trị của mặc định không hợp lệ"}
		// }
		const macDinhValue = normalizeBoolean(mac_dinh,"Trường mặc định");
		 if(macDinhValue === 1){
			await Dia_chi_User.update(
				{mac_dinh: 0},
				{where: {
					id_user: id,
				}});
		}
		const newDiaChi = await Dia_chi_User.create({
			id_user: id,
			ho_ten: hoTenTrim,
			dien_thoai: dienThoaiTrim,
			dia_chi: diaChiTrim,
			tinh,
			quan,
			phuong,
			mac_dinh: macDinhValue
		})
		console.log(newDiaChi);
	   
		return res.status(200).json({thong_bao: "Đã  thêm địa chỉ mới thành công"});
	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi thêm địa chỉ mới";
		return res.status(status).json({thong_bao});
	}
})
router.get<DiaChiParams>('/dia-chi/:id',checkAuth,async(req,res)=>{
	try {
		const  {id} = req.params;
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		if(isNaN(Number(id))){
			throw {status: 400 , thong_bao: "ID địa chỉ không hợp lệ"};
		}
		const diaChi = await Dia_chi_User.findOne({
			where: {
				id,
				id_user
			},
			attributes: ['id','id_user','ho_ten','dia_chi','ho_ten','dien_thoai','tinh','quan','phuong','mac_dinh','createdAt']
		});
		if(!diaChi){
			throw {status: 404, thong_bao: "Địa chỉ không tồn tại"};
		}
		res.status(200).json({diaChi, success: true});
	} catch (error) {
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi khi  lấy 1 đia chỉ cụ thể";
		return res.status(status).json({thong_bao});
	}
})
router.put<DiaChiParams,{},CreateDiaChiByUser>('/dia-chi/:id',checkAuth,async(req,res)=>{
	try {
		const {id} = req.params;
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		if(isNaN(Number(id))){
			throw {status: 400 , thong_bao: "ID địa chỉ không hợp lệ"};
		}
		const {ho_ten, dien_thoai, dia_chi, tinh, phuong, quan, mac_dinh} = req.body;
		const diaChi = await Dia_chi_User.findOne({
			where: {
				id,
				id_user
			}
		});
		if(!diaChi){
			throw {status: 404, thong_bao: "Không tìm thấy dịa chỉ để cập nhật"};
		}
		const hoTenTrim = ho_ten?.trim();
		const dienThoaiTrim = dien_thoai?.trim();
		const diaChiTrim = dia_chi?.trim();
		if(!hoTenTrim || !dienThoaiTrim || !diaChiTrim || !tinh || !quan || !phuong ){
			throw {status: 400, thong_bao: "Bạn chưa nhập đủ thông tin"};
		}
		const allowedUpdate: AllowedUpdateDiaChi = {};
		if(hoTenTrim !== undefined && diaChi.ho_ten !== hoTenTrim){
			if(hoTenTrim.length < 5){
				throw {status: 400, thong_bao: "Họ và tên  phải hơn 5 ký tự"};
			}
			allowedUpdate.ho_ten = hoTenTrim;
		}
		if(dienThoaiTrim !== undefined && diaChi.dien_thoai !== dienThoaiTrim){
			if(isNaN(Number(dienThoaiTrim)) || dienThoaiTrim.length < 9){
				throw {status: 400, thong_bao: "Điện thoại phải là số và phải hơn 9 ký tự"};
			}
			allowedUpdate.dien_thoai = dienThoaiTrim;
		}
		if(diaChi.tinh !== tinh || diaChi.phuong !== phuong || diaChi.quan !== quan){
			const isValid = await validateAddressCodes(tinh,quan, phuong);
			if(!isValid){
				throw {status: 400, thong_bao: "Địa chỉ tỉnh/quận/phường không hợp lệ"}
			}
			allowedUpdate.tinh = tinh; 
			allowedUpdate.quan = quan;
			allowedUpdate.phuong = phuong;
		}
		
		const  macDinhValue = normalizeBoolean(mac_dinh);
		if(normalizeBoolean(diaChi.mac_dinh) !== macDinhValue){
			allowedUpdate.mac_dinh = macDinhValue;
			//cập nhật lại cho tất cả thằng khác là mặc định thành false
			if(macDinhValue === 1){
				await Dia_chi_User.update(
					{mac_dinh: 0},
					{where: {
						id_user: diaChi.id_user,
						id: {[Op.not]: id}
					}}
				);
			}
		}
		if(Object.keys(allowedUpdate).length > 0){
			await diaChi.update(allowedUpdate);
			const UpdateDiaChi = diaChi.toJSON();
			return res.status(200).json({thong_bao: ` Đã cập nhật Địa chỉ có id là ${id}`,  success: true});
		}
		const unUpdateDiaChi = diaChi.toJSON();
		return res.status(200).json({thong_bao: `Khoong có cập nhật gì ở dia chỉ có ID là ${id}`, success: true});
	} catch (error) {
		const err= error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khí  cập nhật Địa chỉ";
		return res.status(status).json({thong_bao, success: false})
	}
})
router.delete<DiaChiParams>('/dia-chi/:id',checkAuth,async(req,res)=>{
	try {
		const {id} = req.params;
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id
		const diaChi = await Dia_chi_User.findOne({
			where: {
				id,
				id_user
			}
		});
		if(!diaChi){
			throw {status: 404, thong_bao: "Không tìm thấy địa chỉ để xóa"};
		}
		await diaChi.destroy();
		if(normalizeBoolean(diaChi.mac_dinh) === 1){
			const another = await Dia_chi_User.findOne({
				where: {
					id_user: diaChi.id_user
				},
				order: [['id','ASC']]

			});
			if(another){
				await another.update({mac_dinh: 1})
			}
		}
		return res.status(200).json({thong_bao: "Đã xóa dịa chỉ thành công", success: true});
	} catch (error) {
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi xóa địa chỉ";
		return res.status(status).json({thong_bao, success: false});
	}
})
// yeu thích sp
router.post<{},{},toggleYeuThichInput>('/yeu-thich-sp/toggle',checkAuth,validate(toggleYeuThichSchema),async(req,res)=>{
	try {
		const {id_sp} = req.body;
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const productExisting = await SanPham.findByPk(id_sp);
		if(!productExisting){
			throw {status: 404, thong_bao: "Sản phẩm không tồn tại"};
		}
		const existingYeuThich = await YeuThichSp.findOne({
			where: {
				id_sp: id_sp,
				id_user: id_user
			}
		});
		if(existingYeuThich){
			await existingYeuThich.destroy();
			return res.status(200).json({thong_bao: "Đã bỏ sản phẩm yêu thích", success: true, action: "removed"});
		}else{
			await YeuThichSp.create({
				id_sp,
				id_user
			});
			return res.status(200).json({thong_bao: "Đã thêm vào  sản  phẩm yêu thích", success: true, action: "added"});
		}

	} catch (error) {   
		const err = error as CustomError;
		console.log(err.message);
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy  chủ khi  thêm vào sản phẩm yêu thích";
		return res.status(status).json({thong_bao});
	}
})
router.get<{},{},{},getAllYeuThichByUser>('/yeu-thich-sp',checkAuth,async(req,res)=>{
	try {
		const userPayload = req.user  as AuthUser;
		const id_user = userPayload.id;
		console.log(id_user);
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const offset = (page -1) * limit;
		const {rows, count} = await YeuThichSp.findAndCountAll({
			where: {id_user:id_user},
			limit: limit,
			offset: offset,
			order: [['createdAt','DESC']],
				include: [
					{
						model: SanPham,
						attributes: ['id','ten_sp','so_luong','slug','img','xuat_xu','gia','sale','dvt','id_user','mo_ta'],
						as: 'yeu_thich_sp'
					}
				]
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
		}
		return  res.status(200).json({result, success: true});
	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		return res.status(500).json({thong_bao:"Lỗi máy chủ khi lấy danh  sách yêu  thích"});
	}
});
router.delete<ParamsYeuthichSP>('/yeu-thich/:id',checkAuth,async(req,res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const {id} = req.params;
		if (isNaN(Number(id))) {
			throw { status: 400, thong_bao: "ID không hợp lệ" };
		}
		const ytSP = await  YeuThichSp.findOne({
			where: {
				id: id,
				id_user: id_user
			}
		});        
		if(!ytSP){
			throw {status: 404, thong_bao: "Không tìm thấy sản phẩm yêu  thích để xóa"};
		}
		await ytSP.destroy();
		return res.status(200).json({thong_bao:"Đã xóa sản phẩm yêu thích", success: true});
	} catch (error) {
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi xóa sản phẩm yêu thích"
		return res.status(status).json({thong_bao, success: false});
	}
})
//yêu thích tin
router.post<{},{},toggleYeuThichTinInput>('/yeu-thich-tin/toggle',checkAuth,validate(toggleYeuThichTinSchema),async(req,res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const {id_tin} = req.body;
		const tinTucExsting = await TinTuc.findByPk(id_tin);
		if(!tinTucExsting){
			throw {status: 404, thong_bao: "Tin tức  không tồn tại"};
		}
		const existingYeuThich = await YeuThichTin.findOne({
			where: {
				id_user: id_user,
				id_tin: id_tin
			}
		});
		if(existingYeuThich){
			await existingYeuThich.destroy();
			return res.status(200).json({thong_bao: "Đã bỏ tin tức yêu thích", success: true, action: "remove"});
		}else{
			await YeuThichTin.create({
				id_tin,
				id_user
			})
			return res.status(200).json({thong_bao: "Đã thêm vào tin tức yêu thích", success: true, action: "added"});
		}

	} catch (error) {
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi thêm vào danh sách tin yêu  thích";
		return res.status(status).json({thong_bao, success: false});
	}
})
router.get<{},{},{}, getAllYeuThichByUser>('/yeu-thich-tin',checkAuth, async(req,res)=>{
	try {
		const  userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const page = Number(req.query.page) > 0 ? Number(req.query.limit) : 1;
		const offset = (page - 1) * limit;
		const {rows , count} = await YeuThichTin.findAndCountAll({
			where: {
				id_user: id_user
			},
			limit: limit,
			offset: offset,
			order: [['createdAt','DESC']],
				include: [
					{
						model: TinTuc,
						attributes: ['id','tieu_de','img','id_dm','noi_dung','luot_xem','tac_gia','createdAt'],
						where: {an_hien: AN_HIEN_VALUE},
						as: "tin_tuc",
							include: [
								{model: DanhMucTin,
									attributes: ['id','ten_dm'],
									where: {an_hien: AN_HIEN_VALUE},
									as: "loai_tin_tuc"
								}
							]
					}
				]
		});
		const formattedData = rows.map(item=>{
			const yt = item as unknown as formattedDataYeuThichTin;
			const tinTuc = yt.tin_tuc;
			const loaiTin = tinTuc.loai_tin_tuc;
			return {
				id_yeu_thich: yt.id,
				ngay_thich: yt.createdAt,
				id_tin: tinTuc.id,
				tieu_de: tinTuc.tieu_de,
				img: tinTuc.img,
				noi_dung: tinTuc.noi_dung,
				tac_gia: tinTuc.tac_gia,
				ten_danh_muc: loaiTin.ten_dm,
				id_loai_tin: loaiTin.id

			}
		})
		const totalPages = Math.ceil(count / limit);
		const result = {
			data: formattedData,
			pagination: {
				currentPage: page,
				limit: limit,
				totalItem: count,
				totalPages: totalPages
			}
		};
		return res.status(200).json({result, success: true});
	} catch (error) {
		const err =  error as CustomError;
		console.log(err.message);
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy danh sách tin yêu  thích"})
	}
})
router.delete<ParamsYeuThichTin>('/yeu-thich-tin/:id',checkAuth,async(req,res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const {id} = req.params;
		if (isNaN(Number(id))) {
			throw { status: 400, thong_bao: "ID không hợp lệ" };
		}
		const ytTin = await  YeuThichTin.findOne({
			where: {
				id: id,
				id_user: id_user
			}
		});        
		if(!ytTin){
			throw {status: 404, thong_bao: "Không tìm thấy tin tức yêu  thích để xóa"};
		}
		await ytTin.destroy();
		return res.status(200).json({thong_bao:"Đã xóa tin tức yêu thích", success: true});
	} catch (error) {
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi xóa tin tức yêu thích"
		return res.status(status).json({thong_bao, success: false});
	}
})
//dánh giá
router.post<{},{},createDanhGiaSpInput>('/danh-gia',checkAuth,uploadMiddleware,validate(createDanhGiaSpSchema),async(req,res)=>{
	const t = await sequelize.transaction();
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const files = req.files as MulterFieldFiles;
		const hinhDgFiles = files?.['hinh_dg'] || [];
		const {id_sp,noi_dung, so_sao,tinh_nang, chat_luong} = req.body;
		const newIdSp = await validateForeignKey(id_sp, SanPham, "Sản phẩm");
		const hasPurchased = await DonHang.findOne({
		    where: {
		        id_user: id_user,
		        trang_thai_dh: 4
		    },
		    include: [{
		        model: DonHangChiTiet,
		        as: 'chi_tiet_dh',
		        where: {id_sp: id_sp},
		        required: true
		    }]
		});
		if(!hasPurchased){
		    throw {status: 403, thong_bao: "Bạn cần mua sản phẩm này để viêt đánh giá"
		    }
		}
		const isOwner = await SanPham.count({
			where: {id: id_sp,id_user: id_user}
		})
		if(isOwner > 0){
			throw {status: 400, thong_bao: "Bạn không thể đánh giá sản phẩm của chính minh"};
		}
		const existingDanhGia = await DanhGia.findOne({
			where: {id_user: id_user, id_sp: id_sp}
		});
		if(existingDanhGia){
			throw {status: 409, thong_bao: "Bạn đã đánh giá sản phẩm này rồi"};
		}
		
		const ngay_dg = new Date();
		const newDg = await DanhGia.create({
			id_sp: newIdSp,
			id_user: id_user,
			noi_dung:noi_dung,
			so_sao: so_sao,
			ngay_dg: ngay_dg,
			tinh_nang: tinh_nang,
			chat_luong: chat_luong
		},{transaction: t});
		
		const hinhDgs = hinhDgFiles.map(file=>({
			id_dg: newDg.id,
			url: processFilePath(file.path)
		}));
		
		await IMG_DanhGia.bulkCreate(hinhDgs, {transaction: t});
		//bổ sug thêm cập nhật lại cột so_luong dg và diêm tb đánh giá của bảng sản phẩm
		const avgResult = await DanhGia.findOne({
			where: {id_sp: newDg.id_sp},
			attributes :[
				[Sequelize.fn('AVG', Sequelize.col('so_sao')),'ratingAvg'],
				[Sequelize.fn('COUNT', Sequelize.col('id')), 'ratingCount']//đếm các dòng thỏa where
			],
			raw: true,
			transaction: t
		}) as unknown as RatingAggregateResult;
		const diemTrungBinh = avgResult.ratingAvg ? parseFloat(avgResult.ratingAvg).toFixed(1) : Number(so_sao).toFixed(1);
		const so_luong = avgResult.ratingCount ? Number(avgResult.ratingCount) : 0;
		await SanPham.update({
			diem_tb_dg: diemTrungBinh, so_luong_dg: so_luong
		},{
			where: {id: id_sp},
		transaction: t})
		await t.commit();
		return res.status(200).json({thong_bao: `Đã thêm đánh giá  thành công có ID là ${newDg.id}`, success: true});

	} catch (error) {
		await t.rollback();
		await cleanUpfiles(req);
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi đánh giá sản phẩm";
		return res.status(status).json({thong_bao, success: false})
		}
})
router.get<ParamsDanhGiaById, {}, {},GetAllDanhGia>('/danh-gia/:id', async(req,res)=>{
	try {
		const {id} = req.params;
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const offset = (page -1) * limit;
		// const sanPham = await SanPham.findOne({
		//     where: {slug: slug},
		//     attributes: ['id','ten_sp']
		// });
		const sanPham = await SanPham.findByPk(id,{
			attributes: ['id','ten_sp']
		});
		if(!sanPham){
			throw {status: 404, thong_bao: "Sản phẩm không tồn tại(id không đúng)"};
		}
		const {rows, count} = await DanhGia.findAndCountAll({
			limit: limit,
			offset: offset,
			where: {id_sp: sanPham.id},
			include: [{
				model: User,
				as: 'nguoi_danh_gia',
				attributes: ['ho_ten','hinh'],

			},{
				model: IMG_DanhGia,
				as: 'img_dg',
				attributes: ['url']
			}],
			distinct: true,
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
		};
		return res.status(200).json({result, success : true});
	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi lấy danh sách đánh giá";
		return res.status(status).json({thong_bao, success: false});
	}
})
router.get<{},{},{},GetAllDanhGia>('/shop/danh-gia',checkAuth,async(req,res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_shop = userPayload.id;
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const offset = (page -1 ) * limit;

		const {rows, count} = await DanhGia.findAndCountAll({
			limit:limit,
			offset: offset,
			order: [['createdAt','DESC']],
				include: [
					{
						model: SanPham,
						where: {id_user:id_shop},
						as: 'san_pham',
						attributes: ['id','slug','img','gia','sale','da_ban','createdAt'],
						required: true
					},
					{
						model: User,
						as: 'nguoi_danh_gia',
						attributes: ['hinh','ho_ten']
					},
					{
						model: IMG_DanhGia,
						as: 'img_dg',
						attributes: ['url']
					}
				],
			distinct: true
		});
		const currentPages = Math.ceil(count / limit);
		const result = {
			data: rows,
			pagination: {
				currentPage: page,
				limit: limit,
				totalItem: count,
				currentPages: currentPages
			}
		};
		return res.status(200).json({result, success: true});
	} catch (error) {
		
		const err = error as CustomError;
		console.log(err.message);
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ  khi lấy danh sách đánh giá cho shop";
		return res.status(status).json({thong_bao, success: false});
	}
})
router.put<traLoiDanhGiaSpInput['params'], {}, traLoiDanhGiaSpInput['body']>('/shop/danh-gia/:id',checkAuth,validate(traLoiDanhGiaSpSchema),async(req,res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_shop = userPayload.id;
		const id_dg = req.params.id;
		const {phan_hoi} = req.body;
		const danhGia = await DanhGia.findOne({
			where: {id:id_dg},
			include: [{
				model: SanPham,
				as:'san_pham',
				where: {id_user: id_shop },//chốt chặn nếu sản phẩm đó ko  thuốc về shop thì no ko  trả về
				required: true//inner join
			}]    
		});
		if(!danhGia){
			throw {status: 404, thong_bao: "Dánh giá không tồn tại hoặc bạn không có quyền phản hồi"};
		}
		if(danhGia.phan_hoi){
			throw {status: 409, thong_bao: "Bạn đã phản hồi rồi,không đc phép phản hồi tiếp"};
		}
		await danhGia.update({
			phan_hoi: phan_hoi,
			ngay_ph: new Date()
		});
		return res.status(200).json({thong_bao: "Dã gửi phản hồi thành công", success: true})
	} catch (error) {
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi gửi phản hồi đánh giá";
		return res.status(status).json({thong_bao});
	}
})
/// lấy sản phẩm theo  site
router.get<{},{},{}, GetALLSanPHam>('/san-pham',async(req, res)=>{
	try {
		const limit = Number(req.query.limit) > 0? Number(req.query.limit) : 10;
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const offset = (page -1) * limit;
		const {rows, count} = await SanPham.findAndCountAll({
			limit: limit,
			offset: offset,
			where: {an_hien: AN_HIEN_VALUE},
			order: [['createdAt','DESC']],
				include: [{
					model: SanPhamBienThe,
					as: 'san_pham_bien_the',
					attributes: ['id','id_sp','code','ten_bien_the','gia','so_luong','img','createdAt'],
					order: [['id','DESC']]
				},{
					model: IMG_SanPham,
					as: 'imgs',
					attributes: ['url']
				},{
					model: ThuocTinhSP,
					as: 'thuoctinhsp',
					attributes: ['id_sp','id_tt','gia_tri'],
						include: [{
							model: ThuocTinh,
							as: 'ten_thuoc_tinh',
							attributes: ['id','ten_thuoc_tinh']
						}]
				},{
					model: DM_San_Pham,
					as: 'danh_muc',
					attributes: ['ten_dm']
				},{
					model: ThuongHieu,
					as: 'thuong_hieu',
					attributes: ['ten_th']
				}],
			distinct: true
		});
		
		const totalPages = Math.ceil(count / limit);
		const danhSachSanPham = rows.map((sp)=>{
				const item = sp.toJSON();
				const phanTramGiam = item.sale;
				const GiaGocCha = item.gia;
				const giaDaGiamCha:number = phanTramGiam > 0 ? Math.round(GiaGocCha * (1 - phanTramGiam /100)) : GiaGocCha;
				const bienTheDaXuLy = item.san_pham_bien_the?.map((bt: createBienTheSp)=>{
					const giaGocBienThe = bt.gia;
					const giaDaGiamBienThe = phanTramGiam > 0 ? Math.round(giaGocBienThe * (1 - phanTramGiam/ 100)) : giaGocBienThe;
					return {
						...bt,
						gia_da_giam: giaDaGiamBienThe
					}
				}) || [];
				return {
					...item,
					gia_da_giam: giaDaGiamCha,
					san_pham_bien_the: bienTheDaXuLy,
					thuoctinhsp: item.thuoctinhsp?.map((tt: ThuocTinhMap)=>({
						id: tt.id_tt,
						ten: tt.ten_thuoc_tinh.ten_thuoc_tinh,
						gia_tri: tt.gia_tri
					})) || []
				}
			})
		
		const result = {
			data: danhSachSanPham,
			pagination: {
				currentPage: page,
				limit: limit,
				totalItem: count,
				totalPages: totalPages
			}
		};
		
		return res.status(200).json({result, success: true});
	} catch (error) {
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy danh sách sản phẩm"});
	}
})
router.get<{},{},{}, GetALLSanPHam>('/san-pham-noi-bat',async(req, res)=>{
	try {
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const offset = (page -1 ) * limit;
		const {rows, count} = await SanPham.findAndCountAll({
			where: {noi_bat: NOi_BAT_VALUE, an_hien: AN_HIEN_VALUE},
			order: [['createdAt','DESC']],
			limit: limit,
			offset: offset
		});
		const totalPages = Math.ceil(count/ limit);
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
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy sản phẩm nổi bật", success:false});
	}
	
})
router.get<{},{},{}, GetALLSanPHam>('/san-pham-sale',async(req, res)=>{
	try {
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const offset = (page -1 ) * limit;
		const {rows, count} = await SanPham.findAndCountAll({
			where: {sale: {[Op.gt]: 0}, an_hien: AN_HIEN_VALUE},
			order: [['sale','DESC']],
			limit: limit,
			offset: offset
		});
		const totalPages = Math.ceil(count/ limit);
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
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy sản phẩm nổi bật", success:false});
	}
	
})
router.get<ParamsDanhGiaBySlug,{},{},GetALLSanPHam>('/san-pham/:slug',async(req,res)=>{
	try {
		const {slug} = req.params;
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const offset = (page -1 ) * limit;
		const sanPham = await SanPham.findOne({
			where: {an_hien: AN_HIEN_VALUE, slug: slug},
			include: [{
				model: SanPhamBienThe,
				as: 'san_pham_bien_the',
				attributes: ['id','id_sp','code','ten_bien_the','gia','so_luong','img','createdAt'],
				order: [['createdAt','DESC']]
			},{
				model: IMG_SanPham,
				as: 'imgs',
				attributes: ['url']
			},{
				model: ThuocTinhSP,
				as: 'thuoctinhsp',
				attributes: ['id_sp','id_tt','gia_tri'],
					include: [{
						model: ThuocTinh,
						as: 'ten_thuoc_tinh',
						attributes: ['id','ten_thuoc_tinh']
					}]
			},{
				model: DM_San_Pham,
				as: 'danh_muc',
				attributes: ['ten_dm']
			},{
				model: ThuongHieu,
				as: 'thuong_hieu',
				attributes: ['ten_th']
			}]
		});
		if(!sanPham){
			throw {status: 404, thong_bao: "Sản phẩm không tồn tại nên không thể lấy chi tiết"};
		}
		await sanPham.increment('luot_xem');
		const spItem = sanPham.toJSON();
		spItem.luot_xem += 1;
		const giaDaGiam:number = spItem.sale > 0 ? Math.round(spItem.gia * (1 - spItem.sale / 100)) : spItem.gia;
		const bienTheDaXuLy = spItem.san_pham_bien_the?.map((bt: createBienTheSp)=>({
			...bt,
			gia_da_giam: spItem.sale > 0 ? Math.round(bt.gia * (1 - spItem.sale / 100)) : bt.gia
		})) || [];
		const formattedData = {
			...spItem,
			gia_da_giam: giaDaGiam,
			san_pham_bien_the: bienTheDaXuLy,
			thuoctinhsp: spItem.thuoctinhsp?.map((tt: ThuocTinhMap)=>({
				id: tt.id_tt,
				ten: tt.ten_thuoc_tinh.ten_thuoc_tinh,
				gia_tri: tt.gia_tri
			})) || []

		};
		const {rows, count} = await SanPham.findAndCountAll({
			limit: limit,
			offset: offset,
			where: {an_hien: AN_HIEN_VALUE, id_dm: sanPham.id_dm,
				id: {[Op.not]: sanPham.id}
			},
			attributes: ['id','code','ten_sp','slug','img','gia','sale','so_luong','da_ban','createdAt'],
			order: [['createdAt','DESC']]
		});
		const totalPages = Math.ceil(count/ limit)
		const SanPhamCungLoai = rows.map((sp)=>{
				const item = sp.toJSON();
				const phanTramGiam = item.sale;
				const giaGocCungLoai = item.gia;
				const giaDaGiamCungLoai = phanTramGiam > 0 ? Math.round(giaGocCungLoai * (1 - phanTramGiam/100)): giaGocCungLoai;
				return {
					...item,
					gia_da_giam: giaDaGiamCungLoai
				}
		});
		const result = {
			data: {
				san_pham:formattedData,
				san_pham_cung_loai: SanPhamCungLoai
			},
			pagination: {
				currentPage: page,
				limit: limit,
				totalItem: count,
				totalPages: totalPages
			}
		}
		return res.status(200).json({result, success: true});
	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		const status = err.status || 500;
		const thong_bao = err.thong_bao  || "Lỗi máy chủ khi lấy cchi tiết sản phẩm";
		return res.status(status).json({thong_bao, success: false});
	}
})
//giỏ hàng 
//dã test chạy ngon trên máy của tui
router.get('/get-cart',checkAuth,async(req, res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const cart = await  GioHang.findOne({
			where: {id_user: id_user},
			include: [{
				model: GioHangChiTiet,
				as: 'gh_chi_tiet',
				order: [['createdAt','DESC']],
				include: [
					{
						model: SanPham,
						as: 'san_pham',
						attributes: ['id','ten_sp','slug','img','gia','sale','so_luong','an_hien'],
						include: [{
							model: User,
							as: 'shop',
							attributes: ['id','ho_ten','hinh']
						}]
					},
					{
						model: SanPhamBienThe,
						as: 'bien_the',
						attributes: ['id','ten_bien_the','gia','so_luong','img']
					}
				]
			}]
		});
		if(!cart){
			return res.status(200).json({data: [], success: true});
		}
		const cartItem = cart.toJSON();
		const formattedData: CartItemWithShop[]  = cartItem.gh_chi_tiet.map((item: GetCartItem):CartItemWithShop | null=>{
			//nếu sản phẩm bị xóa thì bỏ quá luôn nhá
			if(!item.san_pham) return null;
			const isBienThe = !!item.bien_the;//tonas tử nếu tồn tại là true chuyên thanhg dạng boolean 
			const sanPhamInfo = isBienThe ? item.bien_the : item.san_pham;
			const basePrice = sanPhamInfo.gia;
			const sale  = item.san_pham.sale ;
			const finalPrice = sale > 0 ? Math.round(basePrice * (1 - sale/100)) : basePrice;
			const totalPrice = finalPrice * item.so_luong;
			return {
				cart_item_id: item.id,
				id_sp: item.id_sp,
				id_bt: isBienThe ? item.bien_the.id : null,
				ten_sp: item.san_pham.ten_sp,
				slug: item.san_pham.slug,
				ten_bien_the: isBienThe ? item.bien_the.ten_bien_the : null,
				img: (isBienThe && item.bien_the.img) ? item.bien_the.img : item.san_pham.img,
				gia_goc: basePrice,
				gia_hien_tai: finalPrice,
				gia_tong: totalPrice,
				sale: sale,
				so_luong: item.so_luong,
				max_so_luong: sanPhamInfo.so_luong,
				is_active: item.san_pham.an_hien !== AN_HIEN_VALUE && sanPhamInfo.so_luong > 0,
				shop_info: item.san_pham.shop
			};
		}).filter((item: GetCartItem) => item !== null);
		
		//gom nhóm theo shop mỗi nhóm một mảng item
		const groupCart: CartGroupByShop[] = [];
		const shopMap = new Map<number, CartGroupByShop>();
		formattedData.forEach((item)=>{
			const shop = item.shop_info;
			if(!shop) return ;//skip nếu lỗi ko có dữ liệu
			const {shop_info, ...itemData} = item;
			if(!shopMap.has(shop.id)){
				//th 1 nếu có chưa có shop  thì tạo mới
				const newShopEntry: CartGroupByShop = {//nó phải giông interface truyền ở treen

					id_shop: shop.id,
					ten_shop: shop.ho_ten,
					hinh_shop: shop.hinh,
					items: [itemData]
				};
				shopMap.set(shop.id, newShopEntry);
				groupCart.push(newShopEntry);
			}else{//dó đã check has nên để dấu ! an toàn
				shopMap.get(shop.id)!.items.push(itemData);
			}

		})
		return res.status(200).json({data: groupCart, success: true});

	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy  giỏ hàng", success: false});
	}
})
//api dùng để thêm vào giỏ hàng
router.post<{},{},createCartInput>('/add-to-cart',checkAuth,validate(createCartSchema), async(req, res)=>{
	const t = await sequelize.transaction();
	try {
		const userPayload = req.user as AuthUser;
		const  id_user = userPayload.id;
		const {id_sp, id_bt, so_luong} = req.body;
		const sanPham = await SanPham.findByPk(id_sp);
		if(!sanPham){
			throw {status: 404, thong_bao: "Sản phẩm không tồn tại"}
		}
		let maxStock = sanPham.so_luong;
		
		if(id_bt){
			const bienThe = await SanPhamBienThe.findOne({
				where: {id: id_bt, id_sp: id_sp}
			});
			if(!bienThe){
				throw {status: 404, thong_bao: "Biến thể không tồn tại"};
			}
			maxStock = bienThe.so_luong;
		}
		if(so_luong > maxStock){
			throw {status: 400, thong_bao:  `Kho chỉ còn ${maxStock} sản phẩm, bạn không thể thêm ${so_luong}`}
		}
		const [cart, created] = await GioHang.findOrCreate({
			where: {id_user: id_user},
			defaults: {id_user: id_user},
			transaction: t
		});
		//findorcreat là  nếu tìm thấy thì lấy cái có sãng không tìm thấy thì tạo cái mới
		// created trả về bolean true false nếu giỏ hàng đc tạo mới false nếu lấy cái có sẵng
		// console.log(created);
		const existingItemCart = await GioHangChiTiet.findOne({
			where: {
				id_gh: cart.id,
				id_sp: id_sp,
				id_bt: id_bt || null,
			}
		});
		if(existingItemCart){
			const newSoLuong = existingItemCart.so_luong + so_luong;
			if(newSoLuong > maxStock){
				throw {status: 400, thong_bao:  `Bạn chỉ có thể thêm tối đa ${maxStock - existingItemCart.so_luong} sản phẩm nữa.`}
			}
			await existingItemCart.increment('so_luong',{by: so_luong, transaction: t});
		}else{
			await GioHangChiTiet.create({
				id_gh: cart.id,
				id_sp: id_sp,
				id_bt: id_bt || null,
				so_luong: so_luong
			},{transaction: t})
		}
		await t.commit();
		return res.status(200).json({thong_bao: "Đã thêm vào giỏ  hàng", success: true});
	} catch (error) {
		const err =error as  CustomError;
		await t.rollback();
		const status  = err.status || 500;
		const  thong_bao = err.thong_bao || "Lỗi máy chủ khi thêm vào giỏ hàng";
		return res.status(status).json({thong_bao, success: false});
	}
})
//dùng cho nút + - nhập để update số lượng
// có roll back vì tránh để sai dữ liệu 1 là làm  2 không làm
router.put<updateCartInput['params'],{},updateCartInput['body']>('/update-cart/:id',checkAuth,validate(updateCartSchema),async(req, res)=>{
	const t = await sequelize.transaction();
	try {
		const userPayload = req.user  as AuthUser;
		const id_user = userPayload.id;
		const id_gh = req.params.id;
		const {so_luong} = req.body;
		const cartItem = await GioHangChiTiet.findOne({
			where: {id: id_gh},
			include: [{
				model: GioHang,
				as: 'gio_hang',
				where: {id_user: id_user}//join để ccheck quyền sở hữu
			},{
				model: SanPham,
				as: 'san_pham',
				attributes: ['id','so_luong']
			},
			{
				model: SanPhamBienThe,
				as: 'bien_the',
				attributes: ['id','so_luong']
			}
		],
		transaction: t});

		if(!cartItem){
			throw {status: 404, thong_bao: "Sản phẩm không có trong giỏ"};
		}
		if(so_luong <= 0){
			await cartItem.destroy({transaction: t});
			await t.commit();
			return res.status(200).json({thong_bao: "Đã xóa sản phẩm khỏi giỏ hàng", success: true});
		}
		let maxStock = 0;
		const itemData = cartItem.toJSON();
		if(itemData.id_bt){
			//th sp bị xóa khi còn trong gio  hàng
			if(!itemData.bien_the){
				await cartItem.destroy({transaction: t});
				await t.commit();
				return res.status(404).json({thong_bao: "Biến thể không tồn tại", success: false});
			}
			maxStock = itemData.bien_the.so_luong;
		}else{
			//check sp thuong
		   
			if(!itemData.san_pham){
				await cartItem.destroy({transaction: t});
				await t.commit();//commit tại đây luôn do  việc xóa là đã xong vì phải xóa mới báo lỗi
				return res.status(404).json({thong_bao: "Sản phẩm không tồn tại", success: false});
			}
			maxStock = itemData.san_pham.so_luong;
		}
		
		if(maxStock < so_luong){
			throw {status: 400, thong_bao: `Kho chỉ còn ${maxStock} sản phẩm. Bạn đang yêu cầu ${so_luong}.`};
		}
		await cartItem.update({so_luong: so_luong},{ transaction: t });
		await t.commit();
		return res.status(200).json({thong_bao: "Đã cập nhật số lượng sản phẩm", success: true});
	} catch (error) {
		await t.rollback();//rollback nếu có lỗi
		const err = error as  CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi update số lượng giỏ hàng";
		return res.status(status).json({thong_bao, success: false});
	}
})
router.delete<cartIdInput>('/delete-cart/:id',checkAuth, validate(cartIdSchema),async(req, res)=>{
	try {
		const userPayload = req.user as  AuthUser;
		const id_user = userPayload.id;
		const id_gh = req.params.id;
		const gioHangCT = await GioHangChiTiet.findOne({
			where: {
				id: id_gh,
			},
			include: [{
				model: GioHang,
				as: 'gio_hang',
				where: {id_user: id_user}
			}]
		});
		if(!gioHangCT){
			throw {status: 404, thong_bao: "Không tìm thấy sản phẩm để xóa"}
		}
		await gioHangCT.destroy();
		return res.status(200).json({thong_bao: "Đã xóa sản phẩm khỏi giỏ hang", success: true});
	} catch (error) {
		const err = error as CustomError;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi xóa sản phẩm khỏi giỏ hàng";
		const status = err.status || 500;
		return res.status(status).json({thong_bao, success: false});
	}
})
router.delete('/delete-all-cart',checkAuth,async(req, res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_user =  userPayload.id;
		const cart = await GioHang.findOne({
				where: {id_user: id_user}
		});
		if(!cart){
			return res.status(200).json({thong_bao: "Giỏ hàng đã trống", success: true});
		}
		const deleteCount = await GioHangChiTiet.destroy({
			where: {id_gh: cart.id}
		});
		if(deleteCount === 0){
			return res.status(200).json({thong_bao: "Giỏ hàng của bạn đang trống, không có gì để xóa", success: true});
		}
		return res.status(200).json({thong_bao: `Đã xóa tất cả  gồm có ${deleteCount} sản phẩm khỏi giỏ hàng`, success: true});

	} catch (error) {
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi xóa toàn bộ giỏ hàng", success: false});

	}
})
//thêm sản phẩm bởi shop
router.get<ParamSanPhamIdInput, {}, {}, GetALLSanPHam>('/shops/:id/san-pham', validate(sanPhamIdSchema), async(req, res)=>{
	try {
		const  id_shop = req.params.id;
		const limit = Number(req.query.limit) > 0? Number(req.query.limit) : 10;
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const offset = (page -1) * limit;
		const {rows, count} = await SanPham.findAndCountAll({
			where: {an_hien: AN_HIEN_VALUE, id_user: id_shop, is_active: ACTIVATED_VALUE},
			order: [['createdAt','DESC']],
			limit: limit,
			offset: offset,
			include: [{
				model: User,
				as:'shop',
				attributes: ['id','ho_ten','hinh']
			}]
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
		};
		return res.status(200).json({result, success: true});
	} catch (error) {
		const err = error as CustomError;
		return res.status(500).json({thong_bao:"Lỗi máy chủ khi lấy sản phẩm theo  shop",success: false});
	}
})
router.get<{},{},{}, GetALLSanPHam>('/shop/san-pham',checkAuth,async(req: Request, res: Response)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;

		const limit = Number(req.query.limit) > 0? Number(req.query.limit) : 10;
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const offset = (page -1) * limit;
		const {rows, count} = await SanPham.findAndCountAll({
			limit: limit,
			where: {id_user: id_user},
			offset: offset,
			order: [['createdAt','DESC']],
				include: [{
					model: SanPhamBienThe,
					as: 'san_pham_bien_the',
					attributes: ['id','id_sp','code','ten_bien_the','gia','so_luong','img','createdAt'],
					order: [['id','DESC']]
				},{
					model: IMG_SanPham,
					as: 'imgs',
					attributes: ['url']
				},{
					model: ThuocTinhSP,
					as: 'thuoctinhsp',
					attributes: ['id_sp','id_tt','gia_tri'],
						include: [{
							model: ThuocTinh,
							as: 'ten_thuoc_tinh',
							attributes: ['id','ten_thuoc_tinh']
						}]
				},{
					model: DM_San_Pham,
					as: 'danh_muc',
					attributes: ['ten_dm']
				},{
					model: ThuongHieu,
					as: 'thuong_hieu',
					attributes: ['ten_th']
				}],
			distinct: true
		});
		
		const totalPages = Math.ceil(count / limit);
		const danhSachSanPham = rows.map((sp)=>{
				const item = sp.toJSON();
				const phanTramGiam = item.sale;
				const  giaDaGiamCha = phanTramGiam > 0 ? Math.round(item.gia * (1 - phanTramGiam / 100)) : item.gia;
				const bienTheDaXuLy = item.san_pham_bien_the?.map((bt: createBienTheSp)=>{
					const giaGocBienThe = bt.gia;
					const giaDaGiamBienThe = phanTramGiam > 0 ? Math.round(giaGocBienThe * (1 - phanTramGiam /100)) : giaGocBienThe;
					return {
						...bt,
						gia_da_giam: giaDaGiamBienThe
					}
				}) || [];
				return {
					...item,
					gia_da_giam: giaDaGiamCha,
					san_pham_bien_the: bienTheDaXuLy,
					thuoctinhsp: item.thuoctinhsp?.map((tt: ThuocTinhMap)=>({
						id: tt.id_tt,
						ten: tt.ten_thuoc_tinh.ten_thuoc_tinh,
						gia_tri: tt.gia_tri
					})) || []
				}
			})
		
		const result = {
			data: danhSachSanPham,
			pagination: {
				currentPage: page,
				limit: limit,
				totalItem: count,
				totalPages: totalPages
			}
		};
		
		return res.status(200).json({result, success: true});
	} catch (error) {
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy danh sách sản phẩm"});
	}
})
router.post<{},{}, createSanPhamInput>('/shop/san-pham',checkAuth,uploadMiddleware, validate(createSanPhamSchema),async(req,res)=>{
    const t = await sequelize.transaction();//tạo cái nay để lưu dũ liệu dồng bộ ở các bnagr
    const createdFile: string[] = [];
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		
		const  {ten_sp, code, gia,sale, so_luong, xuat_xu, dvctn, dvt, mo_ta, an_hien,id_dm, id_th, thuoc_tinh, bien_the} = req.body;
		const files = req.files as MulterFieldFiles;
		const hinhSpFiles = files?.['hinh_sp'] || [];
		const fristHinh = hinhSpFiles?.[0];
		if(!gia || !so_luong){
			throw {status: 400, thong_bao: "Bạn chưa nhập giá với số lượng sản phẩm"}
		}
		
		if(!fristHinh){
			throw {status: 400, thong_bao: "Bạn cần chọn ít nhất 1 hình"};
		}
		const processResult = await processSanPhamImgThumanail(fristHinh.path, fristHinh.filename );
		if(processResult) createdFile.push(processResult);
		const thumnailUrl = processFilePath(processResult);
		// if(!thumnailUrl){
		// 	throw {status: 404, thong_bao:" Lỗi đồng bộ không thể tạo đường dẫn file"};
		// }
		//tạo mã sku tự đông nếu ko thằng nào nhập
		
		let finalCode = code || "";
		if(!finalCode){
			finalCode = generateSku();
		}else{
			if(finalCode.length <= 4){
				throw {status: 400, thong_bao: "Mã sku không đc dưới 4 ký tự"}
			}
		}
		const existing = await SanPham.findOne({
			where: {[Op.or]: [{ten_sp: ten_sp}, {code: finalCode}]}
		});
		if(existing){
			if(existing.ten_sp === ten_sp){
				throw {status: 409, thong_bao: "Tên sản phẩm đã tồn tại mời nhập tên khác"};
			}
			if(existing.code === finalCode){
				throw {status: 409, thong_bao: "Mã Sku đã tồn tại mời nhập cái khác"};
			}
		}
		const slug = generateSlug(ten_sp);
		const existingSlug = await SanPham.findOne({
			where: {slug: slug}
		});
		if(existingSlug){
			throw {status: 409, thong_bao: "Slug đã tồn tại vui lòng điều chỉnh lại tên sản phẩm"};
		}
		const newIdDM = await validateForeignKey(id_dm, DM_San_Pham, "Loại danh mục");
		const newIdTT = await validateForeignKey(id_th, ThuongHieu, "Loại thương hiệu");
		const newSp = await SanPham.create({
			ten_sp: ten_sp,
			code: finalCode,
			slug: slug,
			img: thumnailUrl,
			gia: gia,
			sale: sale,
			so_luong: so_luong,
			xuat_xu: xuat_xu || null,
			dvctn: dvctn ,
			mo_ta: mo_ta,
			dvt: dvt,
			an_hien :an_hien,
			id_user: id_user,
			id_dm: newIdDM,
			id_th: newIdTT
		}, {transaction: t});
		//tạo album ảnh cho sản phẩm
		const hinhSps = hinhSpFiles.map(file=>({
			id_sp: newSp.id,
			url: processFilePath(file.path)
		}));
		//tạo nhiều bản con trong 1 query là bulkCreate
		await IMG_SanPham.bulkCreate(hinhSps, {transaction: t});
		if(thuoc_tinh && thuoc_tinh.length > 0){
			const thuocTinhData = await Promise.all(thuoc_tinh.map(async(item: createThuocTinhSp)=>{
				const newTT = await validateForeignKey(item.id_tt, ThuocTinh, "Loại thuộc tính");
				return {
					id_sp: newSp.id,
					id_tt: newTT,
					gia_tri: item.value,
				}
				
			
			}
			)
		);
			await  ThuocTinhSP.bulkCreate(thuocTinhData, {transaction: t});
		}
		if(bien_the && bien_the.length > 0){
			//th người dùng gửi lên  sku
			const skuSet = new Set<string>();//khoiwr taoj thuoc tinh set de tim gia tri trung lap
			
			for(const item of bien_the){
				if(item.code){
					if(skuSet.has(item.code)){//nó sễ kiemr trả trong sku
						throw {status: 400, thong_bao: "Bạn nhập mã SKU bị trùng lặp"}
					}
					skuSet.add(item.code)
				}
			}
			
			const bienTheData = await Promise.all(
					bien_the.map(async(item: createBienTheSp, index: number)=>{
						const bienTheFileKey = `hinh_bien_the_${index}`;
						const bienTheFiles = files[bienTheFileKey]?.[0];
						const bienTheHinhPath = bienTheFiles ? processFilePath(bienTheFiles) : null;
							let finalCodeBienThe = item.code 
							if(!finalCodeBienThe){
								finalCodeBienThe = generateSku();
							}
							if(!item.gia || !item.so_luong){
								throw {status: 400, thong_bao: "giá và số lượng của biến thể ko đc để trống"}
							}
							const existingBienThe = await SanPhamBienThe.findOne(
								{
									where: {code: finalCodeBienThe}  
								}
							);
							if(existingBienThe){
								throw {status: 409, thong_bao: "mã Sku của biến thể ko đc trùng nhau  vui lòng kiêm trả lại"}
							}
							return {
								id_sp: newSp.id,
								ten_bien_the: item.ten_bien_the,
								code: finalCodeBienThe,
								gia: item.gia,
								so_luong: item.so_luong,
								img: bienTheHinhPath
							};
					}));
			
			await SanPhamBienThe.bulkCreate(bienTheData, {transaction: t});
		}
		await t.commit();
		return res.status(200).json({thong_bao: ` Đã thêm sản phẩm có ID là ${newSp.id}`, success: true});
    } catch (error) {
	   await  t.rollback();//roll bac dọn dẹp
	   await cleanUpfiles(req);
	   if(createdFile.length > 0){
		await Promise.all(createdFile.map(filePath=>{
			return fs.promises.unlink(filePath).catch(err=>{
				console.warn(` Không xóa được file optimized ${filePath}:`, err.message);
				return Promise.resolve();
			})
		}))  
	   }
	   const err = error as CustomError;
	//    console.log(err.message);
	   const status = err.status || 500;
	   const thong_bao = err.thong_bao || "LỖi máy chủ khi thêm sản phẩm mới";
	   return res.status(status).json({thong_bao, success: false});
    }
})
router.get<updateSanPhamInPut['params']>('/shop/san-pham/:id',checkAuth,validate(sanPhamIdSchema),async(req, res)=>{
	try {
		const {id} = req.params;
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const sanPham = await SanPham.findOne(
			{
				where:{id_user: id_user, id: id},
				attributes: ['id','ten_sp','code','slug','img','gia','sale','so_luong','da_ban','luot_xem','diem_tb_dg','so_luong_dg','xuat_xu','dvctn','dvt','noi_bat','mo_ta','an_hien','id_dm','id_th','createdAt'],
					include: [{
						model: SanPhamBienThe,
						as: 'san_pham_bien_the',
						attributes: ['id','id_sp','code','ten_bien_the','gia','so_luong','img','createdAt'],
						order: [['id','DESC']]
					},{
						model: IMG_SanPham,
						as: 'imgs',
						attributes: ['url']
					},{
						model: ThuocTinhSP,
						as: 'thuoctinhsp',
						attributes: ['id_sp','id_tt','gia_tri'],
							include: [{
								model: ThuocTinh,
								as: 'ten_thuoc_tinh',
								attributes: ['id','ten_thuoc_tinh']
							}]
					},{
						model: DM_San_Pham,
						as: 'danh_muc',
						attributes: ['ten_dm']
					},{
						model: ThuongHieu,
						as: 'thuong_hieu',
						attributes: ['ten_th']
					}],
			}
		);
		if(!sanPham){
			throw {status: 404 , thong_bao: "Sản phẩm không tồn tại vui lòng kiểm trả lại"};
		}
		const sanPhamData = sanPham.toJSON();
		const formattedThuocTinh = sanPhamData.thuoctinhsp.map((tt: ThuocTinhMap)=>({
			id: tt.id_tt,
			ten: tt.ten_thuoc_tinh.ten_thuoc_tinh,
			gia_tri: tt.gia_tri	
		}));
	
		const finalResult = {
			...sanPhamData,
			thuoctinhsp: formattedThuocTinh
		}
		return res.status(200).json({data: finalResult, success: true});

	} catch (error) {
		const err = error as  CustomError;
		console.log(err.message);
		const status  = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi lấy chi tiết sản phẩm";
		return res.status(status).json({thong_bao, success: false});
	}
})
router.put<updateSanPhamInPut['params'],{},updateSanPhamInPut['body']>('/shop/san-pham/:id',checkAuth,uploadMiddleware,validate(updateSanPhamSchema),async(req, res)=>{
	const t = await sequelize.transaction();
	const oldFileToDelete: string[] = [];
	const newFileCreated: string[] = [];
	try {
		const {id} = req.params;
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const {ten_sp, code, gia, so_luong, sale,xuat_xu, dvctn, dvt, mo_ta, an_hien, id_dm, id_th, thuoc_tinh,bien_the} = req.body;
		const files = req.files as MulterFieldFiles;
		const hinhSpFiles = files?.['hinh_sp'] || [];
		const fristHinh = hinhSpFiles?.[0];
		const sanPham = await SanPham.findOne({
			where: {id: id, id_user: id_user}
		});
		if(!sanPham){
			throw {status: 404, thong_bao: "Không tìm thấy sản phẩm để cập nhật"};
		}
		const allowedUpdate: allowedUpdateSanPham = {};
		if(sanPham.ten_sp !== ten_sp){
			const existingTensp = await SanPham.findOne({
				where: {
					ten_sp: ten_sp,
					id: {[Op.not]: sanPham.id}
				}
			})
			if(existingTensp){
				throw {status: 409, thong_bao: "Tên sản phẩm đã tồn tại vui  lòng nhập cái khác"};
			}
			allowedUpdate.ten_sp = ten_sp
			const slug = generateSlug(ten_sp);
			const existingSlug = await SanPham.findOne({
				where: {slug: slug,
					id: {[Op.not]: sanPham.id}
				}
			});
			if(existingSlug){
				throw {status: 409, thong_bao: "Vui lòng chỉnh lại  tên sản phẩm do slug đã bị trùng với một sản phẩm khác"};
			}
			allowedUpdate.slug = slug;
		}
		let finalCode = code;
		if(sanPham.code !== finalCode){
			if(!finalCode){
				finalCode = generateSku();
			}
			const existingCode = await SanPham.findOne({
				where: {code: finalCode,
					id: {[Op.not]: sanPham.id}
				}
			});
			if(existingCode){
				throw {status: 409, thong_bao: "Sku sản phẩm đã tồn tại vui lòng nhập cái khác"};
			}
			allowedUpdate.code = finalCode;
		}
		if(sanPham.gia !== gia){
			if(!gia){
				throw {status: 400, thong_bao: "Bạn vui lòng nhập giá cho sản phẩm"};
			}
			allowedUpdate.gia = gia;
		}
		if(sanPham.sale !== sale && sale !== undefined){
			allowedUpdate.sale = sale
		}
		if(sanPham.so_luong !== so_luong){
			if(!so_luong){
				throw {status: 409, thong_bao: "Bạn vui long nhập số lượng của sản phẩm"};
			}
			allowedUpdate.so_luong = so_luong;
		}
		if(sanPham.xuat_xu !== xuat_xu && xuat_xu !== undefined){
			allowedUpdate.xuat_xu = xuat_xu
		}
		if(sanPham.dvctn !== dvctn && dvctn !== undefined){
			allowedUpdate.dvctn = dvctn;
		}
		if(sanPham.dvt !== dvt ){
			allowedUpdate.dvt = dvt;
		}
		if(sanPham.mo_ta !== mo_ta){
			allowedUpdate.mo_ta = mo_ta;
		}
		if(sanPham.id_dm !== id_dm){
			const newidDm = await validateForeignKey(id_dm, DM_San_Pham,"Loại danh mục");
			allowedUpdate.id_dm = newidDm;
		}
		if(sanPham.id_th !== id_th){
			const newIdTH = await validateForeignKey(id_th, ThuongHieu, "Loại thương hiệu");
			allowedUpdate.id_th = newIdTH;
		}
		if(normalizeBoolean(sanPham.an_hien) !== an_hien){
			allowedUpdate.an_hien = an_hien;
		}
		if(fristHinh){
			const processResult = await processSanPhamImgThumanail(fristHinh.path, fristHinh.filename);
			if(processResult) newFileCreated.push(processResult);
			const thumnailUrl = processFilePath(processResult);
			// if(!thumnailUrl){
			// 	throw {status: 400, thong_bao: "Lỗi đồng bộ không thể tạo đường dẫn file"};
			// }
			allowedUpdate.img = thumnailUrl;
			if(sanPham.img){
				const oldAbsolutePath = covertWebPathToAbsolutePath(sanPham.img)
				oldFileToDelete.push(oldAbsolutePath);
			}
		}
		if(Object.keys(allowedUpdate).length > 0){
			await sanPham.update(allowedUpdate, {transaction: t});	
		}
		if(hinhSpFiles.length > 0 ){
			const currentImg = await IMG_SanPham.findAll({
				where: {id_sp: sanPham.id},
				attributes: ['url']
			});
			currentImg.forEach(img=>{
				const absolutePath = covertWebPathToAbsolutePath(img.url);
				oldFileToDelete.push(absolutePath);
			});
			await IMG_SanPham.destroy({ where: { id_sp: sanPham.id }, transaction: t});
			const hinhSps = hinhSpFiles.map(file=>({
				id_sp: sanPham.id,
				url: processFilePath(file.path)
			}));
			await IMG_SanPham.bulkCreate(hinhSps, {transaction: t});
		}
		if(thuoc_tinh){
			await ThuocTinhSP.destroy({where: {id_sp: sanPham.id}, transaction: t});
			if(thuoc_tinh.length > 0){
				const thuocTinhData = await Promise.all(thuoc_tinh.map(async(item: createThuocTinhSp)=>{
					const newTT = await validateForeignKey(item.id_tt, ThuocTinh, "Loại thuộc tính");
					return {
						id_sp: sanPham.id,
						id_tt: newTT,
						gia_tri: item.value
					}
				}));
				await ThuocTinhSP.bulkCreate(thuocTinhData, {transaction: t});
			}
		}
		if(bien_the){
			const CurrentBienThe = await SanPhamBienThe.findAll({
				where: {id_sp: sanPham.id},
				attributes: ['id','img']
			});
			//tạo mản chứ id cũ
			const currentId = CurrentBienThe.map(v=> v.id);
			//tạo mảng để lưu id mà fe gửi lên để biết cái nào không bị xóa;
			const inputId : number[] = [];
			for(const [index, item] of bien_the.entries()){
				const bienTheFileKey = `hinh_bien_the_${index}`;
				const bienTheFile = files[bienTheFileKey]?.[0];
				let finalCodeBienThe = item.code;
				if(!finalCodeBienThe){
					finalCodeBienThe = generateSku();
				}
				if(!item.gia || !item.so_luong){
					throw {status: 400, thong_bao: "Giá và số lượng của biến thể không đc để trống"};
				}
				
				let finalImg :string|null = "";
				if(item.id){
					//th1 cập nhật trường có gửi id
					inputId.push(item.id);
					//tìm curent biến thế có id trung vioiws item.id
					const bienTheDB = CurrentBienThe.find(v=> v.id == item.id);
					const existingBienThe = await  SanPhamBienThe.findOne({
						where:{ 
						code: finalCodeBienThe,
						id: {[Op.not]: item.id}}

					})
					if(existingBienThe){
						throw {status: 409, thong_bao: "Mã Sku của biến thể đã tồn tại mới nhập cái khác"};
					}
					if(bienTheDB){
						finalImg = bienTheDB.img;
						//nếu có ảnh mới thì thay ảnh cũ và xóa ảnh file cũ trong public
						if(bienTheFile){
							finalImg = processFilePath(bienTheFile);
							if(bienTheDB.img){
								oldFileToDelete.push(covertWebPathToAbsolutePath(bienTheDB.img));
							}
						}
						
					}
					await SanPhamBienThe.update({
						ten_bien_the: item.ten_bien_the,
						code: finalCodeBienThe,
						gia: item.gia,
						so_luong: item.so_luong,
						img: finalImg
					},{where: {id: item.id},transaction: t});
				}else{
					const existingBienThe = await  SanPhamBienThe.findOne({
						where:{ 
						code: finalCodeBienThe}


					})
					if(existingBienThe){
						throw {status: 409, thong_bao: "Mã Sku của biến thể đã tồn tại mới nhập cái khác"};
					}
					//th 2 tạo mới khi fe không gửi id;
					
					if(bienTheFile){
						finalImg = bienTheFile ? processFilePath(bienTheFile) : null;
					}
					await SanPhamBienThe.create({
						id_sp: sanPham.id,
						ten_bien_the: item.ten_bien_the,
						code: finalCodeBienThe,
						gia: item.gia,
						so_luong: item.so_luong,
						img: finalImg
						
					},{transaction: t});

				}
			}
			const idToDelete = currentId.filter(dbId => !inputId.includes(dbId))//lọc những id có trong db nhưng ko có trong danh sách fe gửi lên
			if(idToDelete.length > 0){
				// kiêm trả xem  biên thể đó có trong dh không
				const usedVariant = await DonHangChiTiet.findOne({
                    where: { 
                        id_bt: idToDelete // Sequelize tự hiểu là tìm id_bt IN [idsToDelete]
                    }
                });
				if(usedVariant){
					throw {status: 400, thong_bao: "Không thể xóa biến thể do đã phát sinh đơn hàng, vui lòng chỉnh số lượng về 0 để 0 bán biế thể"}
				}
				//lấy danh  sách các biên thể sap xóa để dọn rác
				const bienTheToDelete = CurrentBienThe.filter(v=> idToDelete.includes(v.id));
				bienTheToDelete.forEach(v=>{
					if(v.img){
						oldFileToDelete.push(covertWebPathToAbsolutePath(v.img));
					}
				})
				await SanPhamBienThe.destroy({
					where: {id: idToDelete},
					transaction: t
				})
			}
		}
		await t.commit();
		if(oldFileToDelete.length > 0){
			await Promise.all(oldFileToDelete.map(path=>{
				return fs.promises.unlink(path).catch(error=>{
					console.warn("Lỗi xóa file cũ:", error.message)
					return Promise.resolve();
				});
			}));
			
		}	
		return res.status(200).json({thong_bao: "Cập nhật sản phẩm thành công",success: true});

	} catch (error) {
		await t.rollback();
		await cleanUpfiles(req);
		if(newFileCreated.length > 0){
			await Promise.all(newFileCreated.map(path=>{
				return fs.promises.unlink(path).catch(error=>{
					console.warn("Lỗi xóa file mới:", error.message)
					return Promise.resolve();
				})
			}))
		}
		
		const err = error as CustomError;
		// console.log(err.message);
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi cập nhật sản phẩm";
		return res.status(status).json({thong_bao, success: false});
	}
})
router.delete<updateSanPhamInPut['params']>('/shop/san-pham/:id',checkAuth,validate(sanPhamIdSchema),async(req,res)=>{
	const t = await sequelize.transaction();
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const {id} = req.params;
		const sanPham = await SanPham.findOne({
			where: {id_user: id_user, id: id},
			include: [{
				model: SanPhamBienThe,
				as: 'san_pham_bien_the',
				attributes: ['img']
			},{
				model: IMG_SanPham,
				as: 'imgs',
				attributes: ['url']
			}]
		}
		);
		if(!sanPham){
			throw {status: 404 ,thong_bao: "ID sản phẩm không tồn tại nên không thể xóa  sản phẩm"};
		}
		//nếu sản phẩm phất sinh trong dh thì ko đc xóa
		const isSold = await DonHangChiTiet.findOne({
            where: { id_sp: id }
        });

        if (isSold) {
            // Ném lỗi 400 (Bad Request) để Frontend hiện thông báo đỏ
            throw { 
                status: 400, 
                thong_bao: "Sản phẩm này đã phát sinh đơn hàng nên KHÔNG THỂ XÓA. Vui lòng chuyển trạng thái sang 'Ẩn' hoặc 'Ngừng kinh doanh'." 
            };
        }
		const sanPhamData = sanPham.toJSON();
		const fileToUnlink: string[] = [];
		if(sanPhamData.img){
			fileToUnlink.push(sanPham.img);
		}
		if(sanPhamData.san_pham_bien_the && sanPhamData.san_pham_bien_the.length > 0){
			sanPhamData.san_pham_bien_the.map((bt: ImgBienThe)=>{
				if(bt.img){
					fileToUnlink.push(bt.img);
				}
			})
		}
		if(sanPhamData.imgs && sanPhamData.imgs.length > 0){
			sanPhamData.imgs.map((img: IMG_SanPham)=>{
				if(img.url){
					fileToUnlink.push(img.url);
				}
			})
		}
		await ThuocTinhSP.destroy({where: {id_sp: sanPham.id}, transaction: t});
		await IMG_SanPham.destroy({where: {id_sp: sanPham.id}, transaction: t});
		await SanPhamBienThe.destroy({where: {id_sp: sanPham.id}, transaction: t});
		await sanPham.destroy({transaction: t});
		await t.commit();
		if(fileToUnlink.length > 0){
			await Promise.all(
				fileToUnlink.map((filePath)=>{
					const absolutePath = covertWebPathToAbsolutePath(filePath);
					return fs.promises.unlink(absolutePath).catch((error)=>{
						console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);
						return Promise.resolve();
						
					});
				})
			);
		}
		return res.status(200).json({thong_bao: "Đã xóa thành công sản phẩm", success: true});
	} catch (error) {
		await t.rollback();
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lôi máy chủ khi xóa sản phẩm";
		return res.status(status).json({thong_bao, success: false});
	}
})
router.get<{}, {}, {}, GetallDonHang>('/shop/don-hang',checkAuth,async(req , res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_shop = userPayload.id;
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const offset = (page -1) * limit;
		const whereCondition: WhereOptions<DonHang> = {
			id_shop: id_shop
		}
		if(req.query.trang_thai !== null && req.query.trang_thai !== undefined){
			const trang_thai = Number(req.query.trang_thai);
			if(!isNaN(trang_thai)){
				whereCondition.trang_thai_dh = trang_thai
			}
		}
		const {rows, count} = await DonHang.findAndCountAll({
			limit: limit,
			offset: offset,
			order: [['createdAt','DESC']],
			where: whereCondition,
			include: [{
				model: DonHangChiTiet,
				as: 'chi_tiet_dh',	
				attributes: ['id','id_dh','id_sp','id_bt','ten_sp','img','so_luong','gia','thanh_tien']
			},{
				model: User,
				as: 'nguoi_mua',
				attributes: ['ho_ten','id','hinh']
			},{
				model: PTTT,
				as: 'pttt',
				attributes: ['ten_pt','code']
			}],
			distinct: true
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
		return res.status(200).json({result, success: true});
	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi xem lịch sử đơn hàng", success: false});
	}
})
router.get<getDonHangDetailInput>('/shop/don-hang/:id',checkAuth,validate(getDonHangDetailSchema),async(req, res)=>{
	try {
		const {id} = req.params;
		const userPayload = req.user as AuthUser;
		const id_shop = userPayload.id;

		const donHang = await DonHang.findOne({
			where: {
				id: id,
				id_shop: id_shop
			},
			include: [{
				model: DonHangChiTiet,
				as: 'chi_tiet_dh',
				attributes: ['id','ten_sp','img','so_luong','gia','thanh_tien','id_bt'],
			},{
				model: User,
				as:'shop',
				attributes: ['id','ho_ten','hinh']
			},{
                model: User,
                as: 'nguoi_mua',
                attributes: ['id','ho_ten','hinh']
            },{
				model: PTTT,
				as: 'pttt',
				attributes: ['ten_pt','code']
			},{
				model: Voucher,
				as: 'voucher',
				attributes: ['ten_km','code','loai_km','gia_tri_giam'],
				required: false//left join có voucher thì hiện ko thì thôi
			}]
		});
		if(!donHang){
			throw {status: 404, thong_bao: "Đơn hàng không tòn tại"};
		}
		return res.status(200).json({data: donHang, success: true});
	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		const status = err.status ||500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi xem chi tiết đơn hàng"
		return res.status(status).json({thong_bao, success: false});
	}
})
router.put<changeStatusDonHangShopInput['params'], {}, changeStatusDonHangShopInput['body']>('/shop/huy-don-hang/:id',checkAuth,validate(changeStatusDonHangShopSchema),async(req, res)=>{
	const t = await sequelize.transaction();
	try {
		const {id} = req.params;
		const userPayload = req.user as AuthUser;
		const id_shop = userPayload.id;
		const {ly_do} = req.body;
		
		const donHang  = await  DonHang.findOne({
			where: {id: id, id_shop: id_shop},
			include: [{
				model: DonHangChiTiet,
				as: 'chi_tiet_dh'
			}],
			transaction: t
		})
		if(!donHang){
			throw {status: 404, thong_bao: "Đơn hàng không tồn tại"}
		}
		//shop cchir đc hủy đơn hàng ở trạng thái  chờ xác nhận
		if(donHang.trang_thai_dh !== 0){
			throw {status: 400, thong_bao: "Chỉ được  hủy đơn khi đang chờ xác nhận"}
		}
		donHang.trang_thai_dh = DON_HANG_HUY_VALUE;
		donHang.ly_do_huy = `Shop hủy ${ly_do}`;
		await donHang.save({transaction: t});
		const donHangItem = donHang as DonHangWithChiTiet;
		if(donHangItem.chi_tiet_dh){
			for(const item of donHangItem.chi_tiet_dh){
				
				if(item.id_bt){
					await SanPhamBienThe.increment('so_luong',{ by: item.so_luong, where: {id: item.id_bt}, transaction: t});
				}else{
					await SanPham.increment('so_luong', {by: item.so_luong, where: {id: item.id_sp}, transaction: t});
				}
			}
			if(donHang.id_km){
                await KhuyenMaiUser.destroy({
                    where: {
                        id_km: donHang.id_km,
                        id_dh: donHang.id,
                        id_user: donHang.id_user
                    },
                    transaction: t
                })
                //cộng lại số lượng voucher cho hệ thông
                await Voucher.increment('so_luong',{
                    by: 1,
                    where: {id: donHang.id_km},
                    transaction: t
                })
                // trừ đi số lượng da dung 
                await Voucher.decrement('da_dung',{
                    by: 1,
                    where: {id: donHang.id_km},
                    transaction:t 
                });
            }
		}
		await t.commit();
		return res.status(200).json({thong_bao: "Đã hủy đơn hàng thành công", success: true});

	} catch (error) {
		await t.rollback();
		const err = error as CustomError;
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi  hủy đơn hàng";
		return res.status(status).json({thong_bao, success:false});
	}
})
router.get('/danh-muc-san-pham/select',checkAuth,async(req, res)=>{
	try {
		const data = await DM_San_Pham.findAll({
			where: {an_hien: AN_HIEN_VALUE},
			order: [['createdAt','DESC']],
			attributes: ['id','ten_dm']
		})
		return res.status(200).json({data, success: true});
	} catch (error) {
		return res.status(500).json({thong_bao: "Lỗi máy chu khi lấy danh sách danh mục", success: false});
	}
})
router.get('/thuong-hieu-san-pham/select',checkAuth, async(req , res)=>{
	try {
		const data = await ThuongHieu.findAll({
			where: {an_hien: AN_HIEN_VALUE},
			order: [['createdAt','DESC']],
			attributes: ['id','ten_th']
		})
		return res.status(200).json({data, success: true});
	} catch (error) {
		return res.status(200).json({thong_bao: "Lỗi máy chủ khi lấy danh sách thương hiệu", success: false})
	}
})
router.get('/thuoc-tinh-san-pham/select',checkAuth, async(req, res)=>{
	try {
		const data = await ThuocTinh.findAll({
			order: [['id','DESC']],
		})
		return res.status(200).json({data, success: true});
	} catch (error) {
		return res.status(200).json({thong_bao: "Lỗi máy chủ khi lấy danh sách thương hiệu", success: false})
	}
})
// cập nhạt thông tin tài khaonr
router.get('/lay-thong-tin-tk',checkAuth,async(req, res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const taiKhoan = await User.findByPk(id_user,{
			attributes: ['id','ho_ten','hinh','dien_thoai','createdAt']
		});
		if(!taiKhoan){
			throw {status: 404, thong_bao: "Tài khoản không tồn tại"};
		}
		return res.status(200).json({taiKhoan, success: true});
	} catch (error) {
		return res.status(500).json({thong_bao: "lỗi máy chủ khi lấy tài khoản"})
	}
})
router.patch<{}, {}, updateUserInput>('/cap-nhat-thong-tin-tk',checkAuth,uploadMiddleware,validate(updateUserSchema), async(req, res)=>{
	try {
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const {ho_ten, dien_thoai} = req.body
		const files = req.files as MulterFieldFiles;
		const newHinh = files?.['hinh_user']?.[0]?.path;
		const oldFileToDelete: string[] = [];
		const allowedUpdate: Partial<User> = {};
		const taiKhoan = await User.findByPk(id_user);
		if(!taiKhoan){
			throw {status: 404, thong_bao: "tài khoản không tồn tại"};
		}
		if(taiKhoan.ho_ten !== ho_ten){
			allowedUpdate.ho_ten = ho_ten;
		}
		if(taiKhoan.dien_thoai !== dien_thoai){
			allowedUpdate.dien_thoai = dien_thoai;
		}
		if(newHinh){
			allowedUpdate.hinh = processFilePath(newHinh);
			if(taiKhoan.hinh){
				const oldAbsolutePath = covertWebPathToAbsolutePath(taiKhoan.hinh);
				oldFileToDelete.push(oldAbsolutePath);
			}
		}
		if(Object.keys(allowedUpdate).length > 0){
			await  taiKhoan.update(allowedUpdate);
			await Promise.all(oldFileToDelete.map((filePath)=>{
				return fs.promises.unlink(filePath).catch((error)=>{
					console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);   
					return Promise.resolve();
				})
			}))
		}
		return res.status(200).json({thong_bao: "Đã cập nhật thông tin tài khoản", success: true});
		
	} catch (error) {
		const err = error as CustomError;
		await cleanUpfiles(req);
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi cập nhật tài khoản";
		return res.status(status).json({thong_bao, success: false});
	}
})


//đăng ký shop
//danh muc sp
router.get('/danh-muc-parent',async(req, res)=>{
	try {
		const data = await DM_San_Pham.findAll({
			where: {parent_id: null, an_hien: AN_HIEN_VALUE},
			order: [['stt','ASC']],
			attributes: ['id','ten_dm','img','slug','stt', 'parent_id']
		});
		return res.status(200).json({data, success: true});
	} catch (error) {
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy các danh mục cha"});
	}
})

router.get('/danh-muc-phan-cap',async(req , res)=>{
	try {
		const allDanhMuc = await DM_San_Pham.findAll({
			where: {an_hien: AN_HIEN_VALUE},
			attributes: ['id','ten_dm','parent_id','slug'],
			order: [['ten_dm','ASC']],
			raw: true
		}) as unknown as DanhMucTreeNode[];
		//thuật toán ghép cây
		//truyên id vào có gia trị là danhmuctreenode
		const danhMucMap = new Map<number, DanhMucTreeNode>();
		const rootNodes: DanhMucTreeNode[] = [];
		//tạo node cho danh mục lưu vào map
		allDanhMuc.forEach((cat)=>{
			//jhoiwr tạo mảng chirdern rỗng cho từng thằng
			danhMucMap.set(cat.id, {...cat, children: []});
		})
		//duyêt đẻ ghép con vào cha
		allDanhMuc.forEach((cat)=>{
			const node = danhMucMap.get(cat.id)//lấy node hiện tại ra
			if(node){
				//nếu có parent_id và tìm thấy cha trong map
				if(cat.parent_id && danhMucMap.has(cat.parent_id)){
					const parentNode = danhMucMap.get(cat.parent_id);//lấy ra thằng cha
					//nhet thằng con vào cha
					parentNode?.children.push(node);

				}else{
					// ko có parent id haocwj có parent id nhưng ko tìm thấy cha ccho làm cha
					rootNodes.push(node);
				}
			}
		});
		return res.status(200).json({data: rootNodes, success: true});

	} catch (error) {
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy danh mục phân cấp", success: false});
	}
})

router.get<ParamsSanPhamBySlug, {}, {}, FilterQuery>('/danh-muc-san-pham/filter/:slug',async(req, res)=>{
	try {
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const  {slug} = req.params;
		const {id_ths,min_price,max_price, rating, is_on_sale,is_stock, sort} = req.query
		
		const offset = (page -1) * limit;
		const CurrentDanhMuc = await DM_San_Pham.findOne({
			where: {slug: slug, an_hien: AN_HIEN_VALUE}
		});
		
		if(!CurrentDanhMuc){
			 throw {status: 404, thong_bao: "Danh mục sản phẩm không tồn tại"};
		}
		const danhMucid = CurrentDanhMuc.id;
		let parentDanhMuc:DanhMucSidebarParent| null = null;
		let listDanhMucToquery: number[] = [];//danh sách id để query sản phảm
		if(CurrentDanhMuc.parent_id && CurrentDanhMuc.parent_id !== 0){
			//th 1 chọn danh mục con phải tìm danh mục cha để hiển thị ở sidebar
			const result = await DM_San_Pham.findByPk(CurrentDanhMuc.parent_id,{
				include:[{
					model: DM_San_Pham,
					as: 'children',
					attributes: ['id','ten_dm','slug'],
					where: {an_hien: AN_HIEN_VALUE},
					required: false
				}],
				attributes: ['id','ten_dm','slug']
			});
			parentDanhMuc = result?.toJSON() as DanhMucSidebarParent;
			listDanhMucToquery = [danhMucid]//chỉ lấy đúng sản phẩm dm con này
		}else{//th2 chọn danh mục cha tìm caccs con của nó
			const result = await DM_San_Pham.findByPk(danhMucid,{
				include: [{
					model: DM_San_Pham,
					as: 'children',
					attributes: ['id','ten_dm','slug'],
					where: {an_hien: AN_HIEN_VALUE},
					required: false
				}],
				attributes: ['id','ten_dm','slug']
			})
			parentDanhMuc = result?.toJSON() as DanhMucSidebarParent
			if(parentDanhMuc && parentDanhMuc.children.length > 0 && parentDanhMuc.children ){
				listDanhMucToquery = parentDanhMuc.children.map(c => c.id);
			}
			listDanhMucToquery.push(danhMucid);//thêm cả dm cha vò nếu cha cũng chưa  sản phẩm
		}
		const sidebarData = parentDanhMuc ? {
			parent: {
				id: parentDanhMuc.id,
				ten_dm: parentDanhMuc.ten_dm,
				slug: parentDanhMuc.slug,
			},
			children : parentDanhMuc.children || []
		} : null
		const whereClause: WhereOptions = {
			an_hien: AN_HIEN_VALUE,
			id_dm: {[Op.in]: listDanhMucToquery}
		}
		if(id_ths){
			//chuyển chuỗi vd 1,2,3 thành mang [1,2,3]
			const listThuongHieu = id_ths.split(',').map(id=>Number(id)).filter(id=>!isNaN(id) && id > 0);//lọc Nan và số 0
			if(listThuongHieu.length > 0){
				whereClause.id_th = {[Op.in]: listThuongHieu};
			}
		}
		if(is_on_sale === 'true' || is_on_sale === '1'){
			whereClause.sale = {[Op.gt]: 0};//sale > 0
		}
		if(is_stock === 'true' || is_stock === '1'){
			whereClause.so_luong = {[Op.gt]: 0};
		}
		if(min_price || max_price){//nếu giá trị max hoặc min tồn tại
			const  min =  Number(min_price) || 0;
			const max = Number(max_price) || 9999999999;// mặc dịnh 9 tỷ nếu max ko có giá trị
			// Sử dụng Sequelize.literal để viết biểu thức toán học trong WHERE
			whereClause[Op.and as any] = [
                literal(`(gia * (1 - COALESCE(sale, 0) / 100)) BETWEEN ${min} AND ${max}`)
            ];

		}
		if(rating){
			const minRating = Number(rating);
			if(!isNaN(minRating)){// là số thì vô đay
				whereClause.diem_tb_dg = {[Op.gte]: minRating}

			}
		}
		let orderClause: Order = [['createdAt', 'DESC']]; // Mặc định: Mới nhất
		const realPriceLiteral = literal('(gia * (1 - COALESCE(sale, 0) / 100))');//lọc theo  giá giảm  gần nhất
        switch (sort) {
            case 'price_asc': orderClause = [[realPriceLiteral, 'ASC']]; break; // Giá thấp -> cao
            case 'price_desc': orderClause = [[realPriceLiteral, 'DESC']]; break; // Giá cao -> thấp
            case 'newest': orderClause = [['createdAt', 'DESC']]; break;
            case 'bestseller': orderClause = [['da_ban', 'DESC']]; break; // Bán chạy (cần cột da_ban)
            case 'popular': orderClause = [['luot_xem', 'DESC']]; break; // Phổ biến (theo lượt xem)
        }
		const {rows, count} = await SanPham.findAndCountAll({
			where: whereClause,
			order: orderClause,
			limit: limit,
			offset: offset,
			attributes: ['id','ten_sp','gia','sale','img','da_ban','luot_xem', 'diem_tb_dg','so_luong_dg','id_th', 'id_dm', 'createdAt']
		});
		const danhsachSanPham = rows.map((sp)=>{
			const item = sp.toJSON();
			const gia_da_giam = item.sale ? item.gia * (1 - item.sale / 100) : item.gia;
			return {
				...item,
				gia_da_giam: gia_da_giam

			}
		});
		const totalPages = Math.ceil(count / limit);
		return res.status(200).json({
			data: {
				current_danhmuc_id: danhMucid,//dữ liệu để fe biết cái nào tô đỏ
				sidebar: sidebarData,// cấu trúc cho cây sidebara
				product: danhsachSanPham,// list sp
				pagination: {
					currentPage: page,
					limit: limit,
					totalItem: count,
					totalPages: totalPages
				}
			},
			success: true
		});

	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi lọc sản phẩm";
		return res.status(status).json({thong_bao, success: false})
		
	}
})
// 
router.post<{},{}, previewDonHangInput>('/xem-truoc-don-hang',checkAuth,validate(previewDonHangSchema),async(req, res)=>{
	try {
		const {items, id_km} = req.body
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const sanPhamId = items.map((i) => i.id_sp);
		const bienTheId = items.filter((i)=> i.id_bt).map((i)=> i.id_bt);
		//query sản phẩm kèm thông tin shop
		const result = await SanPham.findAll({
			where: {
				id: {[Op.in]: sanPhamId},
				an_hien: AN_HIEN_VALUE
			},
			attributes: ['id','ten_sp','gia','sale','so_luong','id_user','img','slug'],
			include: [{
				model: User,
				as: 'shop',
				attributes: ['id','ho_ten','hinh']
			}]
		}) ;
		const sanPhamDB: SanPhamData[] = result.map(item =>
			item.get({ plain: true }) as SanPhamData
		);
		//query tới biến thể nếu có
		let bienTheDB: BienTheData[] = [];
		if(bienTheId.length > 0){
			bienTheDB = await SanPhamBienThe.findAll({
				where: {id: {[Op.in]: bienTheId}},
				attributes: ['id','id_sp','ten_bien_the','gia','so_luong','img'],
				include: [{
					model: SanPham,
					as: 'san_pham',
					where: {an_hien: AN_HIEN_VALUE}
				}]
			})
		}
		//tạo map để tra cứu nhanh
		const sanPhamMap = new Map<number, SanPhamData>();
		sanPhamDB.forEach(sp => sanPhamMap.set(sp.id, sp));
		const bienTheMap = new Map<number, BienTheData>();
		bienTheDB.forEach(bt => bienTheMap.set(bt.id, bt));
		// gom shop tính tiền hàng
		const shopGroups = new Map<number, ShopGroup>();
		let  totalMerchadiseValue = 0;//tổng tiền hàng toàn bộ chưa  tinh ship và voucher
		for(const  item of items){
			const sanPham = sanPhamMap.get(item.id_sp);
			if(!sanPham) continue;//nếu sản phẩm 0 tồn tại thì bỏ qua
			let finalName = sanPham.ten_sp;
			let finalImg = sanPham.img;
			let basePrice = sanPham.gia;
			let  stockAvailable = sanPham.so_luong;
			//neews item có id_bt lấy thông tin từ biến thể
			if(item.id_bt){
				const bienThe = bienTheMap.get(item.id_bt);
				console.log(bienThe);
				//check xem biến thể có thuốc sản phẩm này ko
				if(bienThe && bienThe.id_sp === sanPham.id){
					finalName = `${sanPham.ten_sp}(${bienThe.ten_bien_the})`;
					basePrice = bienThe.gia;
					stockAvailable = bienThe.so_luong;
					if(bienThe.img) finalImg = bienThe.img;
				}
			}
			//logic giá km  (sale %) giảm theo  %
			const gia_da_giam = sanPham.sale > 0 ? Math.round(basePrice * (1 - sanPham.sale / 100)) : basePrice;
			const thanh_tien = gia_da_giam * item.so_luong;
			totalMerchadiseValue += thanh_tien;
			const shopId = sanPham.id_user;
			//nếu shop chua có tạo mới
			if(!shopGroups.has(shopId)){
				shopGroups.set(shopId,{
					shop_info: {
						id: sanPham.shop.id,
						ten_shop: sanPham.shop.ho_ten,
						hinh_shop: sanPham.shop.hinh
					},
					items: [],
					tam_tinh: 0,
					phi_ship: FIXED_SHIPPING_FEE,
					giam_gia_khuyen_mai: 0,
					final_total: 0
				});
			}
			//push item vào shop tuong ứng
			const group = shopGroups.get(shopId);
			if(group){
				group.items.push({
					id_sp: item.id_sp,
					id_bt: item.id_bt || null,
					ten_sp: finalName,
					img: finalImg,
					so_luong: item.so_luong,
					gia_da_giam: gia_da_giam,
					gia_goc: basePrice,
					sale: sanPham.sale,
					thanh_tien: thanh_tien,
					hang_co_sang: stockAvailable
				});
				group.tam_tinh += thanh_tien;
			}
			
			
			

		}
		let totalVoucherDiscount = 0;
		let voucherCode = null;
		let voucherError = null;
		if(id_km){
				const voucher = await  Voucher.findByPk(id_km);
				if(voucher){
					const now  = new Date();
					if(now< new Date(voucher.ngay_bd)){
						voucherError = "Mã chưa đén thời gian áp dụng";
					}else if(now > new Date(voucher.ngay_kt)){
						voucherError = "Mã đã  hết hạn sử dụng";
					}else if(voucher.so_luong <= 0){
						voucherError = "Mã đã  hết lượt sử dụng";
					}else if(totalMerchadiseValue < voucher.gia_tri_don_min ){
						voucherError = `Đơn  hàng chưa đủ ${voucher.gia_tri_don_min.toLocaleString()}đ để dùng mã này`
					}else if(voucher.gioi_han_user > 0){
						const usageCount = await KhuyenMaiUser.count({
							where: {
								id_user: id_user,
								id_km: id_km,//quan trong cchuaw tính những đơn bị hủy
							}
						});
						if(usageCount >= voucher.gioi_han_user){
							voucherError = `Bạn đã hết lượt sử dụng mã này (Tối đa ${voucher.gioi_han_user} lần)`;
						}
					}else{
						//hợp lệ tính tiền
						voucherCode = voucher.code;
						let  discountAmout = voucher.gia_tri_giam;
						//cái này tính theo giá giảm theo %
						if(voucher.loai_km === GiamGiaTheoPhanTram){
							discountAmout = Math.round(totalMerchadiseValue * (voucher.gia_tri_giam / 100));
							//nế giá giảm lớn hơn gia giảm tối đa cho nó bằn chính nó
							if(discountAmout > voucher.gia_giam_toi_da ){
								discountAmout = voucher.gia_giam_toi_da;
							}
							//ko bao giờ cho voucher vượt quá tiền hàng logic
							
						}
						totalVoucherDiscount = Math.min(discountAmout, totalMerchadiseValue);
					}
				}else{
					voucherError = "Voucher không tồn tại"
				}
				
			}
			const resultShops: ShopGroup[]= [];
			let  grandTotal = 0 //tổng thanh toán cuối cùng;
			shopGroups.forEach((group)=>{
				//chiaw tiền voucher theo tỷ lệ doanh thu của shop
				let giaGiamPhanBo = 0;
				if(totalMerchadiseValue > 0){
					const tyLe = group.tam_tinh / totalMerchadiseValue;
					giaGiamPhanBo = Math.round(totalVoucherDiscount * tyLe);
				}
				group.giam_gia_khuyen_mai = giaGiamPhanBo;
				//tiền hàng + ship  + voucher;
				group.final_total = group.tam_tinh + group.phi_ship - giaGiamPhanBo;
				grandTotal += group.final_total;
				resultShops.push(group);
			});
			return res.status(200).json({
				data: {
					shops: resultShops,
					tom_tat_don_hang: {
						total_tien_hang: totalMerchadiseValue,
						total_tien_ship: FIXED_SHIPPING_FEE * resultShops.length,
						total_giam_gia_voucher: totalVoucherDiscount,
						grandTotal: grandTotal//tổng tiền cần trả là
					},
					voucher_info: {
						applied: !!voucherCode,
						code: voucherCode,
						error: voucherError,//báo lỗi voucher;
					}

				},
				success: true
			})
	} catch (error) {
		const err  =error as CustomError;
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi tính toán đơn hàng", success: false})
	}
})
router.post<{}, {}, createDonHangInput>('/tao-don-hang',checkAuth,validate(createDonHangSchema),async(req, res)=>{
	const t = await sequelize.transaction();
	const createdFile: string[] = [];

	try {
		
		const {id_dia_chi, id_pttt, items,ghi_chu,id_km} = req.body;
		await validateForeignKey(id_pttt, PTTT,"phương thức thanh toán");
		const userPayload = req.user as AuthUser;
		const  id_user_mua = userPayload.id;
		const diaChiDB = await Dia_chi_User.findOne({
			where: {id: id_dia_chi, 
				id_user: id_user_mua
			},
			transaction: t
		});
		if(!diaChiDB){
			throw {status: 400, thong_bao: "Địa  chỉ giao hàng không tồn tại"};
		}
		const {tinh_name, quan_name, phuong_name} = await getNameFromCodes(diaChiDB.tinh, diaChiDB.quan, diaChiDB.phuong);
		const diaChiFull = `${diaChiDB.dia_chi}, ${phuong_name},${quan_name},${tinh_name}`;
		const  tenNguoiNhan = diaChiDB.ho_ten;
		const sdtNguoiNhan = diaChiDB.dien_thoai;
		// quert sản phẩm kèm biến thể kèm lock//tránh 2 người mua một lúc sản phẩm hết hàng
		const sanPhamId = items.map((i)=> i.id_sp);
		const bienTheId = items.filter((i)=> i.id_bt).map((i)=>i.id_bt);
		const result = await SanPham.findAll({
			where: {id: {[Op.in]: sanPhamId}, an_hien: 1},
			transaction: t,
			lock: true
		});
		const sanPhamDB: createSanPhamData[] = result.map(item =>
			item.get({ plain: true }) as createSanPhamData
		);
		let bienTheDB: BienTheData[] = [];
		if(bienTheId.length > 0){
			bienTheDB = await SanPhamBienThe.findAll({
				where: {id: {[Op.in]: bienTheId}},
				transaction: t,
				lock: true
			});
			
		}
		
		const sanPhamMap = new Map<number, createSanPhamData>();
		sanPhamDB.forEach(sp => sanPhamMap.set(sp.id, sp));
		const bienTheMap = new Map<number, BienTheData>();
		bienTheDB.forEach(bt=> bienTheMap.set(bt.id, bt));
		//gom shop tính toán lại từ đầu
		const shopGroups = new Map<number, createShopGroup>();
		let totalMerchadiseValue = 0;
		for(const item of items){
			const sanPham = sanPhamMap.get(item.id_sp);
			if(!sanPham){
				throw {status: 404, thong_bao: "Sản phẩm không tồn tại"};
			}
			
			let price = sanPham.gia;
			let so_luong = sanPham.so_luong;
			let finalName = sanPham.ten_sp;
			let finalImg = sanPham.img;
			let isBienThe = false;
			// console.log(item.id_bt);
			
			if(item.id_bt){
				const bienThe = bienTheMap.get(item.id_bt);
				// console.log(bienThe);
				// console.log(bienThe?.id_sp);
				// console.log(sanPham.id);
				if(!bienThe || bienThe.id_sp !== sanPham.id){
					throw {status: 400, thong_bao: ` Biến thể không hợp lệ cho  SP: ${sanPham.ten_sp}`};
				}
				price = bienThe.gia;
				so_luong = bienThe.so_luong;
				finalName = `${sanPham.ten_sp} (${bienThe.ten_bien_the})`;
				finalImg = sanPham.img;
				isBienThe = true;
			}
			if(item.so_luong > so_luong){
				throw {status: 400, thong_bao: ` Sản phẩm "${finalName}" không đủ hàng (Chỉ còn ${so_luong})`};
			}
			
			const gia_da_giam = sanPham.sale > 0 ? price * (1 - sanPham.sale/100) : price;
			const thanh_tien = gia_da_giam * item.so_luong;
			totalMerchadiseValue += thanh_tien;
			const shopId = sanPham.id_user;
			if(!shopGroups.has(shopId)){
				shopGroups.set(shopId, {
					items: [],
					tam_tinh: 0
				});
			}
			const group = shopGroups.get(shopId);
			if(group){
				group.items.push({
					id_sp: item.id_sp,
					id_bt: item.id_bt|| null,
					ten_sp: finalName,
					img: finalImg,
					so_luong: item.so_luong,
					gia_goc: price,
					gia_da_giam: gia_da_giam,
					sale: sanPham.sale,
					thanh_tien: thanh_tien,//giá tiền lúc giam * so  luong
					hang_co_sang: so_luong,
					is_bienthe: isBienThe
				});
				group.tam_tinh += thanh_tien//tổng thnahf  tiền của shop
			}
		}
		let totalVoucherDiscount = 0;
		if(id_km){
			const voucher = await Voucher.findByPk(id_km, {transaction: t, lock: true});
			if(!voucher) throw {status: 404, thong_bao: "Mã giảm giá không tồn tại"};
			const now = new Date();
			if(now < new Date(voucher.ngay_bd)){
				throw {status: 400, thong_bao: "Mã giảm giá chưa đến thời gian áp dụng"};
			}
			if(now > new Date(voucher.ngay_kt)){
				throw {status: 400, thong_bao: "Mã giảm giá đã hết hạn"};
			}
			if(voucher.so_luong <= 0){
				throw {status: 400, thong_bao: "Mã giảm giá  đã hết lượt sử dụng"};
			}
			if(totalMerchadiseValue < voucher.gia_tri_don_min){
				throw {status: 400, thong_bao:  `Đơn  hàng chưa đủ ${voucher.gia_tri_don_min.toLocaleString()}đ để dùng mã này`};
			}
			if(voucher.gioi_han_user > 0){
				const usageCount = await KhuyenMaiUser.count({
					where: {
						id_user: id_user_mua,
						id_km: id_km,//quan trong cchuaw tính những đơn bị hủy
					},
					transaction: t
				});
				if(usageCount >= voucher.gioi_han_user){
					throw {status: 400, thong_bao: `Bạn đã hết lượt sử dụng mã này (Tối đa ${voucher.gioi_han_user} lần)`}
				}
			}
			let discountAmout = voucher.gia_tri_giam;
			if(voucher.loai_km === GiamGiaTheoPhanTram){
				discountAmout = Math.round(totalMerchadiseValue * (voucher.gia_tri_giam/100));
				if(discountAmout > voucher.gia_giam_toi_da){
					discountAmout = voucher.gia_giam_toi_da;
				}
			}
			totalVoucherDiscount = Math.min(discountAmout, totalMerchadiseValue);
			//quan trọng trừ số lượng voucher
			await voucher.decrement('so_luong',{by: 1, transaction: t});
			await voucher.increment('da_dung',{by: 1, transaction: t});
		}
		const createDonHangId : number[] = [];
		for(const [shopId, group] of shopGroups){
			//phân bô  chia voucher cho shop
			let  giaGiamPhanBo = 0;
			if(totalMerchadiseValue > 0){
				const tyLe = group.tam_tinh / totalMerchadiseValue;
				giaGiamPhanBo = Math.round(totalVoucherDiscount * tyLe);
			}
			//tạo record dơn hàng
			const ma_dh = generateOrderCode();
			const newOrder = await DonHang.create({
				ma_dh: ma_dh, id_user: id_user_mua, id_shop: shopId,
				ten_nguoi_nhan: tenNguoiNhan,
				dien_thoai: sdtNguoiNhan,
				dia_chi_gh: diaChiFull,
				ghi_chu,
				id_pttt: id_pttt,
				trang_thai_dh: 0,
				tam_tinh: group.tam_tinh,
				phi_vc: FIXED_SHIPPING_FEE,
				giam_gia: giaGiamPhanBo,
				tong_tien: group.tam_tinh + FIXED_SHIPPING_FEE - giaGiamPhanBo,
				id_km: id_km || null
			},{transaction: t});
			createDonHangId.push(newOrder.id);
			if(id_km){
				await KhuyenMaiUser.create({
					id_user: id_user_mua,
					id_km: id_km,
					id_dh: newOrder.id
				},{transaction: t});
			}
			for(const item of group.items){
				const processResult = await processDonHangImg(item.img);
				if(processResult) createdFile.push(processResult);
				const DonHangCTImgPath = processFilePath(processResult);
				await DonHangChiTiet.create({
					id_dh: newOrder.id, id_sp: item.id_sp, id_bt: item.id_bt,ten_sp: item.ten_sp, img: DonHangCTImgPath,
					so_luong: item.so_luong, gia: item.gia_da_giam, thanh_tien: item.thanh_tien
				},{transaction: t});
				if(item.is_bienthe){
					await SanPhamBienThe.decrement('so_luong',{by: item.so_luong, where: {id: item.id_bt}, transaction: t});
				}else{
					await SanPham.decrement('so_luong',{by: item.so_luong, where: {id: item.id_sp},transaction:t});
				}
			}
		}
		//xóa giỏ hàng
		const gioHang = await GioHang.findOne({where: {id_user: id_user_mua}, attributes: ['id'], transaction: t});
		if(gioHang){
			const deleteCondition = items.map((i)=>({
				id_gh: gioHang.id, id_sp: i.id_sp, id_bt: i.id_bt || null
			}));
			await GioHangChiTiet.destroy({where: {[Op.or]: deleteCondition}, transaction: t});//nó sẽ xóa những thằng thỏa mảng điều kiện trên
		}
		await t.commit();
		return res.status(200).json({
			thong_bao: "Đặt hàng thành công", data: {list_don_hang: createDonHangId}, success: true
		})
	} catch (error) {
		
		await t.rollback();
		const err = error as  CustomError;
		console.log(err.message);
		if(createdFile){
			await Promise.all(createdFile.map(filePath=>{
				return fs.promises.unlink(filePath).catch(err=>{
					console.warn(` Không xóa được file optimized ${filePath}:`, err.message);
					return Promise.resolve();
				})
			}))
		}
		const status = err.status || 500;
		const thong_bao = err.thong_bao || "Lõi máy  chủ khi đặt hàng";
		return res.status(status).json({thong_bao, success: false});

		
	}
})
router.get<{}, {}, {}, GetallDonHang>('/don-hang/lich-su',checkAuth,async(req , res)=>{
	try {
		
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id
		const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
		const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
		const offset = (page -1) * limit;
		const whereCondition: WhereOptions<DonHang> = {
			id_user: id_user
		}
		if(req.query.trang_thai !== null && req.query.trang_thai !== undefined){
			const trang_thai = Number(req.query.trang_thai);
			if(!isNaN(trang_thai)){
				whereCondition.trang_thai_dh = trang_thai
			}
		}
		const {rows, count} = await DonHang.findAndCountAll({
			limit: limit,
			offset: offset,
			order: [['createdAt','DESC']],
			where: whereCondition,
			include: [{
				model: DonHangChiTiet,
				as: 'chi_tiet_dh',	
				attributes: ['id','id_dh','id_sp','id_bt','ten_sp','img','so_luong','gia','thanh_tien']
			},{
				model: User,
				as: 'shop',
				attributes: ['ho_ten','id','hinh']
			},{
				model: PTTT,
				as: 'pttt',
				attributes: ['ten_pt','code']
			}],
			distinct: true
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
		return res.status(200).json({result, success: true});
	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		return res.status(500).json({thong_bao: "Lỗi máy chủ khi xem lịch sử đơn hàng", success: false});
	}
})
router.get<getDonHangDetailInput>('/don-hang/lich-su/:id',checkAuth,validate(getDonHangDetailSchema),async(req, res)=>{
	try {
		const {id} = req.params;
		const userPayload = req.user as AuthUser;
		const id_nguoi_mua = userPayload.id;
		const donHang = await DonHang.findOne({
			where: {
				id: id,
				id_user: id_nguoi_mua
			},
			include: [{
				model: DonHangChiTiet,
				as: 'chi_tiet_dh',
				attributes: ['id','ten_sp','img','so_luong','gia','thanh_tien','id_bt'],
			},{
				model: User,
				as:'shop',
				attributes: ['id','ho_ten','hinh']
			},{
				model: PTTT,
				as: 'pttt',
				attributes: ['ten_pt','code']
			},{
				model: Voucher,
				as: 'voucher',
				attributes: ['ten_km','code','loai_km','gia_tri_giam'],
				required: false//left join có voucher thì hiện ko thì thôi
			}]
		});
		if(!donHang){
			throw {status: 404, thong_bao: "Đơn hàng không tòn tại hoặc bạn không có quyền xem"};
		}
		return res.status(200).json({data: donHang, success: true});
	} catch (error) {
		const err = error as CustomError;
		console.log(err.message);
		const status = err.status ||500;
		const thong_bao = err.thong_bao || "Lỗi máy chủ khi xem chi tiết đơn hàng"
		return res.status(status).json({thong_bao, success: false});
	}
})
router.put<cancelDonHangInput['params'], {},cancelDonHangInput['body']>('/don-hang/huy/:id',checkAuth,validate(cancelDonHangSchema),async(req, res)=>{
	const t = await sequelize.transaction();
	try {
		const {id} = req.params;
		const {ly_do} = req.body;
		const userPayload = req.user as AuthUser;
		const id_user = userPayload.id;
		const donHang = await DonHang.findOne({
			where: {
				id: id,
				id_user: id_user
			},
			include: [{
				model: DonHangChiTiet,
				as: 'chi_tiet_dh',
				attributes: ['id_sp','id_bt','so_luong']
			}],
			lock: true,//lock do ngf này để tránh admin đan xxacs nhận mà user lại bấm hủy cùng lúc
			transaction: t
		});
		if(!donHang){
			throw {status: 404, thong_bao: "Đơn hàng không tồn tại"};
		}
		//kiểm trả trạng thái
		if(donHang.trang_thai_dh === DON_HANG_HUY_VALUE){
			throw {status: 400, thong_bao: "Đơn hàng này đã  bị hủy từ trước đó rồi"};
		}
		if(donHang.trang_thai_dh >= 2){
			throw {status: 400, thong_bao: "Đơn hàng đang giao  cho đơn vị vẫn chuyển, không thể hủy"};
		}
		//cặp nhất trang thái đơn  Hủy -1
		await donHang.update({
			trang_thai_dh: DON_HANG_HUY_VALUE,
			ly_do_huy: ly_do || "Khách tự hủy"
		},{transaction: t});
		const donHangItem = donHang.toJSON() as DonHangWithChiTiet;
		//hoàn kho (trả lại số lượng sản phẩm)
		if(donHangItem.chi_tiet_dh && donHangItem.chi_tiet_dh.length > 0){
			for(const item of donHangItem.chi_tiet_dh){
				
				if(item.id_bt){
					await SanPhamBienThe.increment('so_luong',{
						by: item.so_luong,
						where: {id: item.id_bt},
						transaction: t
					})
				}else{
					await SanPham.increment('so_luong',{
					by: item.so_luong,
					where: {id: item.id_sp},
					transaction: t
				})
				}
			}
		}
		//hoàn voucher nếu đơnq có dùng voucher
		if(donHang.id_km){
			//xóa lịch xsuwr dùng voucher của user trong bang km user đẻ khi  dùng lại vãn đc tính là chưa dùng
			await KhuyenMaiUser.destroy({
				where: {
					id_km: donHang.id_km,
					id_dh: donHang.id,
					id_user: id_user
				},
				transaction: t
			})
			//cộng lại số lượng voucher cho hệ thông
			await Voucher.increment('so_luong',{
				by: 1,
				where: {id: donHang.id_km},
				transaction: t
			})
			// trừ đi số lượng da dung 
			await Voucher.decrement('da_dung',{
				by: 1,
				where: {id: donHang.id_km},
				transaction:t 
			});
		}
		await t.commit();
		return res.status(200).json({thong_bao: "Hủy đơn  hàng thành công", success: true});
	} catch (error) {
		await t.rollback();
		const err = error as CustomError;
		// console.log(err.message);
		const status = err.status || 500;
		const thong_bao = err.thong_bao  || "Lỗi máy chủ khi lấy  Thông báo";
		return res.status(status).json({thong_bao, success: false});
	}
})

export default router;

