import z from "zod";

export const toggleYeuThichTinSchema = z.object({
    body: z.object({
        id_tin: z.coerce.number().min(1,"ID sản phẩm không hợp lệ")
    })
});//ccais này nếu rông undefine null no chả về id sản phẩm không hợp lệ luôn
//tự đọng tạo type interface
export type toggleYeuThichTinInput = z.infer<typeof toggleYeuThichTinSchema>["body"];
//z.infer là cahs schema thành kiểu ts tương ứng và chr lấy phần body của object