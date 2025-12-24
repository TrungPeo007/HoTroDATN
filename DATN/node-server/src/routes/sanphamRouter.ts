import express, { Request, Response } from "express";
import fs from "fs";
import {
  createSanPhamInput,
  createSanPhamSchema,
  ParamSanPhamIdInput,
  QuickUpdateSanphamInput,
  sanPhamIdSchema,
  updateSanPhamInPut,
  updateSanPhamSchema,
} from "../schema/sanpham.schema";
import { uploadMiddleware } from "../middleware/upload";
import validate from "../middleware/validate";
import { sequelize } from "../config/database";
import {
  covertWebPathToAbsolutePath,
  processFilePath,
  processSanPhamImgThumanail,
} from "../ultis/pathprocess";
import {
  DanhMucTin,
  DM_San_Pham,
  IMG_SanPham,
  SanPham,
  SanPhamBienThe,
  ThuocTinh,
  ThuocTinhSP,
  ThuongHieu,
  User,
} from "../models";
import { Op, Transaction } from "sequelize";
import { generateSku, generateSlug } from "../ultis/slugrename";
import { normalizeBoolean, validateForeignKey } from "../ultis/validate";

import { AuthUser } from "../types/express";
import {
  allowedUpdateSanPham,
  createBienTheSp,
  createThuocTinhSp,
  GetALLSanPHam,
  ImgBienThe,
  ParamTimKiemSanPham,
  ThuocTinhMap,
} from "../types/sanpham";
import { cleanUpfiles } from "../ultis/file";
import { ACTIVATED_VALUE, NOT_ACTIVATED_VALUE } from "../config/explain";
import { DonHangChiTiet } from "../models/donhangct";
const router = express.Router();
interface CustomError {
  message?: string;
  status?: number;
  thong_bao?: string;
}
type MulterFieldFiles = { [filedname: string]: Express.Multer.File[] };
router.get<{}, {}, {}, GetALLSanPHam>("/kich-hoat", async (req, res) => {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const offset = (page - 1) * limit;
    const { rows, count } = await SanPham.findAndCountAll({
      where: { is_active: NOT_ACTIVATED_VALUE },
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "shop",
          attributes: ["id", "ho_ten"],
        },
        {
          model: DM_San_Pham,
          as: "danh_muc",
          attributes: ["ten_dm"],
        },
        {
          model: ThuongHieu,
          as: "thuong_hieu",
          attributes: ["ten_th"],
        },
      ],
      distinct: true,
    });
    const totalPages = Math.ceil(count / limit);
    const result = {
      data: rows,
      pagination: {
        currentPage: page,
        limit: limit,
        totalItem: count,
        totalPages: totalPages,
      },
    };
    return res.status(200).json({ result, success: true });
  } catch (error) {
    const err = error as CustomError;
    console.log(err.message);
    return res.status(500).json({
      thong_bao: "Lỗi khi lấy danh sách sản phẩm  chưa kích hoạt",
      success: false,
    });
  }
});
//ấn nút duyeetje để dùng api này
router.patch<ParamSanPhamIdInput>(
  "/kich-hoat/:id",
  validate(sanPhamIdSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const sanPham = await SanPham.findByPk(id);
      if (!sanPham) {
        throw { status: 404, thong_bao: "Sản phẩm không tồn tại" };
      }
      if (normalizeBoolean(sanPham.is_active) === ACTIVATED_VALUE) {
        return res.status(200).json({
          thong_bao: "Sản phẩm đã đc duyệt trước đó rồi",
          success: true,
        });
      }
      await sanPham.update({ is_active: ACTIVATED_VALUE });
      return res.status(200).json({
        thong_bao: ` Đã xác thực thành công sản phẩm: ${sanPham.ten_sp}`,
        success: true,
      });
    } catch (error) {
      const err = error as CustomError;
      const status = err.status || 500;
      const thong_bao = err.thong_bao || "Lỗi máy chủ khi duyệt sản phẩm";
      return res.status(status).json({ thong_bao, success: false });
    }
  }
);
router.get<{}, {}, {}, GetALLSanPHam>(
  "/",
  async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
      const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
      const offset = (page - 1) * limit;
      const { rows, count } = await SanPham.findAndCountAll({
        limit: limit,
        offset: offset,
        where: { is_active: ACTIVATED_VALUE },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: SanPhamBienThe,
            as: "san_pham_bien_the",
            attributes: [
              "id",
              "id_sp",
              "code",
              "ten_bien_the",
              "gia",
              "so_luong",
              "img",
              "createdAt",
            ],
            order: [["id", "DESC"]],
          },
          {
            model: IMG_SanPham,
            as: "imgs",
            attributes: ["url"],
          },
          {
            model: User,
            as: "shop",
            attributes: ["id", "ho_ten"],
          },
          {
            model: ThuocTinhSP,
            as: "thuoctinhsp",
            attributes: ["id_sp", "id_tt", "gia_tri"],
            include: [
              {
                model: ThuocTinh,
                as: "ten_thuoc_tinh",
                attributes: ["id", "ten_thuoc_tinh"],
              },
            ],
          },
          {
            model: DM_San_Pham,
            as: "danh_muc",
            attributes: ["ten_dm"],
          },
          {
            model: ThuongHieu,
            as: "thuong_hieu",
            attributes: ["ten_th"],
          },
        ],
        distinct: true,
      });

      const totalPages = Math.ceil(count / limit);
      const danhSachSanPham = await Promise.all(
        rows.map((sp) => {
          const item = sp.toJSON();
          return {
            ...item,
            thuoctinhsp:
              item.thuoctinhsp?.map((tt: ThuocTinhMap) => ({
                id: tt.id_tt,
                ten: tt.ten_thuoc_tinh.ten_thuoc_tinh,
                gia_tri: tt.gia_tri,
              })) || [],
          };
        })
      );
      const result = {
        data: danhSachSanPham,
        pagination: {
          currentPage: page,
          limit: limit,
          totalItem: count,
          totalPages: totalPages,
        },
      };

      return res.status(200).json({ result, success: true });
    } catch (error) {
      const err = error as CustomError;
      // console.log(err.message);
      return res
        .status(500)
        .json({ thong_bao: "Lỗi máy chủ khi lấy danh sách sản phẩm" });
    }
  }
);
//api bất tắt noi_bat và khóa cho admin
router.patch<
  QuickUpdateSanphamInput["params"],
  {},
  QuickUpdateSanphamInput["body"]
