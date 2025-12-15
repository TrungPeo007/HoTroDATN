import {ZodObject, ZodError} from 'zod'

import { NextFunction, Request, Response } from 'express';
import { cleanUpfiles } from '../ultis/file';
const validate = (schema: ZodObject<any>)=>//trả về hàm áync
    async(req: Request, res: Response, next: NextFunction)=>{
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            })//do thằng zod để ép kiểu id thành number nên chỗ param sẽ báo lỗi mặc định nó là string paramdicrery
            //gán lại dữ liệu đã làm sạch
            req.body = parsed.body;
            req.params = parsed.params as  any; //ở dẩy bảo đảm là t muốn dùng number ở  dẩy cho tiện nên bỏ qua nha cu
            next();
        } catch (error) {
            //issule có thuộc tín [mesege, path, code] và sẽ tạo ra 1 map chỉ chứa lỗi
            await  cleanUpfiles(req);
            if(error instanceof ZodError){
                //trả về lỗi đầu tiên gặp phải
                const thong_bao  = error.issues[0]?.message;
                return res.status(400).json({thong_bao, success: false});
            }
            const otherError = error as Error;
            return res.status(400).json({
                thong_bao : otherError.message || "Lỗi validation không xác định",
                success: false
            })
        }
    }

export default validate;