import {z} from 'zod';
export const createThanhToanSchema = z.object({
	body: z.object({
		id_dh: z.coerce.number().int().positive("ID đơn hàng không hợp lệ")
	})
});
export const ParamsThanhToanIdSchema = z.object({
	params: z.object({
		id: z.string().regex(/^\d+$/,"ID đơn hàng phải là số")
	})
})
export const  XyLyRutTienSchema = z.object({
	params: z.object({
		id: z.string().regex(/^\d+$/,"ID đơn hàng phải là số")
	}),
	body: z.object({
		trang_thai: z.coerce.number().int().refine((val)=> [1, 2].includes(val),{
			message: "Trạng thái không hợp lệ. Chỉ chấp nhân 1(Duyệt),  2 là (từ chối)"
		
		}),
		ly_do: z.string().optional()
		
	})
});
export type XyLyRutTienInput = z.infer<typeof XyLyRutTienSchema>;

export type ParamsThanhToanIdInput = z.infer<typeof ParamsThanhToanIdSchema>['params']
export type createThanhToanInput = z.infer<typeof createThanhToanSchema>['body'];