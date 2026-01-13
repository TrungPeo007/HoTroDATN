
import crypto from 'crypto';
import {   PayOswebhookPayLoad } from '../types/thanhtoan';
export const verifyPayOsWebhook = <T extends object>(
  payload: PayOswebhookPayLoad<T>
): T=>{
    const {data, signature} = payload;
    if(!data || !signature){
        throw {status: 400, thong_bao: "Dữ liệu web hook không hợp lệ(thiếu data hoặc signature)"};
    }
    //sắp xếp các key trong object data theo  bảng chữ cái từ a-z
    const sortedDataByKey = Object.keys(data).sort();
    //tạo cchuoiox quyery  string key1=value1$key2 = value2 ...
    const dataQueryStr = sortedDataByKey.map(key =>{
        const rawValue = (data as Record<string, string|number>)[key];
        let value = rawValue;
        if (value === null || value === undefined) {
            value = "";
        } else {
            value = String(value); // Đảm bảo là string (ví dụ số 2000 thành "2000")
        }
        return `${key}=${value}`//data  có key là dang string value là bất kỳ
    }).join('&');
    //hash chuỗi bằng HMAC_SHA256 với checksum Key
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    if(!checksumKey){
        throw {status: 500, thong_bao: "Chưa cấu hình payOS_CHECKSUM_KEY"};
    }
    const mySignature = crypto
        .createHmac('sha256', checksumKey)
        .update(dataQueryStr)
        .digest('hex');
    // console.log("Chuỗi cần hash:", dataQueryStr); 
    // console.log("My Signature:", mySignature);
    // console.log("PayOS Signature:", signature);
        //so sánh cchuwx ký  mình tính ra với chữ ký payos gửi về
    if(mySignature !== signature){
        throw {status: 400, thong_bao: "CHữ ký không khớp (Dữ liệu có thể bị giả mạo)"};
    }
    return data;
}