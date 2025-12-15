import {z} from 'zod';
import  DOMPurify  from 'isomorphic-dompurify';
const ThuocTinhSanPhamSchema = z.object({
    id_tt: z.coerce.number().int().positive("Giá trị của id_tt phải là giá trị nguyên không âm"),
    value: z.string().trim().min(1, "Giá trị thuộc tính không được để trống")
});
const BienTheSanPhamSchema = z.object({
    ten_bien_the: z.string().trim().min(5, "Tên biến thể không được để trống và lớn hơn 5 ký tự"),
    code: z.string().trim().optional(),//sku của biến thể
    gia: z.coerce.number().int().nonnegative().default(0),
    so_luong: z.coerce.number().int().default(0)
});
export const createSanPhamSchema = z.object({
    body: z.object({
        ten_sp: z.string().trim().min(5, "Tên sản phẩm không được dưới 5 ký tự"),
        code: z.string().trim().optional(),//sku cha
        // gia: z.coerce.number().int().nonnegative().default(0),
        gia: z.coerce.number().int().nonnegative().refine(val => val !== undefined, {
            message: "Gia bắt buộc phải nhập"
        }),
        sale: z.coerce.number().int().nonnegative().default(0),
        so_luong: z.coerce.number().int().nonnegative().refine(val => val !== undefined, {
            message: "Số lượng bắt buộc phải nhập"
        }),
        xuat_xu: z.string().trim().optional(),
        dvctn: z.string().trim().optional(),
        dvt: z.string().trim().min(3, "Đơn vị tính phải trên 3 ký tự"),
        mo_ta: z.string().trim().min(10, "Mô tả không được dưới 10 ký tự").transform(val=> DOMPurify.sanitize(val)),
        an_hien: z.union([z.string(), z.number(), z.boolean()])
        .optional()
        .transform((val)=>{
            if(val === "1" || val === 1 || val === true || val === "true"){
                return 1;
            }
            return 0;
        }).default(1),
        id_dm: z.coerce.number().int().positive("Id Dm phải là số nguyên dương"),
        id_th: z.coerce.number().int().positive("ID thương hiệu phải là số nguyên dượng"),
        thuoc_tinh: z.preprocess((val)=>{
            if(typeof val === 'string'){//nếu val fe trả về dữ liệu  string thì trả về object thật để zod xử lý
                try {return JSON.parse(val);}catch{//nếu lỗi trả mảng rỗng tránh crash servvver
                    return [];
                }
            }
            return val;//nếu ko gửi dạng string nó sẽ skipp và trả về nguyên giá trị
        },z.array(ThuocTinhSanPhamSchema).optional().default([])),//nó sẽ kiêm trả thuoctinh phải là mảng nếu ko có thì 0 báo lỗi validate và trả  vefef mảng rổng
        bien_the: z.preprocess((val)=>{
            if(typeof val === 'string'){
                try{ return JSON.parse(val)}catch{ return [];}

            }
            return val;
        },z.array(BienTheSanPhamSchema).optional().default([]))
    })
})
 const ParamsSanPhamSchema = z.object({
    id: z.string().regex(/^\d+$/,"ID sản phẩm phải là số")
})
export const  updateSanPhamSchema = z.object({
    params: ParamsSanPhamSchema,

})
export const sanPhamIdSchema = z.object({
    params: ParamsSanPhamSchema
})
export type ParamSanPhamIdInput = z.infer<typeof sanPhamIdSchema>['params'];
export type updateSanPhamInPut = z.infer<typeof updateSanPhamSchema>;
export type createSanPhamInput = z.infer<typeof createSanPhamSchema>['body'];