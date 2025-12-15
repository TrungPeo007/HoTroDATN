import {z} from 'zod';
const bodyThuocTinhSpSchema = z.object({
    ten_thuoc_tinh: z.string()
        .trim()
        .min(3,"Tên thuộc tính không đc để trống và phải hơn 3 ký tự")
})
const paramsThuocTinhSchema = z.object({
    id: z.string().regex(/^\d+$/,"Id thương hiệu phải là số")
});
export const createThuocTinhSpschema = z.object({
    body: bodyThuocTinhSpSchema
});
export const updateThuocTinhSpSchema = z.object({
    body: bodyThuocTinhSpSchema,
    params: paramsThuocTinhSchema
})
export type createThuocTinhInput = z.infer<typeof createThuocTinhSpschema>['body'];
export type updateThuocTinhInput = z.infer<typeof updateThuocTinhSpSchema>;