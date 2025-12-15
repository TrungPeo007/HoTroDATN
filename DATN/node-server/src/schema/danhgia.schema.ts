import {z} from "zod";

export const  createDanhGiaSpSchema = z.object({
    body: z.object({
        id_sp: z.coerce.number().int().positive("Giá trị của id_sp phải là so  nguyên không âm"),
        noi_dung: z.string().trim()
            .min(10,"Nội dung đánh giá không đc dưới 10 ký tự")
            .max(300, "Nội dung phản hồi quá dài "),
        so_sao: z.coerce.number().int("số sao phải là so  nguyên")
            .min(1,"Vui lòng đánh giá ít nhất 1 sao")
            .max(5, "Đánh giá tối đa là 5 sao"),
        // ngay_dg: z.coerce.date()
        //     .max(new Date(),"ngày đánh giá không được ở tương lai")
        //     .optional()
        //     .default(()=> new Date()),
        tinh_nang: z.string().trim().optional(),
        chat_luong: z.string().trim().optional()
    })
})
const ParamDanhGiaSpSchema = z.object({
    id: z.string().regex(/^\d+$/, "Id đánh giá không hợp lệ")
})
export const traLoiDanhGiaSpSchema = z.object({
    params: ParamDanhGiaSpSchema,
    body: z.object({
        phan_hoi: z.string().trim()
            .min(5, "Phản hồi đánh giá không dưới 5 ký tự")
            .max(255, "mày phản hồi nhiều quá shop à")
    })
})
export type  traLoiDanhGiaSpInput = z.infer<typeof traLoiDanhGiaSpSchema>;
export type createDanhGiaSpInput = z.infer<typeof createDanhGiaSpSchema>['body'];
