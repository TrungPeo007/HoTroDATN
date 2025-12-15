import express, { Request, Response } from 'express';
import { AllowedUpdateDanhMucTin, DanhMucTinParams, GetAllDanhMucTin } from '../types/dm_tin';
import { DanhMucTin } from '../models';
import validate from '../middleware/validate';
import { createDanhMucTinInput, createDanhMucTinSchema, updateDanhMucTinInput, updateDanhMucTinSchema } from '../schema/dmtin.schema';
import { Op } from 'sequelize';
import { adJustOrderInDanhMucTin } from '../ultis/adjustorder';
import { normalizeBoolean } from '../ultis/validate';
const  router = express.Router();
interface CustomError {
	status?: number;//dùng ? vì có khi dữ lieuj lỗi tra về ko có status
	thong_bao?: string;
	message?: string;

}
router.get<{},{},{},GetAllDanhMucTin>('/',async(req: Request, res: Response)=>{
    try {
        const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
        const offset = (page - 1) * limit;
        const  {rows, count} = await  DanhMucTin.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['stt','ASC']]
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
        return res.status(500).json({thong_bao: "Lỗi máy chủ khi lấy danh sách tin tức"});
    }
});
router.post<{},{},createDanhMucTinInput>('/',validate(createDanhMucTinSchema),async(req,res)=>{
    try {
        const  {ten_dm, parent_id, an_hien} = req.body;
        const existingTenDm = await DanhMucTin.findOne({
            where: {
                ten_dm: ten_dm
            }
        });
        if(existingTenDm){
            throw {status: 409, thong_bao: "Tên danh mục tin tức đã tồn tại vui lòng nhập tên khác"};
        }
        if(parent_id !== 0){
            const parentDm = await DanhMucTin.findByPk(parent_id);
            if(!parentDm){
                throw {status: 404, thong_bao: "Parent id không có vui  lòng nhập lại"}
            }
        }
        const maxOrder: number = await DanhMucTin.max('stt');
        const newOrder = (maxOrder || 0) + 1;
        const newDMTin = await DanhMucTin.create({
            ten_dm: ten_dm,
            parent_id: parent_id !== 0 ? parent_id : null,
            stt: newOrder,
            an_hien: an_hien
        });
        return res.status(200).json({thong_bao:` Thêm thành công danh mục tin tức có ID là ${newDMTin.id}`, success: true})
     } catch (error) {
        const  err = error as CustomError;
        // console.log(err.message);
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi thêm danh mục tin tức";
        return res.status(status).json({thong_bao, success: false});      
    }
})
router.get<DanhMucTinParams>('/:id',async(req,res)=>{
    try {
        const {id} = req.params;
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID danh mục sản phẩm không hợp lệ" };
        }
        const DMTin = await DanhMucTin.findByPk(id,{
            attributes: ['id','ten_dm','parent_id','stt','an_hien','createdAt']
        });
        if(!DMTin){
            throw {status: 404, thong_bao: "Id danh mục tin tức không tồn tại nên không lấy đc thông tin 1 tin tức"};
        }
        return res.status(200).json({DMTin, success: true});
    } catch (error) {
        const err = error as  CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi lấy chi tiết 1 danh mục tin tức"
        return res.status(status).json({thong_bao, success:false});
    }
})
router.put<updateDanhMucTinInput['params'],{}, updateDanhMucTinInput['body']>('/:id',validate(updateDanhMucTinSchema),async(req,res)=>{
    try {
        const {ten_dm, parent_id, stt, an_hien} = req.body;
        const {id} = req.params;
        const DMTin = await DanhMucTin.findByPk(id);
        if(!DMTin){
            throw {status: 400, thong_bao: "Không tìm thấy ID để cập nhật danh mục tin tức"};
        }
        const allowedUpdate: AllowedUpdateDanhMucTin = {};
        if(DMTin.ten_dm !== ten_dm){
            const existingTenDm = await DanhMucTin.findOne({
                where: {
                    ten_dm: ten_dm,
                    id: {[Op.not]: DMTin.id}
                }
            });
            if(existingTenDm){
                throw {status: 409, thong_bao: "Tên danh mục tin tức đã tồn tại  mới nhập tên khác"};
            }
            allowedUpdate.ten_dm = ten_dm;
        }
        if(parent_id !== undefined){
            const newIdcha  = parent_id <= 0 ? null : parent_id;
            if(DMTin.parent_id !== newIdcha){
                const hasChildren = await DanhMucTin.count({
                    where: {
                        parent_id: DMTin.id
                    }
                });
                if(hasChildren > 0){
                    throw {status: 400, thong_bao: "Không thể thây đổi danh mục tin cha vì đang có danh mục tin con"};
                }
                if(newIdcha !== null){
                    if(newIdcha === Number(id)){
                        throw {status: 400, thong_bao: "Danh mục tin tức cha không thể là chính nó"};
                    }
                    const parentDMTin = await DanhMucTin.findByPk(newIdcha);
                    if(!parentDMTin){
                        throw {status: 404, thong_bao: "Danh mục  tin tức cha không tồn tại vui lòng nhập lại"};
                    }
                }
                allowedUpdate.parent_id = newIdcha;
            }
        }
        if(stt !== undefined && DMTin.stt !== stt){
            if(stt > DMTin.stt){
                await adJustOrderInDanhMucTin(-1, DanhMucTin,{
                    stt: {[Op.gt]: DMTin.stt,[Op.lte]: stt},
                        
                })
            }else{
                await adJustOrderInDanhMucTin(+1, DanhMucTin, {
                    stt: {[Op.gte]: stt, [Op.lt]: DMTin.stt}
                })
            }
            allowedUpdate.stt = stt;
        }
        // console.log(an_hien);
        if(an_hien !== undefined && normalizeBoolean(DMTin.an_hien) !== an_hien){
            allowedUpdate.an_hien = an_hien
        }
        if(Object.keys(allowedUpdate).length > 0){
            await DMTin.update(allowedUpdate);
            const updateDMTin = DMTin.toJSON();
            return res.status(200).json({thong_bao: ` Đã cập nhật danh mục tin tức có ID là ${updateDMTin.id}`, success: true});
        }
        return res.status(200).json({thong_bao: "Không có thông tin nào thay đổi", success: true})
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi cập nhật danh mục tin tức";
        return res.status(status).json({thong_bao, success: false});
    }
})
router.delete<DanhMucTinParams>('/:id',async(req,res)=>{
    try {
        const {id} = req.params;
        if (isNaN(Number(id))) {
             throw { status: 400, thong_bao: "ID danh mục tin tức không hợp lệ" };
        }
        const DMTin = await DanhMucTin.findByPk(id);
        if(!DMTin){
            throw {status: 404, thong_bao: "Danh mục tin tức không tồn tại nên không thể xóa danh mực"};
        }
        const childrenCount  = await DanhMucTin.count({
            where: {parent_id: id}
        });
        if(childrenCount > 0){
            throw {status: 400, thong_bao :`Không thể xóa vì danh mục này đang chứa ${childrenCount} danh mục con. Vui lòng xóa hoặc di chuyển danh mục con trước.`}
        }
        const {stt} = DMTin;
        await DMTin.destroy();
        await adJustOrderInDanhMucTin(-1, DanhMucTin, {
            stt: {[Op.gt]: stt}
        })
        return res.status(200).json({thong_bao: "Đã xóa thành công danh mục tin tức",success: true})
    } catch (error) {
        const err = error as CustomError;
        const status = err.status || 500;
        const thong_bao = err.thong_bao || "Lỗi máy chủ khi  xóa danh mực tin tức";
        return res.status(status).json({thong_bao, success: false})
    }
})
export default router