import {z} from 'zod';
export const createShopSchema = z.object({
    body:z.object({
        ten_shop: z.string().trim().min(5, "Tên shop không đc dưới 5 ký tự")    
    })
})
export const rutTienSchema = z.object({
    body: z.object({
        so_tien: z.coerce.number("số tiền phải là số")
            .min(50000, "Số tiền tối thiểu là 50.000đ")
            .max(50000000, "số tiền rút tối đa 1 lần là 50 triệu"),
        ten_ngan_hang: z.string().trim().min(1, "Tên ngân hàng không được để trống"),
        so_tk: z.string().trim().nonempty("Vui lòng nhập số tài khoản"),
        ten_chu_tk: z.string().trim().nonempty("Vui  lòng nhập  tên chủ tài khoản").transform((val) => val.toUpperCase()) 
            // Sau khi viết hoa xong mới check Regex (Chỉ chấp nhận Chữ cái và Khoảng trắng)
            .refine((val) => /^[A-Z ]+$/.test(val), "Tên chủ tài khoản phải viết không dấu"),
        ghi_chu: z.string().trim().optional()
    })
})
export type rutTienInput = z.infer<typeof rutTienSchema>['body'];
export type createShopInput = z.infer<typeof createShopSchema>['body']