>("/:id/quick-update", async (req, res) => {
  try {
    const { id } = req.params;
    const { noi_bat, khoa } = req.body;
    const sanPham = await SanPham.findByPk(id);
    if (!sanPham) {
      throw { status: 404, thong_bao: "Sản phẩm không tồn tại" };
    }
    const allowedUpdate: Partial<SanPham> = {};
    if (khoa !== undefined) {
      if (normalizeBoolean(sanPham.khoa) !== khoa) {
        allowedUpdate.khoa = khoa;
      }
    }
    if (noi_bat !== undefined) {
      if (normalizeBoolean(sanPham.noi_bat) !== noi_bat) {
        allowedUpdate.noi_bat = noi_bat;
      }
    }

    if (Object.keys(allowedUpdate).length > 0) {
      await sanPham.update(allowedUpdate);
    }
    return res
      .status(200)
      .json({ thong_bao: "Cập nhật trạng thái thành công", success: true });
  } catch (error) {
    const err = error as CustomError;
    const status = err.status || 500;
    const thong_bao =
      err.thong_bao || "Lỗi xãy ra khi cập nhật trạng thái của sản phẩm";
    return res.status(status).json({ thong_bao, success: false });
  }
});

router.delete<updateSanPhamInPut["params"]>(
  "/:id",
  validate(sanPhamIdSchema),
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const sanPham = await SanPham.findByPk(id, {
        include: [
          {
            model: SanPhamBienThe,
            as: "san_pham_bien_the",
            attributes: ["img"],
          },
          {
            model: IMG_SanPham,
            as: "imgs",
            attributes: ["url"],
          },
        ],
      });
      if (!sanPham) {
        throw {
          status: 404,
          thong_bao: "ID sản phẩm không tồn tại nên không thể xóa  sản phẩm",
        };
      }
      const sanPhamData = sanPham.toJSON();
      const fileToUnlink: string[] = [];
      if (sanPhamData.img) {
        fileToUnlink.push(sanPham.img);
      }
      if (
        sanPhamData.san_pham_bien_the &&
        sanPhamData.san_pham_bien_the.length > 0
      ) {
        sanPhamData.san_pham_bien_the.map((bt: ImgBienThe) => {
          if (bt.img) {
            fileToUnlink.push(bt.img);
          }
        });
      }
      if (sanPhamData.imgs && sanPhamData.imgs.length > 0) {
        sanPhamData.imgs.map((img: IMG_SanPham) => {
          if (img.url) {
            fileToUnlink.push(img.url);
          }
        });
      }
      const isSold = await DonHangChiTiet.findOne({
        where: { id_sp: id },
      });

      if (isSold) {
        // Ném lỗi 400 (Bad Request) để Frontend hiện thông báo đỏ
        throw {
          status: 400,
          thong_bao:
            "Sản phẩm đã có đơn hàng. Admin chỉ có thể KHÓA sản phẩm này, không thể xóa vĩnh viễn.",
        };
      }
      await ThuocTinhSP.destroy({
        where: { id_sp: sanPham.id },
        transaction: t,
      });
      await IMG_SanPham.destroy({
        where: { id_sp: sanPham.id },
        transaction: t,
      });
      await SanPhamBienThe.destroy({
        where: { id_sp: sanPham.id },
        transaction: t,
      });
      await sanPham.destroy({ transaction: t });
      await t.commit();
      if (fileToUnlink.length > 0) {
        await Promise.all(
          fileToUnlink.map((filePath) => {
            const absolutePath = covertWebPathToAbsolutePath(filePath);
            return fs.promises.unlink(absolutePath).catch((error) => {
              console.warn(
                ` Cảnh báo: Không thể xóa tệp vật lý ${filePath}`,
                error.message
              );
              return Promise.resolve();
            });
          })
        );
      }
      return res
        .status(200)
        .json({ thong_bao: "Đã xóa thành công sản phẩm", success: true });
    } catch (error) {
      await t.rollback();
      const err = error as CustomError;
      const status = err.status || 500;
      const thong_bao = err.thong_bao || "Lôi máy chủ khi xóa sản phẩm";
      return res.status(status).json({ thong_bao, success: false });
    }
  }
);
router.get<ParamTimKiemSanPham>("/tim-kiem", async (req, res) => {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const offset = (page - 1) * limit;
    const { keyword } = req.query;
    if (!keyword) {
      return res
        .status(200)
        .json({ result: { data: [], pagination: {} }, success: true });
    }
    const { rows, count } = await SanPham.findAndCountAll({
      where: {
        ten_sp: { [Op.like]: `%${keyword}%` },
        is_active: ACTIVATED_VALUE,
      },
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "shop",
          attributes: ["id", "ho_ten"],
        },
        {
          model: DM_San_Pham,
          as: "danh_muc",
          attributes: ["ten_dm"],
        },
        {
          model: ThuongHieu,
          as: "thuong_hieu",
          attributes: ["ten_th"],
        },
      ],
      distinct: true,
    });
    const totalPages = Math.ceil(count / limit);
    const result = {
      data: rows,
      pagination: {
        limit: limit,
        currentPage: page,
        totalPages: totalPages,
        totalItem: count,
      },
    };
    return res.status(200).json({ result, success: true });
  } catch (error) {
    const err = error as CustomError;
    return res
      .status(500)
      .json({ thong_bao: "LỖi máy chủ khi tìm kiếm sản phẩm" });
  }
});
// router.post<{},{}, createSanPhamInput>('/',uploadMiddleware, validate(createSanPhamSchema),async(req,res)=>{
//     const t = await sequelize.transaction();//tạo cái nay để lưu dũ liệu dồng bộ ở các bnagr
//     const oldFileToDelete: string[] = [];
// 	try {
// 		const userPayload = req.user as AuthUser;
// 		const id_user = userPayload.id;

