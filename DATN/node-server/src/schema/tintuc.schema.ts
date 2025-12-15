import {z} from "zod";
// Import thằng này thì chạy ở đâu cũng được (Nodejs hay Browser đều cân hết)
import  DOMPurify  from "isomorphic-dompurify";
export const createTinTucSchema = z.object({
    body: z.object({
        tieu_de: z.string()
            .trim()
            .min(1,"Tiêu đề không được để trống")
            .max(255,"Tiêu đề quá dài"),
        id_dm: z.coerce.number().int().positive("ID danh mục phải là số dương"),
        noi_dung: z.string()
            .min(10,"Nội dung bài viết quá ngắn tối thiếu 10 ký tự")
            .transform((val)=>{
                const cleanHTML = DOMPurify.sanitize(val);
                return cleanHTML.trim()
            }),
        tac_gia: z.string().trim().optional(),
        an_hien: z.union([z.string(), z.number(), z.boolean()])
            .optional()
            .transform((val)=>{
                if(val === 1 || val === "1" || val === true || val === "true") return 1;
                return 0;
            })
    })
});
const ParamsTinTucSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID tin tức phải là số")
});
export const updateTinTucSchema = z.object({
    params: ParamsTinTucSchema,
    body: z.object({
        tieu_de: z.string()
            .trim()
            .min(1,"Tiêu đề không được để trống")
            .max(255,"Tiêu đề quá dài"),
        id_dm: z.coerce.number().int().positive("ID danh mục phải là số dương"),
        noi_dung: z.string()
            .min(10,"Nội dung bài viết quá ngắn tối thiếu 10 ký tự")
            .transform((val)=>{
                const cleanHTML = DOMPurify.sanitize(val);
                return cleanHTML.trim()
            }),
        tac_gia: z.string().trim().optional(),
        an_hien: z.union([z.string(), z.number(), z.boolean()])
            .optional()
            .transform((val)=>{
                if(val === 1 || val === "1" || val === true || val === "true") return 1;
                return 0;
            })
    })
})
export type createTinTucInput = z.infer<typeof createTinTucSchema>['body'];
export type updateTinTucInput = z.infer<typeof updateTinTucSchema>;