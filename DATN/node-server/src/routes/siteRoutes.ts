import express, { Request, Response } from 'express';
import { AllowedUpdateDiaChi, CreateDiaChiByUser, DiaChiParams, GetAllDiaChiByUser } from '../types/dia_chi_user';
import { checkAuth } from '../middleware/auth';
import {DanhGia, DanhMucTin, Dia_chi_User, DM_San_Pham, IMG_SanPham, SanPham, SanPhamBienThe, ThuocTinh, ThuocTinhSP, ThuongHieu, TinTuc, User, YeuThichSp, YeuThichTin} from '../models';
import { AuthUser } from '../types/express';
import { getNameFromCodes, normalizeBoolean, validateAddressCodes, validateForeignKey } from '../ultis/validate';
import { Op, where } from 'sequelize';
import { toggleYeuThichInput, toggleYeuThichSchema } from '../schema/yeuthich.schema';
import validate from '../middleware/validate';
import { getAllYeuThichByUser, ParamsYeuthichSP } from '../types/yeuthich_sp';
import { toggleYeuThichTinInput, toggleYeuThichTinSchema } from '../schema/yeuthichtin.schema';
import { AN_HIEN_VALUE } from '../config/explain';
import { formattedDataYeuThichTin, ParamsYeuThichTin } from '../types/yeuthichtin';
import { createDanhGiaSpInput, createDanhGiaSpSchema, traLoiDanhGiaSpInput, traLoiDanhGiaSpSchema } from '../schema/danhgia.schema';
import { uploadMiddleware } from '../middleware/upload';
import { sequelize } from '../config/database';
import { processFilePath } from '../ultis/pathprocess';
import { IMG_DanhGia } from '../models/img_dg';
import { cleanUpfiles } from '../ultis/file';
import { GetAllDanhGia, ParamsDanhGiaById, ParamsDanhGiaBySlug } from '../types/danhgia';
import { createBienTheSp, createThuocTinhSp, GetALLSanPHam, ThuocTinhMap } from '../types/sanpham';
import { ParamSanPhamIdInput, sanPhamIdSchema } from '../schema/sanpham.schema';
const router = express.Router();

interface CustomError {
	status?: number;//dùng ? vì có khi dữ lieuj lỗi tra về ko có status
	thong_bao?: string;
	message?: string;

}
type MulterFieldFiles = {[filedname: string]: Express.Multer.File[]};
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
router.post<{},{},createDanhGiaSpInput>('/danh-gia',checkAuth,uploadMiddleware,validate(createDanhGiaSpSchema),async(req,res)=>{
    const t = await sequelize.transaction();
    try {
        const userPayload = req.user as AuthUser;
        const id_user = userPayload.id;
        const files = req.files as MulterFieldFiles;
        const hinhDgFiles = files?.['hinh_dg'] || [];
        const {id_sp,noi_dung, so_sao,tinh_nang, chat_luong} = req.body;
        const newIdSp = await validateForeignKey(id_sp, SanPham, "Sản phẩm");
        // const hasPurchased = await DonHang.findOne({
        //     where: {
        //         id_user: id_user,
        //         trang_thai_dh: 4
        //     },
        //     include: [{
        //         model: ChiTietDonHang,
        //         as: 'chi_tiet',
        //         where: {id_sp: id_sp},
        //         required: true
        //     }]
        // });
        // if(!hasPurchased){
        //     throw {status: 403, thong_bao: "Bạn cần mua sản phẩm này để viêt đánh giá"
        //     }
        // }
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
/// lấy sản phẩm
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

export default router;