// 		const  {ten_sp, code, gia,sale, so_luong, xuat_xu, dvctn, dvt, mo_ta, an_hien,id_dm, id_th, thuoc_tinh, bien_the} = req.body;
// 		const files = req.files as MulterFieldFiles;
// 		const hinhSpFiles = files?.['hinh_sp'] || [];
// 		const fristHinh = hinhSpFiles?.[0];
// 		if(!gia || !so_luong){
// 			throw {status: 400, thong_bao: "Bạn chưa nhập giá với số lượng sản phẩm"}
// 		}
// 		if(!fristHinh){
// 			throw {status: 400, thong_bao: "Bạn cần chọn ít nhất 1 hình"};
// 		}
// 		const processResult = await processSanPhamImgThumanail(fristHinh.path, fristHinh.filename );
// 		if(processResult) oldFileToDelete.push(processResult);
// 		const thumnailUrl = processFilePath(processResult);
// 		if(!thumnailUrl){
// 			throw {status: 404, thong_bao:" Lỗi đồng bộ không thể tạo đường dẫn file"};
// 		}
// 		//tạo mã sku tự đông nếu ko thằng nào nhập

// 		let finalCode = code;
// 		if(!finalCode){
// 			finalCode = generateSku();
// 		}
// 		const existing = await SanPham.findOne({
// 			where: {[Op.or]: [{ten_sp: ten_sp}, {code: code}]}
// 		});
// 		if(existing){
// 			if(existing.ten_sp === ten_sp){
// 				throw {status: 409, thong_bao: "Tên sản phẩm đã tồn tại mời nhập tên khác"};
// 			}
// 			if(existing.code === finalCode){
// 				throw {status: 409, thong_bao: "Mã Sku đã tồn tại mời nhập cái khác"};
// 			}
// 		}
// 		const slug = generateSlug(ten_sp);
// 		const existingSlug = await SanPham.findOne({
// 			where: {slug: slug}
// 		});
// 		if(existingSlug){
// 			throw {status: 409, thong_bao: "Slug đã tồn tại vui lòng điều chỉnh lại tên sản phẩm"};
// 		}
// 		const newIdDM = await validateForeignKey(id_dm, DM_San_Pham, "Loại danh mục");
// 		const newIdTT = await validateForeignKey(id_th, ThuongHieu, "Loại thương hiệu");
// 		const newSp = await SanPham.create({
// 			ten_sp: ten_sp,
// 			code: finalCode,
// 			slug: slug,
// 			img: thumnailUrl,
// 			gia: gia,
// 			sale: sale,
// 			so_luong: so_luong,
// 			xuat_xu: xuat_xu || null,
// 			dvctn: dvctn ,
// 			mo_ta: mo_ta,
// 			dvt: dvt,
// 			an_hien :an_hien,
// 			id_user: id_user,
// 			id_dm: newIdDM,
// 			id_th: newIdTT
// 		}, {transaction: t});
// 		//tạo album ảnh cho sản phẩm
// 		const hinhSps = hinhSpFiles.map(file=>({
// 			id_sp: newSp.id,
// 			url: processFilePath(file.path)
// 		}));
// 		//tạo nhiều bản con trong 1 query là bulkCreate
// 		await IMG_SanPham.bulkCreate(hinhSps, {transaction: t});
// 		if(thuoc_tinh && thuoc_tinh.length > 0){
// 			const thuocTinhData = await Promise.all(thuoc_tinh.map(async(item: createThuocTinhSp)=>{
// 				const newTT = await validateForeignKey(item.id_tt, ThuocTinh, "Loại thuộc tính");
// 				return {
// 					id_sp: newSp.id,
// 					id_tt: newTT,
// 					gia_tri: item.value,
// 				}

