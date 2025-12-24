import {z} from 'zod';
export const previewDonHangSchema = z.object({
    body: z.object({
        items: z.array(
            z.object({
                id_sp: z.coerce.number().int().positive("ID sản phẩm phải hợp lệ" ),
                so_luong: z.coerce.number().int().positive("Số lượng phải lớn hơn  0"),
                id_bt: z.coerce.number().int().nullable().optional()
            })
        ).min(1, "Giỏ hàng không được trống"),
        id_km: z.coerce.number().int().optional()
    })
})
export const createDonHangSchema = z.object({
    body: z.object({
        id_dia_chi: z.coerce.number().int().positive("Vui lòng chọn địa chỉ giao hàng"),
        ghi_chu: z.string().optional(),
        id_pttt: z.coerce.number().int().positive("Phương thức thanh toán không hợp lệ"),
        id_km: z.coerce.number().int().optional(),
        items: z.array(
            z.object({
                id_sp: z.coerce.number().int().positive(),
                so_luong: z.coerce.number().int().positive("Số lượng phải lớn hơn 0"),
                id_bt: z.coerce.number().int().nullable().optional()
            })
        ).min(1, "Đơn hàng phải có ít nhất 1 sản phẩm")
    })
})
export const getDonHangDetailSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID phải là số")
    })
});
export const cancelDonHangSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID phải là số")
    }),
    body: z.object({
        ly_do: z.string().optional()
    })
})
export const changeStatusDonHangSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID phải là số")
    }),
    body: z.object({
        trang_thai_moi: z.coerce.number().int().refine(val=> [1,2,3,4].includes(val), "Giá trị trạng thái không hợp lệ"),
        ly_do: z.string().trim().optional()
    })
})
export const changeStatusDonHangShopSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID phải là số")
    }),
    body: z.object({
       
        ly_do: z.string().trim().min(5,"Lý do hủy đơn  phải trên  5 ký tự")
    })
})

export type changeStatusDonHangShopInput = z.infer<typeof changeStatusDonHangShopSchema>;
export type getDonHangDetailInput = z.infer<typeof getDonHangDetailSchema>['params'];
export type changeStatusDonHangInput = z.infer<typeof changeStatusDonHangSchema>;
export type cancelDonHangInput = z.infer<typeof cancelDonHangSchema>
export type createDonHangInput = z.infer<typeof createDonHangSchema>['body'];
export type previewDonHangInput = z.infer<typeof previewDonHangSchema>['body'];