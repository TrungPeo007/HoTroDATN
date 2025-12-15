
import path from 'path'
import fs from 'fs';
import sharp from 'sharp';

type  multerFile = Express.Multer.File;
interface thumnailResult {
    optimizedPath: string;
}
export const processFilePath = (file: multerFile | string)=>{//nhận file và path kiểu dạn string
    const filePath = typeof file === 'string' ? file : file.path;
    if(filePath){
        const pathParts = filePath.split('public');
        const relativePath = pathParts[1];
        if(relativePath){
            return relativePath.replace(/\\/g,'/');
        }
        // thay dau \ bằng dấu / để chuẩn với web;
    };
    return null;  
}
export const  covertWebPathToAbsolutePath = (webPath: string)=>{
    
    const projectRoot = path.join(__dirname, '..','..');
    return path.join(projectRoot, 'public', webPath);
}
export const processSanPhamImgThumanail = async(inputPath:  string, filename: string):Promise<string>=>{
    try {
        const uploadDir = path.dirname(inputPath);
        const fileExt = path.extname(filename);
        const fileNameWithOutExt = path.basename(filename, fileExt);//bỏ dduoir file
        const optimizedSubDir = 'optimized';
        const optimizedDir = path.join(uploadDir, optimizedSubDir);
        await fs.promises.mkdir(optimizedDir, {recursive: true});
        const optimizedFileName = `${fileNameWithOutExt}-optimized${fileExt}`;
        const optimizedPath = path.join(optimizedDir, optimizedFileName);
        let image = sharp(inputPath).resize(300,300,{fit: 'inside'});
        if(fileExt === '.jpg' || fileExt === '.jpeg'){
            image = image.jpeg({quality: 80});
        }else if(fileExt === '.png'){
            image = image.png({quality: 80});
        }else if(fileExt === '.webp'){
            image = image.webp({quality: 80});
        }else{
            image = image.jpeg({quality: 80});
        }
        await image.toFile(optimizedPath);
        return optimizedPath;
    } catch (error) {
        // console.log('lỗi khi xử lý hàm  thumnail',error.massege);
        throw error
    }
}