// 			}
// 			)
// 		);
// 			await  ThuocTinhSP.bulkCreate(thuocTinhData, {transaction: t});
// 		}
// 		if(bien_the && bien_the.length > 0){
// 			//th người dùng gửi lên  sku
// 			const skuSet = new Set();//khoiwr taoj thuoc tinh set de tim gia tri trung lap
// 			for(const item of bien_the){
// 				if(item.code){
// 					if(skuSet.has(item.code)){//nó sễ kiemr trả trong sku
// 						throw {status: 400, thong_bao: "Bạn nhập mã SKU bị trùng lặp"}
// 					}
// 					skuSet.add(item.code)
// 				}
// 			}

// 			const bienTheData = await Promise.all(
// 					bien_the.map(async(item: createBienTheSp, index: number)=>{
// 						const bienTheFileKey = `hinh_bien_the_${index}`;
// 						const bienTheFiles = files[bienTheFileKey]?.[0];
// 						const bienTheHinhPath = bienTheFiles ? processFilePath(bienTheFiles) : null;
// 							let finalCodeBienThe = item.code
// 							if(!finalCodeBienThe){
// 								finalCodeBienThe = generateSku();
// 							}
// 							if(!item.gia || !item.so_luong){
// 								throw {status: 400, thong_bao: "giá và số lượng của biến thể ko đc để trống"}
// 							}
// 							const existingBienThe = await SanPhamBienThe.findOne(
// 								{
// 									where: {code: finalCodeBienThe}
// 								}
// 							);
// 							if(existingBienThe){
// 								throw {status: 409, thong_bao: "mã Sku của biến thể ko đc trùng nhau  vui lòng kiêm trả lại"}
// 							}
// 							return {
// 								id_sp: newSp.id,
// 								ten_bien_the: item.ten_bien_the,
// 								code: finalCodeBienThe,
// 								gia: item.gia,
// 								so_luong: item.so_luong,
// 								img: bienTheHinhPath
// 							};
// 					}));

