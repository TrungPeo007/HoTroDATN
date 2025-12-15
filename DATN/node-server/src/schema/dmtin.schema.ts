import {z} from "zod";

export const createDanhMucTinSchema = z.object({
    body:z.object({
        ten_dm: z.string()
            .trim()
            .min(1,"Tên danh mục tin không được để trống"),
        parent_id: z.coerce.number().optional().default(0),//corce là parseint từ string thành số
        an_hien: z.union([z.string(), z.number(), z.boolean()])
            .optional()
            .transform((val)=>{
                if(val === 1 || val === "1" || val === true || val === "true"){
                    return 1;
                }
                return 0;
            }).default(1)
    })
})
const ParamsDanhMucTinSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID danh mục tin phải là số")
});
export  const updateDanhMucTinSchema = z.object({
    params: ParamsDanhMucTinSchema,
    body: z.object({
        ten_dm: z.string()
            .trim()
            .min(1,"Tên danh mục tin không được để trống"),
        parent_id: z.coerce.number().int().optional(),
        stt: z.coerce.number().int().positive("Stt  phải là số nguyên dương").optional(),
        an_hien: z.union([z.string(), z.number(), z.boolean()])
            .optional()
            .transform((val)=>{
                if(val === 1 || val === "1" || val === true || val === "true"){
                    return 1;
                }
                return 0;
            })
    })
});
export type updateDanhMucTinInput = z.infer<typeof updateDanhMucTinSchema>;
export type createDanhMucTinInput = z.infer<typeof createDanhMucTinSchema>['body'];