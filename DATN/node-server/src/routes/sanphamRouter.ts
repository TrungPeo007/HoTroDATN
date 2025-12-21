import express, { Request, Response } from "express";
import fs from "fs";
import {
  createSanPhamInput,
  createSanPhamSchema,
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
} from "../models";
import { Op } from "sequelize";
import { generateSku, generateSlug } from "../ultis/slugrename";
import { validateForeignKey } from "../ultis/validate";

import { AuthUser } from "../types/express";
import {
  createBienTheSp,
  createThuocTinhSp,
  GetALLSanPHam,
  ImgBienThe,
  ThuocTinhMap,
} from "../types/sanpham";
import { cleanUpfiles } from "../ultis/file";
const router = express.Router();
interface CustomError {
  message?: string;
  status?: number;
  thong_bao?: string;
}
type MulterFieldFiles = { [filedname: string]: Express.Multer.File[] };
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
      return res
        .status(500)
        .json({ thong_bao: "Lỗi máy chủ khi lấy danh sách sản phẩm" });
    }
  }
);
router.post<{}, {}, createSanPhamInput>(
  "/",
  uploadMiddleware,
  validate(createSanPhamSchema),
  async (req, res) => {
    const t = await sequelize.transaction(); //tạo cái nay để lưu dũ liệu dồng bộ ở các bnagr
    const generatedFiles: string[] = [];
    try {
      const userPayload = req.user as AuthUser;
      const id_user = userPayload.id;

      const {
        ten_sp,
        code,
        gia,
        sale,
        so_luong,
        xuat_xu,
        dvctn,
        dvt,
        mo_ta,
        an_hien,
        id_dm,
        id_th,
        thuoc_tinh,
        bien_the,
      } = req.body;
      const files = req.files as MulterFieldFiles;
      const hinhSpFiles = files?.["hinh_sp"] || [];
      const fristHinh = hinhSpFiles?.[0];
      if (!gia || !so_luong) {
        throw {
          status: 400,
          thong_bao: "Bạn chưa nhập giá với số lượng sản phẩm",
        };
      }
      if (!fristHinh) {
        throw { status: 400, thong_bao: "Bạn cần chọn ít nhất 1 hình" };
      }
      const processResult = await processSanPhamImgThumanail(
        fristHinh.path,
        fristHinh.filename
      );
      if (processResult) generatedFiles.push(processResult);
      const thumnailUrl = processFilePath(processResult);
      if (!thumnailUrl) {
        throw {
          status: 404,
          thong_bao: " Lỗi đồng bộ không thể tạo đường dẫn file",
        };
      }
      //tạo mã sku tự đông nếu ko thằng nào nhập

      let finalCode = code;
      if (!finalCode) {
        finalCode = generateSku();
      }
      const existing = await SanPham.findOne({
        where: { [Op.or]: [{ ten_sp: ten_sp }, { code: code }] },
      });
      if (existing) {
        if (existing.ten_sp === ten_sp) {
          throw {
            status: 409,
            thong_bao: "Tên sản phẩm đã tồn tại mời nhập tên khác",
          };
        }
        if (existing.code === finalCode) {
          throw {
            status: 409,
            thong_bao: "Mã Sku đã tồn tại mời nhập cái khác",
          };
        }
      }
      const slug = generateSlug(ten_sp);
      const existingSlug = await SanPham.findOne({
        where: { slug: slug },
      });
      if (existingSlug) {
        throw {
          status: 409,
          thong_bao: "Slug đã tồn tại vui lòng điều chỉnh lại tên sản phẩm",
        };
      }
      const newIdDM = await validateForeignKey(
        id_dm,
        DM_San_Pham,
        "Loại danh mục"
      );
      const newIdTT = await validateForeignKey(
        id_th,
        ThuongHieu,
        "Loại thương hiệu"
      );
      const newSp = await SanPham.create(
        {
          ten_sp: ten_sp,
          code: finalCode,
          slug: slug,
          img: thumnailUrl,
          gia: gia,
          sale: sale,
          so_luong: so_luong,
          xuat_xu: xuat_xu || null,
          dvctn: dvctn,
          mo_ta: mo_ta,
          dvt: dvt,
          an_hien: an_hien,
          id_user: id_user,
          id_dm: newIdDM,
          id_th: newIdTT,
        },
        { transaction: t }
      );
      console.log(newSp);
      //tạo album ảnh cho sản phẩm
      const hinhSps = hinhSpFiles.map((file) => ({
        id_sp: newSp.id,
        url: processFilePath(file.path),
      }));
      //tạo nhiều bản con trong 1 query là bulkCreate
      await IMG_SanPham.bulkCreate(hinhSps, { transaction: t });
      if (thuoc_tinh && thuoc_tinh.length > 0) {
        const thuocTinhData = await Promise.all(
          thuoc_tinh.map(async (item: createThuocTinhSp) => {
            const newTT = await validateForeignKey(
              item.id_tt,
              ThuocTinh,
              "Loại thuộc tính"
            );
            return {
              id_sp: newSp.id,
              id_tt: newTT,
              gia_tri: item.value,
            };
          })
        );
        await ThuocTinhSP.bulkCreate(thuocTinhData, { transaction: t });
      }
      if (bien_the && bien_the.length > 0) {
        //th người dùng gửi lên  sku
        const skuSet = new Set(); //khoiwr taoj thuoc tinh set de tim gia tri trung lap
        for (const item of bien_the) {
          if (item.code) {
            if (skuSet.has(item.code)) {
              //nó sễ kiemr trả trong sku
              throw { status: 400, thong_bao: "Bạn nhập mã SKU bị trùng lặp" };
            }
            skuSet.add(item.code);
          }
        }

        const bienTheData = await Promise.all(
          bien_the.map(async (item: createBienTheSp, index: number) => {
            const bienTheFileKey = `hinh_bien_the_${index}`;
            const bienTheFiles = files[bienTheFileKey]?.[0];
            const bienTheHinhPath = bienTheFiles
              ? processFilePath(bienTheFiles)
              : null;
            let finalCodeBienThe = item.code;
            if (!finalCodeBienThe) {
              finalCodeBienThe = generateSku();
            }
            if (!item.gia || !item.so_luong) {
              throw {
                status: 400,
                thong_bao: "giá và số lượng của biến thể ko đc để trống",
              };
            }
            const existingBienThe = await SanPhamBienThe.findOne({
              where: { code: finalCodeBienThe },
            });
            if (existingBienThe) {
              throw {
                status: 409,
                thong_bao:
                  "mã Sku của biến thể ko đc trùng nhau  vui lòng kiêm trả lại",
              };
            }
            return {
              id_sp: newSp.id,
              ten_bien_the: item.ten_bien_the,
              code: finalCodeBienThe,
              gia: item.gia,
              so_luong: item.so_luong,
              img: bienTheHinhPath,
            };
          })
        );

        await SanPhamBienThe.bulkCreate(bienTheData, { transaction: t });
      }
      await t.commit();
      return res.status(200).json({
        thong_bao: ` Đã thêm sản phẩm có ID là ${newSp.id}`,
        success: true,
      });
    } catch (error) {
      await t.rollback(); //roll bac dọn dẹp
      await cleanUpfiles(req);
      if (generatedFiles.length > 0) {
        await Promise.all(
          generatedFiles.map((filePath) => {
            return fs.promises.unlink(filePath).catch((err) => {
              console.warn(
                ` Không xóa được file optimized ${filePath}:`,
                err.message
              );
              return Promise.resolve();
            });
          })
        );
      }
      const err = error as CustomError;
      console.log(err.message);
      const status = err.status || 500;
      const thong_bao = err.thong_bao || "LỖi máy chủ khi thêm sản phẩm mới";
      return res.status(status).json({ thong_bao, success: false });
    }
  }
);
router.get<updateSanPhamInPut["params"]>(
  "/:id",
  validate(sanPhamIdSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      // if(isNaN(Number(id)) || Number(id) > 0){
      // 	throw {status: }
      // }
      const sanPham = await SanPham.findByPk(id, {
        attributes: [
          "id",
          "ten_sp",
          "code",
          "slug",
          "img",
          "gia",
          "sale",
          "so_luong",
          "da_ban",
          "luot_xem",
          "xuat_xu",
          "dvctn",
          "dvt",
          "noi_bat",
          "mo_ta",
          "an_hien",
          "id_dm",
          "id_th",
          "createdAt",
        ],
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
      });
      if (!sanPham) {
        throw {
          status: 404,
          thong_bao: "Sản phẩm không tồn tại vui lòng kiểm trả lại",
        };
      }
      const sanPhamData = sanPham.toJSON();
      const formattedThuocTinh = sanPhamData.thuoctinhsp.map(
        (tt: ThuocTinhMap) => ({
          id: tt.id_tt,
          ten: tt.ten_thuoc_tinh.ten_thuoc_tinh,
          gia_tri: tt.gia_tri,
        })
      );

      const finalResult = {
        ...sanPhamData,
        thuoctinhsp: formattedThuocTinh,
      };
      return res.status(200).json({ data: finalResult, success: true });
    } catch (error) {
      const err = error as CustomError;
      console.log(err.message);
      const status = err.status || 500;
      const thong_bao =
        err.thong_bao || "Lỗi máy chủ khi lấy chi tiết sản phẩm";
      return res.status(status).json({ thong_bao, success: false });
    }
  }
);
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

export default router;