// 			await SanPhamBienThe.bulkCreate(bienTheData, {transaction: t});
// 		}
// 		await t.commit();
// 		return res.status(200).json({thong_bao: ` Đã thêm sản phẩm có ID là ${newSp.id}`, success: true});
//     } catch (error) {
// 	   await  t.rollback();//roll bac dọn dẹp
// 	   await cleanUpfiles(req);
// 	   if(oldFileToDelete.length > 0){
// 		await Promise.all(oldFileToDelete.map(filePath=>{
// 			return fs.promises.unlink(filePath).catch(err=>{
// 				console.warn(` Không xóa được file optimized ${filePath}:`, err.message);
// 				return Promise.resolve();
// 			})
// 		}))
// 	   }
// 	   const err = error as CustomError;
// 	   console.log(err.message);
// 	   const status = err.status || 500;
// 	   const thong_bao = err.thong_bao || "LỖi máy chủ khi thêm sản phẩm mới";
// 	   return res.status(status).json({thong_bao, success: false});
//     }
// })
// router.get<updateSanPhamInPut['params']>('/:id',validate(sanPhamIdSchema),async(req, res)=>{
// 	try {
// 		const {id} = req.params;
// 		// if(isNaN(Number(id)) || Number(id) > 0){
// 		// 	throw {status: }
// 		// }
// 		const sanPham = await SanPham.findByPk(id,
// 			{
// 				attributes: ['id','ten_sp','code','slug','img','gia','sale','so_luong','da_ban','luot_xem','xuat_xu','dvctn','dvt','noi_bat','mo_ta','an_hien','id_dm','id_th','createdAt','khoa','is_active'],
// 					include: [{
// 						model: SanPhamBienThe,
// 						as: 'san_pham_bien_the',
// 						attributes: ['id','id_sp','code','ten_bien_the','gia','so_luong','img','createdAt'],
// 						order: [['id','DESC']]
// 					},{
// 						model: IMG_SanPham,
// 						as: 'imgs',
// 						attributes: ['url']
// 					},{
// 						model: ThuocTinhSP,
// 						as: 'thuoctinhsp',
// 						attributes: ['id_sp','id_tt','gia_tri'],
// 							include: [{
// 								model: ThuocTinh,
// 								as: 'ten_thuoc_tinh',
// 								attributes: ['id','ten_thuoc_tinh']
// 							}]
// 					},{
// 						model: DM_San_Pham,
// 						as: 'danh_muc',
// 						attributes: ['ten_dm']
// 					},{
// 						model: ThuongHieu,
// 						as: 'thuong_hieu',
// 						attributes: ['ten_th']
// 					}],
// 			}
// 		);
// 		if(!sanPham){
// 			throw {status: 404 , thong_bao: "Sản phẩm không tồn tại vui lòng kiểm trả lại"};
// 		}
// 		const sanPhamData = sanPham.toJSON();
// 		const formattedThuocTinh = sanPhamData.thuoctinhsp.map((tt: ThuocTinhMap)=>({
// 			id: tt.id_tt,
// 			ten: tt.ten_thuoc_tinh.ten_thuoc_tinh,
// 			gia_tri: tt.gia_tri
// 		}));

