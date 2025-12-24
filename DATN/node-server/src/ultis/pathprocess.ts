
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

export const processDonHangImg = async(orginalDbPath: string): Promise<string>=>{
    try {
        if(!orginalDbPath) return '';//ko  ảnh t rả rổng
        const projectRoot = path.join(__dirname, '..','..');
        const  inputFullPath = path.join(projectRoot,'public', orginalDbPath);
        if(!fs.existsSync(inputFullPath)){
            ///kiểm trả đường dẫn cchinhs có tồn tại hay ko
            console.warn(`Không tìm thấy file ảnh gốc: ${inputFullPath}`);
            return orginalDbPath;
        }
        const outputDirName = 'don-hang';
        const outputDir = path.join(projectRoot,'public',outputDirName);
        if(!fs.existsSync(outputDir)){
            await fs.promises.mkdir(outputDir, {recursive: true});
        }
        const fileExt = path.extname(inputFullPath) || '.jpg';
        const newFileName = `don-hang-${Date.now()}-${Math.round(Math.random() *1000)}${fileExt}`;
        const outputFullPath = path.join(outputDir, newFileName);
        await fs.promises.copyFile(inputFullPath, outputFullPath)
        return outputFullPath;
    } catch (error) {
        console.error("Lỗi tạo ảnh  đơn hàng:", error);
        return orginalDbPath; // Gặp lỗi thì fallback về ảnh gốc
    }
}