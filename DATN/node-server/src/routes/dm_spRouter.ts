import express, { Request, Response } from 'express';
import fs from 'fs';
import {  AllowedUpdateDanhMucSP, CreateDanhMucSP, DanhMucSPParams, GetAllDanhMuc, UpdateDanhMucSP } from '../types/dm_sp';
import {DM_San_Pham} from '../models';
import { generateSlug, removeVietnameseTones } from '../ultis/slugrename';
import { normalizeBoolean } from '../ultis/validate';
import { covertWebPathToAbsolutePath, processFilePath } from '../ultis/pathprocess';
import { uploadMiddleware } from '../middleware/upload';
import { adJustOrderInLoaiDanhMucSP } from '../ultis/adjustorder';
import { Op } from 'sequelize';
import { cleanUpfiles } from '../ultis/file';
const router = express.Router();
interface CustomError {
	status?: number;//dùng ? vì có khi dữ lieuj lỗi tra về ko có status
	thong_bao?: string;
	message?: string;

}
type MulterFieldFiles = {[fieldname: string]: Express.Multer.File[]};
router.get<{},{}, {},GetAllDanhMuc>('/',async(req: Request, res: Response)=>{
    try {
        const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
        const  offset = (page - 1) * limit;
        const {rows, count} = await DM_San_Pham.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['stt','ASC']]
        });
        const totalPages = Math.ceil(count / limit);
        const result = {
            data: rows,
            paination: {
                currentPage: page,
                limit: limit,
                totalItem: count,
                totalPages: totalPages
            }
        };
        return res.status(200).json({result, success: true});
    } catch (error) {
        const err = error as CustomError;
        return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy danh sách danh mục sản phẩm", success: false});
    }
})
router.post<{},{},CreateDanhMucSP>('/',uploadMiddleware,async(req,res)=>{
    try {
        const {ten_dm, parent_id, an_hien, slug} = req.body;
        const files = req.files as MulterFieldFiles;
        const newHinh = files?.['hinh_dm']?.[0]?.path;
        
        
        const slugTrim = slug?.trim();
        if(!ten_dm){
            throw {status: 400, thong_bao: "Bạn chưa nhập đủ thông tin"};
        }
        const tenDmTrim = ten_dm.trim();
        if(!newHinh){
            throw {status: 400, thong_bao: "Bạn cần phải chèn hình vào để thêm danh mục sản phẩm"};
        }
        const existingTenDm = await DM_San_Pham.findOne({
            where: {
                ten_dm: tenDmTrim
            }
        });
        if(existingTenDm){
            throw {status: 409, thong_bao: "Tên danh mục sản phẩm đã tồn tại vui lòng nhập tên khác"}
        }
        if(parent_id && parent_id !== null && Number(parent_id) !== 0){
            const parentDm = await DM_San_Pham.findByPk(parent_id);
            if(!parentDm){
                throw {status: 404, thong_bao: "Parent id không có vui lòng nhập lại"}
            }
            
        }
        const anHienValue = normalizeBoolean(an_hien);
        let finalSlug:string = ""; 
        if(slugTrim && slugTrim !== ""){
            const slugNoVietnamese = removeVietnameseTones(slugTrim);
            if(slugTrim !== slugNoVietnamese){
                throw {status: 400, thong_bao: "Slug không đc chứa dấu tiếng viết"}
            }
            const isValidSlug = /^[a-z0-9-]+$/;
            if(!isValidSlug.test(slugTrim)){
                throw {status: 400, thong_bao: "Slug chỉ được  nhập số, chữ và dấu gạnh ngang (-)"};
            }
            finalSlug = slugTrim;
        }else{
            finalSlug  = generateSlug(tenDmTrim);
        }
        const slugTrung = await DM_San_Pham.findOne({
            where: {
                slug: finalSlug
            },
            attributes: ['id']
        });
        if(slugTrung){
            throw {status: 409, thong_bao: "Lỗi do slug bị trùng với danh mục sản phâm khác"};
        }
        const maxOrder:number = await DM_San_Pham.max('stt');
        const newOrder = (maxOrder || 0) + 1;
        const hinhPath = processFilePath(newHinh);
        const newDmSp = await DM_San_Pham.create({
            ten_dm: tenDmTrim,
            img: hinhPath,
            stt: newOrder,
            parent_id: parent_id || null,
            an_hien: anHienValue,
            slug: finalSlug
        });
        
        return res.status(200).json({thong_bao: ` Thêm thành công danh mục có ID là ${newDmSp.id}`,success: true});
    } catch (error) {
        await cleanUpfiles(req);
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi thêm thông báo";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.get<DanhMucSPParams>('/:id',async(req,res)=>{
    try {
        const {id} = req.params;
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID danh mục sản phẩm không hợp lệ" };
        }
        const DmSp = await DM_San_Pham.findByPk(id,{
            attributes: ['id','ten_dm','img','stt','parent_id','an_hien','slug','createdAt']
        })
        if(!DmSp){
            throw {status: 404, thong_bao: "ID danh mục không tồn tại nên không lấy được thông tin 1 danh mục sản phẩm"};
        }
        return res.status(200).json({DmSp, success: true});
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi lấy chi tiết 1 danh mục sản phẩm";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.put<DanhMucSPParams, {}, UpdateDanhMucSP>('/:id',uploadMiddleware, async(req,res)=>{
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
        const {id} = req.params;
        const {ten_dm, stt, parent_id, an_hien, slug} = req.body;
        const files = req.files as MulterFieldFiles;
        const newHinh = files?.['hinh_dm']?.[0]?.path;
        if(newHinh) fileToClean.push(newHinh);
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID danh mục sản phẩm không hợp lệ" };
        }
        const slugTrim = slug?.trim();
        const DmSp = await DM_San_Pham.findByPk(id);
        if(!DmSp){
            throw {status: 404, thong_bao: "Không tìm thấy ID dể cập nhật danh mục sản phẩm"};
        }
        const allowedUpdate: AllowedUpdateDanhMucSP = {};
        const oldFileToDelete: string[] = [];
        if(!ten_dm){
            throw {status: 400, thong_bao: "Bạn chưa nhập đủ thông tin"};
        }
        const tenDmTrim = ten_dm.trim();
        if(DmSp.ten_dm !== tenDmTrim){
            const existingTenDm = await DM_San_Pham.findOne({
                where: {
                    ten_dm: tenDmTrim,
                    id: {[Op.not]: DmSp.id}
                }
            });
            if(existingTenDm){
                throw {status: 409, thong_bao: "Tên danh mục sản phẩm đã tồn tại mời nhập tên khác"};
            }
            allowedUpdate.ten_dm = tenDmTrim;
        }
        let finalSlug: string = DmSp.slug;
        let isSlugChange = false;
        if(slugTrim && slugTrim !== "" && DmSp.slug !== slugTrim){
            finalSlug = slugTrim;//th 1 slug thay đổi so với slug cũ với người dùng tự nhập slug
            isSlugChange = true;
        }else if(allowedUpdate.ten_dm && (!slugTrim || slugTrim === "")){//th2 đổi tên dm nhung ko nhập slug -> auto theo  tên mới
            finalSlug = generateSlug(allowedUpdate.ten_dm);
            isSlugChange = true
        }
        if(isSlugChange){
            const slugTrung = await DM_San_Pham.findOne({
                where: {slug: finalSlug,
                    id: {[Op.not]: DmSp.id}
                },
                attributes: ['id']
            })
            if(slugTrung){
                throw {status: 409, thong_bao: "Lỗi do slug bị trùng với danh mục sản phẩm vui lòng nhập slug khác"}
            }
            allowedUpdate.slug = finalSlug;
        }
        if(stt !== undefined){
            const newStt = Number(stt);
            if(isNaN(newStt) || newStt <= 0){
                throw {status: 400, thong_bao:"Số thứ tự phải là số nguyên và lớn hơn 0 "}
            }

            if(DmSp.stt !== newStt){
                if(newStt >  DmSp.stt){//th 1: thứ tư mới lớn hơn thứ tự cũ vd 4>1
                    await adJustOrderInLoaiDanhMucSP(-1,{
                        stt:{[Op.gt]: DmSp.stt,
                        [Op.lte]: newStt}// 4 lấy 2 3 4 trừ 1
                    })
                }else{//th 2 thứ tự mới nhở thứ tự cũ 3 <5
                    await adJustOrderInLoaiDanhMucSP(+1,{
                        stt: {[Op.gte]: newStt,//3 
                            [Op.lt]: DmSp.stt}//5 lấy 3 4 + cho 1
                    })
                }
                allowedUpdate.stt = newStt;
            }
        }
        if(parent_id !== undefined){
            
            let parse = Number(parent_id);
            const newIdcha = (isNaN(parse) || parse <= 0) ? null : parse;
            if(DmSp.parent_id !== newIdcha){
                const hasChildren = await DM_San_Pham.count({
                    where: {
                        parent_id: DmSp.id
                    }
                });
                if(hasChildren > 0){
                    throw {status: 400, thong_bao:"Không thể thay đổi Danh mục sảng phẩm cha vì đang có danh mục sản phẩm con"};
                }
                if(newIdcha !== null){
                    if(newIdcha === Number(id)){
                        throw {status: 400, thong_bao: "Danh mục sản phẩm cha không thể là chính nó"};
                    }
                    const parentDmSP = await DM_San_Pham.findByPk(newIdcha);
                    if(!parentDmSP){
                        throw {status: 404, thong_bao: "Không có danh mục cha vui lòng nhập lại dm cha"};
                    }
                }
                allowedUpdate.parent_id = newIdcha;
            }
        }
        if(an_hien !== undefined){
            const anHienValue = normalizeBoolean(an_hien);
            if(normalizeBoolean(DmSp.an_hien) !== anHienValue){
                allowedUpdate.an_hien = anHienValue
            }
        }
        
        if(newHinh){
            allowedUpdate.img = processFilePath(newHinh);
            if(DmSp.img){
                const oldAbsolutePath = covertWebPathToAbsolutePath(DmSp.img);
                oldFileToDelete.push(oldAbsolutePath);
            }
        }
        if(Object.keys(allowedUpdate).length > 0){
            await DmSp.update(allowedUpdate);
            const updateDmSp =  DmSp.toJSON();
            await Promise.all(oldFileToDelete.map((filePath)=>{
                return fs.promises.unlink(filePath).catch((error)=>{
                    console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);   
                    return Promise.resolve();
                });
            }));
            fileToClean = [];
            return res.status(200).json({thong_bao: ` Đã cập nhật danh mục sản phẩm có ID là: ${updateDmSp.id}`,success: true});
        };
        fileToClean = [];
        return res.status(200).json({thong_bao:"Không có thông tin nào thay đổi", success: true});

    } catch (error) {
        await cleanUpfiles();
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi cập nhật danh mục sản phẩm";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.delete<DanhMucSPParams>('/:id',async(req,res)=>{
    try {
        const {id} = req.params;
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID danh mục sản phẩm không hợp lệ" };
        }
        const DmSp = await DM_San_Pham.findByPk(id);
        if(!DmSp){
            throw {status: 404, thong_bao: 'Danh mục sản phẩm không tồn tại nên không thể xóa'};
        }
        const childrenCount = await DM_San_Pham.count({
            where: { parent_id: id }
        });
        
        if (childrenCount > 0) {
            throw { 
                status: 400, 
                thong_bao: `Không thể xóa vì danh mục này đang chứa ${childrenCount} danh mục con. Vui lòng xóa hoặc di chuyển danh mục con trước.` 
            };
        }
        const fileToUnlink: string[] = [];
        if(DmSp.img){
            fileToUnlink.push(DmSp.img);
        }
        const {stt} = DmSp;
        await DmSp.destroy();
        const deletePromies = async()=>{
            await Promise.all(
                fileToUnlink.map((filePath)=>{
                    const absolutePath = covertWebPathToAbsolutePath(filePath);
                    return fs.promises.unlink(absolutePath).catch((error)=>{
                        console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`, error.message);
                        return Promise.resolve();
                    })
                })
            )
        }
        
        
        await deletePromies();
        
        await adJustOrderInLoaiDanhMucSP(-1,{
            stt: {[Op.gt]: stt}
        })
        return res.status(200).json({thong_bao: "Đã xóa thành công danh mục sản phẩm", success: true});
    } catch (error) {
        const err  = error as  CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi xóa danh mục sản phẩm";
        return  res.status(status).json({thong_bao, success: false});
    }
})
export default router;
//success