// 		const finalResult = {
// 			...sanPhamData,
// 			thuoctinhsp: formattedThuocTinh
// 		}
// 		return res.status(200).json({data: finalResult, success: true});

// 	} catch (error) {
// 		const err = error as  CustomError;
// 		console.log(err.message);
// 		const status  = err.status || 500;
// 		const thong_bao = err.thong_bao || "Lỗi máy chủ khi lấy chi tiết sản phẩm";
// 		return res.status(status).json({thong_bao, success: false});
// 	}
// });

// router.put<updateSanPhamInPut['params'],{},updateSanPhamInPut['body']>('/:id',uploadMiddleware,validate(updateSanPhamSchema),async(req, res)=>{
// 	const t = await sequelize.transaction();
// 	const oldFileToDelete: string[] = [];
// 	const newFileCreated: string[] = [];
// 	try {
// 		const {id} = req.params;
// 		const {ten_sp, code, gia, so_luong, sale,xuat_xu, dvctn, dvt, mo_ta, an_hien, id_dm, id_th, thuoc_tinh,bien_the} = req.body;
// 		const files = req.files as MulterFieldFiles;
// 		const hinhSpFiles = files?.['hinh_sp'] || [];
// 		const fristHinh = hinhSpFiles?.[0];
// 		const sanPham = await SanPham.findByPk(id);
// 		if(!sanPham){
// 			throw {status: 404, thong_bao: "Không tìm thấy sản phẩm để cập nhật"};
// 		}
// 		const allowedUpdate: allowedUpdateSanPham = {};
// 		if(sanPham.ten_sp !== ten_sp){
// 			const existingTensp = await SanPham.findOne({
// 				where: {
// 					ten_sp: ten_sp,
// 					id: {[Op.not]: sanPham.id}
// 				}
// 			})
// 			if(existingTensp){
// 				throw {status: 409, thong_bao: "Tên sản phẩm đã tồn tại vui  lòng nhập cái khác"};
// 			}
// 			allowedUpdate.ten_sp = ten_sp
// 			const slug = generateSlug(ten_sp);
// 			const existingSlug = await SanPham.findOne({
// 				where: {slug: slug,
// 					id: {[Op.not]: sanPham.id}
// 				}
// 			});
// 			if(existingSlug){
// 				throw {status: 409, thong_bao: "Vui lòng chỉnh lại  tên sản phẩm do slug đã bị trùng với một sản phẩm khác"};
// 			}
// 			allowedUpdate.slug = slug;
// 		}
// 		let finalCode = code;
// 		if(sanPham.code !== finalCode){
// 			if(!finalCode){
// 				finalCode = generateSku();
// 			}
// 			const existingCode = await SanPham.findOne({
// 				where: {code: finalCode,
// 					id: {[Op.not]: sanPham.id}
// 				}
// 			});
// 			if(existingCode){
// 				throw {status: 409, thong_bao: "Sku sản phẩm đã tồn tại vui lòng nhập cái khác"};
// 			}
// 			allowedUpdate.code = finalCode;
// 		}
// 		if(sanPham.gia !== gia){
// 			if(!gia){
// 				throw {status: 400, thong_bao: "Bạn vui lòng nhập giá cho sản phẩm"};
// 			}
// 			allowedUpdate.gia = gia;
// 		}
// 		if(sanPham.sale !== sale && sale !== undefined){
// 			allowedUpdate.sale = sale
// 		}
// 		if(sanPham.so_luong !== so_luong){
// 			if(!so_luong){
// 				throw {status: 409, thong_bao: "Bạn vui long nhập số lượng của sản phẩm"};
// 			}
// 			allowedUpdate.so_luong = so_luong;
// 		}
// 		if(sanPham.xuat_xu !== xuat_xu && xuat_xu !== undefined){
// 			allowedUpdate.xuat_xu = xuat_xu
// 		}
// 		if(sanPham.dvctn !== dvctn && dvctn !== undefined){
// 			allowedUpdate.dvctn = dvctn;
// 		}
// 		if(sanPham.dvt !== dvt ){
// 			allowedUpdate.dvt = dvt;
// 		}
// 		if(sanPham.mo_ta !== mo_ta){
// 			allowedUpdate.mo_ta = mo_ta;
// 		}
// 		if(sanPham.id_dm !== id_dm){
// 			const newidDm = await validateForeignKey(id_dm, DM_San_Pham,"Loại danh mục");
// 			allowedUpdate.id_dm = newidDm;
// 		}
// 		if(sanPham.id_th !== id_th){
// 			const newIdTH = await validateForeignKey(id_th, ThuongHieu, "Loại thương hiệu");
// 			allowedUpdate.id_th = newIdTH;
// 		}
// 		if(normalizeBoolean(sanPham.an_hien) !== an_hien){
// 			allowedUpdate.an_hien = an_hien;
// 		}
// 		if(fristHinh){
// 			const processResult = await processSanPhamImgThumanail(fristHinh.path, fristHinh.filename);
// 			if(processResult) newFileCreated.push(processResult);
// 			const thumnailUrl = processFilePath(processResult);
// 			// if(!thumnailUrl){
// 			// 	throw {status: 400, thong_bao: "Lỗi đồng bộ không thể tạo đường dẫn file"};
// 			// }
// 			allowedUpdate.img = thumnailUrl;
// 			if(sanPham.img){
// 				const oldAbsolutePath = covertWebPathToAbsolutePath(sanPham.img)
// 				oldFileToDelete.push(oldAbsolutePath);
// 			}
// 		}
// 		if(Object.keys(allowedUpdate).length > 0){
// 			await sanPham.update(allowedUpdate, {transaction: t});
// 		}
// 		if(hinhSpFiles.length > 0 ){
// 			const currentImg = await IMG_SanPham.findAll({
// 				where: {id_sp: sanPham.id},
// 				attributes: ['url']
// 			});
// 			currentImg.forEach(img=>{
// 				const absolutePath = covertWebPathToAbsolutePath(img.url);
// 				oldFileToDelete.push(absolutePath);
// 			});
// 			await IMG_SanPham.destroy({ where: { id_sp: sanPham.id }, transaction: t});
// 			const hinhSps = hinhSpFiles.map(file=>({
// 				id_sp: sanPham.id,
// 				url: processFilePath(file.path)
// 			}));
// 			await IMG_SanPham.bulkCreate(hinhSps, {transaction: t});
// 		}
// 		if(thuoc_tinh){
// 			await ThuocTinhSP.destroy({where: {id_sp: sanPham.id}, transaction: t});
// 			if(thuoc_tinh.length > 0){
// 				const thuocTinhData = await Promise.all(thuoc_tinh.map(async(item: createThuocTinhSp)=>{
// 					const newTT = await validateForeignKey(item.id_tt, ThuocTinh, "Loại thuộc tính");
// 					return {
// 						id_sp: sanPham.id,
// 						id_tt: newTT,
// 						gia_tri: item.value
// 					}
// 				}));
// 				await ThuocTinhSP.bulkCreate(thuocTinhData, {transaction: t});
// 			}
// 		}
// 		if(bien_the){
// 			const CurrentBienThe = await SanPhamBienThe.findAll({
// 				where: {id_sp: sanPham.id},
// 				attributes: ['id','img']
// 			});
// 			//tạo mản chứ id cũ
// 			const currentId = CurrentBienThe.map(v=> v.id);
// 			//tạo mảng để lưu id mà fe gửi lên để biết cái nào không bị xóa;
// 			const inputId : number[] = [];
// 			for(const [index, item] of bien_the.entries()){
// 				const bienTheFileKey = `hinh_bien_the_${index}`;
// 				const bienTheFile = files[bienTheFileKey]?.[0];
// 				let finalCodeBienThe = item.code;
// 				if(!finalCodeBienThe){
// 					finalCodeBienThe = generateSku();
// 				}
// 				if(!item.gia || !item.so_luong){
// 					throw {status: 400, thong_bao: "Giá và số lượng của biến thể không đc để trống"};
// 				}

