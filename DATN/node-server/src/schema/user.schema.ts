import {z} from 'zod';
export const updateUserSchema = z.object({
    body: z.object({
        ho_ten: z.string().trim().min(5, "Họ và tên không được dưới 5 ký  tự"),
        dien_thoai: z.string().trim().min(9, "số điện thoại không được dưới 9 ký tự")
    })
})
export type updateUserInput = z.infer<typeof updateUserSchema>['body'];