import { Request } from 'express';
import fs from 'fs';
type MulterFieldFiles = {[fieldname: string]: Express.Multer.File[]};
export const cleanUpfiles = async(req: Request)=>{
    if(!req.files) return ;
    const files =  req.files as MulterFieldFiles;
    //object của file là hinh_dm: [file1], hinh_sp: [file2, file3]
    //object value lấy ra  1 mảng  value của files gồm [[file1], [file2 , file3]];
    //.flat làm phảng thành file1 và file 2 và ffile 3 [file1, file2, file3] tránh việc  mảng lồng mảng xóa file ko đc
    const  allFiles =  Object.values(files).flat();
    if(allFiles.length  === 0) return;
    await Promise.all(
        allFiles.map((file)=>{
            return fs.promises.unlink(file.path).catch((error)=>{
                    console.warn(` Cảnh báo: Không thể xóa tệp vật lý ${file.path}`, error.message);
                return Promise.resolve();    
            });
        })
    );
}