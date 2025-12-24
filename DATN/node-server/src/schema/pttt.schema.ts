import {z} from 'zod';
export const createPTTTschema = z.object({
    body: z.object({
        ten_pt: z.string().trim().min(5,"Tên phuong thức thanh toán trên 5 ký tự"),
        code: z.string().trim().min(1,"Tên code không đc để trống"),
        an_hien: z.union([z.number(), z.boolean(), z.string() ])
            .optional()
            .transform((val)=>{
                if(val === "1" || val === 1 || val === true || val === "true"){
                    return 1;
                }
                return 0;
            }).default(1)
    })
})
const ParamsPTTTSchema = z.object({
    id: z.string().regex(/^\d+$/,"ID Phương thức thanh toán phải là số")
});
export const PTTTIdSchema = z.object({
    params: ParamsPTTTSchema
})
export const updatePTTTSchema = z.object({
    params: ParamsPTTTSchema,
    body: z.object({
        ten_pt: z.string().trim().min(5,"Tên phuong thức thanh toán trên 5 ký tự"),
        code: z.string().trim().min(1,"Tên code không đc để trống"),
        an_hien: z.union([z.number(), z.boolean(), z.string() ])
            .optional()
            .transform((val)=>{
                if(val === "1" || val === 1 || val === true || val === "true"){
                    return 1;
                }
                return 0;
            }).default(1)
    })
})
export type createPTTTInput = z.infer<typeof createPTTTschema>['body'];
export  type paramPTTTIdInput = z.infer<typeof PTTTIdSchema>['params'];
export type updatePTTTInput = z.infer<typeof updatePTTTSchema>;