// 				let finalImg :string|null = "";
// 				if(item.id){
// 					//th1 cập nhật trường có gửi id
// 					inputId.push(item.id);
// 					//tìm curent biến thế có id trung vioiws item.id
// 					const bienTheDB = CurrentBienThe.find(v=> v.id == item.id);
// 					const existingBienThe = await  SanPhamBienThe.findOne({
// 						where:{
// 						code: finalCodeBienThe,
// 						id: {[Op.not]: item.id}}

// 					})
// 					if(existingBienThe){
// 						throw {status: 409, thong_bao: "Mã Sku của biến thể đã tồn tại mới nhập cái khác"};
// 					}
// 					if(bienTheDB){
// 						finalImg = bienTheDB.img;
// 						//nếu có ảnh mới thì thay ảnh cũ và xóa ảnh file cũ trong public
// 						if(bienTheFile){
// 							finalImg = processFilePath(bienTheFile);
// 							if(bienTheDB.img){
// 								oldFileToDelete.push(covertWebPathToAbsolutePath(bienTheDB.img));
// 							}
// 						}

// 					}
// 					await SanPhamBienThe.update({
// 						ten_bien_the: item.ten_bien_the,
// 						code: finalCodeBienThe,
// 						gia: item.gia,
// 						so_luong: item.so_luong,
// 						img: finalImg
// 					},{where: {id: item.id},transaction: t});
// 				}else{
// 					const existingBienThe = await  SanPhamBienThe.findOne({
// 						where:{
// 						code: finalCodeBienThe}

