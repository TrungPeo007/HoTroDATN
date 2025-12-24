import {coerce, z} from 'zod';
const ParamsVoucherSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID phải là số")
})
export const  createVoucherSchema = z.object({
    body: z.object({
        ten_km: z.string().trim().min(5,"Tên khuyến mãi ko  đc dưới 5 ký tự"),
        code: z.string().trim()
            .min(3, "Mã code của khuyển mãi ko dưới 3 ký tự")
            .max(10, "Mã code quá số ký tự cho phép")
            .regex(/^[a-zA-Z0-9]+$/, "Mã code chỉ được chứa chữ và số"),
        loai_km: z.coerce.number().int().refine(val=> [0,1].includes(val), "Giá trị loại khuyến mãi không hợp  lê"),
        gia_tri_giam: z.coerce.number().int().positive("Giá trị giảm phải lớn hơn 0"),
        gia_giam_toi_da: z.coerce.number().int().nonnegative("Giá giảm tối đa không được âm").optional().default(0),
        gia_tri_don_min: z.coerce.number().int().nonnegative("Giá trị đơn tối thiểu không đc âm").optional().default(0),
        so_luong: z.coerce.number().int().positive("Số lượng phải lớn hơn 0").default(100),
        gioi_han_user: z.coerce.number().int().min(1, "giới hạn người dùng tối thiếu là 1").default(1),
        ngay_bd: z.coerce.date("định dạng ngày bắt đầu không hợp lệ")
            .refine((date)=> date >= new Date(new Date().setHours(0,0,0,0)), "Ngày bắt đầu không đươc ở quá khứ"),
        ngay_kt: z.coerce.date("định dạng ngày kết thúc không hợp lệ"),
        trang_thai: z.union([z.string(), z.number(), z.boolean()])
            .optional()
            .transform((val)=>{
                if(val === "1" || val === 1 || val === true || val === "true"){
                    return 1;
                }
                return 0;
            }).default(1),
    })
})
export const VoucherIdSchema = z.object({
    params: ParamsVoucherSchema
})
export const updateVoucherschema = z.object({
    params: ParamsVoucherSchema,
    body: z.object({
        ten_km: z.string().trim().min(5, "Tên khuyến mãi không được dưới 5 ký tự"),
        so_luong: z.coerce.number().int().positive("Số lượng phải lớn hơn 0"),
        ngay_kt: z.coerce.date("định dạng ngày kết thúc không hợp lệ")
            .refine((date)=> date >= new Date(new Date().setHours(0,0,0,0)), "Ngày kết thúc không đươc ở quá khứ"),
        gioi_han_user: z.coerce.number().int().min(1, "giới hạn người dùng tối thiếu là 1"),
        trang_thai: z.union([z.string(), z.number(), z.boolean()])
            .optional()
            .transform((val)=>{
                if(val === "1" || val === 1 || val === true || val === "true"){
                    return 1;
                }
                return 0;
            }),
    })
})
export type updateVoucherInput = z.infer<typeof updateVoucherschema>;
export type ParamVoucherIdInput = z.infer<typeof VoucherIdSchema>['params'];
export type createVoucherInput = z.infer<typeof createVoucherSchema>['body'];