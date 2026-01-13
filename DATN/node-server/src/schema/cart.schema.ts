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
export const toggleCartSchema = z.object({
    
    body: z.object({
        id_gh_ct: z.union([
            z.number().int().positive(),
            z.array(z.number().int().positive())
        ]).transform((val) => {
            if (Array.isArray(val)) return val; // Nếu là mảng thì giữ nguyên
            return [val]; // Nếu là số thì nhét vào mảng
        }),
        da_chon: z.union([z.string(), z.number(), z.boolean()])
        .optional()
        .transform((val)=>{
            if(val === undefined){
                return undefined;
            }
            if(val === "1" || val === 1 || val === true || val === "true"){
                return 1;
            }
            return 0;
        }),
    })
})
export const mergeCartSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            id_sp: z.coerce.number(),
            id_bt: z.coerce.number().nullable().optional(), // Có thể null
            so_luong: z.coerce.number().min(1)
        })).min(1, "Giỏ hàng local trống thì không cần gọi api này")
    })
});

export type MergeCartInput = z.infer<typeof mergeCartSchema>['body'];
export type toggleCartInput = z.infer<typeof toggleCartSchema>;
export type cartIdInput = z.infer<typeof cartIdSchema>['params'];
export type updateCartInput = z.infer<typeof updateCartSchema>
export type createCartInput = z.infer<typeof createCartSchema>['body'];