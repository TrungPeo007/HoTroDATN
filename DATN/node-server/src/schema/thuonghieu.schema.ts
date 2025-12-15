import {z} from 'zod';
 const BodyThuongHieuSpSchema = z.object({
        ten_th: z.string()
            .trim()
            .min(1,"Tên thương hiệu không đc để trống"),
        slug: z.string().trim().optional()
        .refine((val)=>{
            if(!val) return true;//khhong nhap thi thoi
            const slugRegex = /^[a-z0-9-]+$/;
            return slugRegex.test(val);
        },"Slug chỉ được nhập số, chữ thường không dấu và dấu gạch ngang (-)"),
        an_hien: z.union([z.string(), z.number(), z.boolean()])
        .optional()
        .transform((val)=>{
            if(val === "1" || val === 1 || val === true || val === "true"){
                return 1;
            }
            return 0;
        }).default(1)
})
const ParamsThuongHieuSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID thương hiệu phải là số")
});
export const createThuongHieuSpSchema = z.object({
    body: BodyThuongHieuSpSchema
})
export const updateThuongHieuSpSchema = z.object({
    body: BodyThuongHieuSpSchema,
    params: ParamsThuongHieuSchema
})
export type createThuongHieuInput = z.infer<typeof createThuongHieuSpSchema>['body'];
export type updateThuongHieuInput = z.infer<typeof updateThuongHieuSpSchema>['body'];