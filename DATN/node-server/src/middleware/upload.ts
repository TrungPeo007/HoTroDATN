import multer, { FileFilterCallback, MulterError } from 'multer';
import path from 'path';
import fs from  'fs';
import { NextFunction, Request, RequestHandler, Response } from 'express';
type  multerFile = Express.Multer.File 
const fileFilter = (req : Request,file: multerFile,cb: FileFilterCallback)=>{
    const  fileExtension = path.extname(file.originalname).toLocaleLowerCase();
    const imageExtentions = /\.(jpe?g|png|gif|webp)$/i;
    const checkImage = ()=>{
        if(!imageExtentions.test(fileExtension)){
                return cb (new Error('Chỉ chấp nhận file ảnh JPEG, JPG, PNG, GIF, WEBP cho trường này'));
        }
    }
    switch(file.fieldname){
        case 'hinh_user':
        case 'hinh_dm':
        case 'hinh_th':
        case 'hinh_tin':
        case 'hinh_banner':
        case 'hinh_sp':
        case 'hinh_dg':
        case 'hinh_pttt':
            checkImage();
            break;
        default:
            // thêm mới xuwrw lý trường động  của biến thể
            if(file.fieldname.startsWith('hinh_bien_the_')){
                checkImage();
            }
            break;
    }
    cb(null, true);
};
const storage = multer.diskStorage({
    destination: (req: Request, file: multerFile, cb: (error: Error | null, destination: string)=>void)=>{
        let uploadPath = '';
        switch(file.fieldname){
            case 'hinh_user':
                uploadPath = path.join(__dirname,'..','..','public','user','img');
                break;
            case 'hinh_dm':
                uploadPath = path.join(__dirname,'..','..','public','danh-muc','img');
                break;
            case 'hinh_th': 
                uploadPath = path.join(__dirname,'..','..','public','thuong-hieu','img');
                break;
            case 'hinh_tin': 
                uploadPath = path.join(__dirname,'..','..','public','tin-tuc','img');
                break;
            case 'hinh_sp':
                uploadPath = path.join(__dirname, '..','..','public','san-pham','img');
                break;
            case 'hinh_banner': 
                uploadPath = path.join(__dirname, '..', '..','public','banner','img');
                break;
            case 'hinh_dg': 
                uploadPath = path.join(__dirname, '..', '..', 'public','danh-gia','img');
                break;
            case 'hinh_pttt':
                uploadPath = path.join(__dirname, '..', '..','public','pttt','img');
                break;
            default: 
                if(file.fieldname.startsWith('hinh_bien_the_')){
                    uploadPath = path.join(__dirname, '..','..','public','san-pham','img-bien-the');
                }else{
                    uploadPath = path.join(__dirname,'..','..','public','img');
                }
                break;
            
        }
        fs.mkdirSync(uploadPath, {recursive: true});
        cb(null, uploadPath)
    },
    filename(req: Request, file: multerFile, cb: (error: Error| null, filename: string)=>void) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E5);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);     
    },
});
const variantFields = Array.from({length: 10},(_, i)=>({//do không biến có giá trị value nên set undifine bằng cách _ 
    name: `hinh_bien_the_${i}`,
    maxCount: 10
}))
const uploadFile = multer({
    storage,
    limits: {fileSize: 10 * 1024 * 1024},
    fileFilter
}).fields([
    {name: 'hinh_user', maxCount: 1},
    {name: 'hinh_dm', maxCount: 1},
    {name: 'hinh_th', maxCount: 1},
    {name: 'hinh_tin',maxCount: 1},
    {name: 'hinh_banner', maxCount: 1},
    {name: 'hinh_sp',maxCount: 10},
    {name: 'hinh_dg', maxCount: 4},
    {name: 'hinh_pttt',maxCount: 1},
    ...variantFields
]);
export const uploadMiddleware:RequestHandler = (req: Request, res: Response, next: NextFunction)=>{
    uploadFile(req, res, (err:unknown)=>{
        if(err){
            let thong_bao = `Lỗi không xác định `;
            if(err  instanceof MulterError ){
                thong_bao = `Lỗi Multer: ${err.message}`;
                if(err.code  === 'LIMIT_FILE_SIZE'){
                    thong_bao = 'Kích thước file vượt quá giới hạn cho phép (10MB)';
                }
                if(err.code === 'LIMIT_UNEXPECTED_FILE'){
                    thong_bao = 'Bạn  upload quá số lượng file được cho  phép vui lòng xóa ảnh để upload file';
                }
                return res.status(400).json({
                    status: 'error',
                    code: err.code || 'MULTER_ERROR',
                    thong_bao
                })
            }else if(err instanceof Error){
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_FILE_TYPE',
                    thong_bao: ` Lỗi định dạng File: ${err.message}`
                });
            }else{
                return res.status(500).json({
                    status: 'error',
                    code: 'UNKNOWN_ERROR',
                    thong_bao: 'Đã xảy ra lỗi không xác định trong quá trình upload.'
                })
            }
            
        }
        next();
    });
    
}