// 					})
// 					if(existingBienThe){
// 						throw {status: 409, thong_bao: "Mã Sku của biến thể đã tồn tại mới nhập cái khác"};
// 					}
// 					//th 2 tạo mới khi fe không gửi id;

// 					if(bienTheFile){
// 						finalImg = bienTheFile ? processFilePath(bienTheFile) : null;
// 					}
// 					await SanPhamBienThe.create({
// 						id_sp: sanPham.id,
// 						ten_bien_the: item.ten_bien_the,
// 						code: finalCodeBienThe,
// 						gia: item.gia,
// 						so_luong: item.so_luong,
// 						img: finalImg

// 					},{transaction: t});

// 				}
// 			}
// 			const idToDelete = currentId.filter(dbId => !inputId.includes(dbId))//lọc những id có trong db nhưng ko có trong danh sách fe gửi lên
// 			if(idToDelete.length > 0){
// 				//kiêm trả xem  biên thể đó có trong dh không
// 				// const usedVariant = await ChiTietDonHang.findOne({
//                 //     where: {
//                 //         id_bt: idToDelete // Sequelize tự hiểu là tìm id_bt IN [idsToDelete]
//                 //     }
//                 // });
// 				// if(usedVariant){
// 				// 	throw {status: 400, thong_bao: "Không thể xóa biến thể do đã phát sinh đơn hàng, vui lòng chỉnh số lượng về 0 để 0 bán biế thể"}
// 				// }
// 				//lấy danh  sách các biên thể sap xóa để dọn rác
// 				const bienTheToDelete = CurrentBienThe.filter(v=> idToDelete.includes(v.id));
// 				bienTheToDelete.forEach(v=>{
// 					if(v.img){
// 						oldFileToDelete.push(covertWebPathToAbsolutePath(v.img));
// 					}
// 				})
// 				await SanPhamBienThe.destroy({
// 					where: {id: idToDelete},
// 					transaction: t
// 				})
// 			}
// 		}
// 		await t.commit();
// 		if(oldFileToDelete.length > 0){
// 			await Promise.all(oldFileToDelete.map(path=>{
// 				return fs.promises.unlink(path).catch(error=>{
// 					console.warn("Lỗi xóa file cũ:", error.message)
// 					return Promise.resolve();
// 				});
// 			}));

// 		}
// 		return res.status(200).json({thong_bao: "Cập nhật sản phẩm thành công",success: true});

// 	} catch (error) {
// 		await t.rollback();
// 		await cleanUpfiles(req);
// 		if(newFileCreated.length > 0){
// 			await Promise.all(newFileCreated.map(path=>{
// 				return fs.promises.unlink(path).catch(error=>{
// 					console.warn("Lỗi xóa file mới:", error.message)
// 					return Promise.resolve();
// 				})
// 			}))
// 		}

// 		const err = error as CustomError;
// 		// console.log(err.message);
// 		const status = err.status || 500;
// 		const thong_bao = err.thong_bao || "Lỗi máy chủ khi cập nhật sản phẩm";
// 		return res.status(status).json({thong_bao, success: false});
// 	}
// })

export default router;
