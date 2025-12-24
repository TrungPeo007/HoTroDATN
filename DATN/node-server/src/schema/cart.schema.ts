import {z} from 'zod';
export const createCartSchema = z.object({
    body: z.object({
        id_sp: z.coerce.number().int().positive("ID sản phẩm phải là sô nguyên dương"),
        id_bt: z.coerce.number().int().positive("Id_biến thể phải là số").optional().nullable(),
        so_luong: z.coerce.number().int().min(1, "số lướng phải lớn hơn 0")
    })
})
const paramsCartSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID giỏ  hàng phải là số")
})
export const updateCartSchema = z.object({
    params: paramsCartSchema,
    body: z.object({
        
        so_luong: z.coerce.number().int().min(1, "số lượng phải lớn hơn 0")
    })
})
export const cartIdSchema = z.object({
    params: paramsCartSchema
})
export type cartIdInput = z.infer<typeof cartIdSchema>['params'];
export type updateCartInput = z.infer<typeof updateCartSchema>
export type createCartInput = z.infer<typeof createCartSchema>['body'];