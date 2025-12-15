import {  dataToSendLogin } from "../types/auth";

export const taoTrangPhanHoiHtml = (
    tieu_de: string,
    thong_bao: string,
    link: string,
    buttonText: string
):string=>{//ép kieur trả cho  html là chuỗi html
    const isSuccess = tieu_de.toLocaleLowerCase().includes("thành công");
    const mainColor = isSuccess ? "#02A4E9" : "#E94E02";
    const borderColor = isSuccess ?  "#02A4E9" : "#E94E02";
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 30px; background-color: #fff; border: 2px solid ${borderColor}; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h1 style="font-size: 28px; color: ${mainColor}; margin-bottom: 20px;">
                ${tieu_de}
            </h1>
            <p style="font-size: 16px; color: #333333; margin-bottom: 30px; line-height: 1.6;">
                ${thong_bao}
            </p>
            <a href="${link}" 
               style="display: inline-block; padding: 12px 24px; background-color: ${mainColor}; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">
               ${buttonText}
            </a>
        </div>
    `
}
export const taoTrangPhanHoiDangKyHtml = (
    tai_khoan: string,
    verifylink: string,
):string=>{
    return `
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 2px solid #02A4E9; border-radius: 12px; text-align: center; font-family: Arial, Helvetica, sans-serif; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <img src="https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2024_1_29_638421681698161851_750.jpg" alt="Logo KADU Shop" style="max-width: 150px; height: auto; display: block; margin: 0 auto 20px;">
            <h3 style="font-family: Georgia, 'Times New Roman', Times, serif; font-size: 24px; color: #02A4E9; margin: 0 0 15px; font-weight: bold;">
                Ban Quản Trị KADU Shop Xin Chào ${tai_khoan}
            </h3>
            <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px;">
                Cảm ơn bạn đã đăng ký thành viên tại KADU Shop. Vui lòng xác thực tài khoản bằng cách nhấp vào nút bên dưới:
            </p>
            <a
                href="${verifylink}"
                style="display: inline-block; padding: 12px 24px; background-color: #02A4E9; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px; margin: 10px 0;"
            >
                Xác Thực Tài Khoản
            </a>
            <p style="font-size: 14px; color: #333333; line-height: 1.6; margin: 10px 0 0;">
                Thân ái,<br>
                <strong>Đội ngũ KADU Shop</strong>
            </p>
        </div>
    `
}
export const  taoTrangPhanHoiQuenPass = (
    tai_khoan: string,
    otp: string
):string =>{
    return `
        <div style="max-width: 600px; margin: 40px auto; padding: 30px; background-color: #ffffff; border: 2px solid #02A4E9; border-radius: 12px; text-align: center; font-family: Arial, Helvetica, sans-serif; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <h3 style="font-family: Georgia, 'Times New Roman', Times, serif; font-size: 24px; color: #02A4E9; margin: 0 0 20px; font-weight: bold;">
                Xin chào ${tai_khoan},
            </h3>
            <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px;">
                Mã OTP của bạn là: <strong style="font-size: 20px; color: #02A4E9;">${otp}</strong>
            </p>
            <p style="font-size: 14px; color: #333333; line-height: 1.6; margin: 0;">
                OTP này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng sử dụng ngay để đảm bảo an toàn.
            </p>
            <p style="font-size: 14px; color: #333333; line-height: 1.6; margin: 20px 0 0;">
                Thân ái,<br>
                <strong>Đội ngũ KADU Shop</strong>
            </p>
        </div>`;
}
export const  taoTrangDangNhapNhanh = (
    tai_khoan: string,
    magicLink: string
):string =>{
    return `
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 2px solid #02A4E9; border-radius: 12px; text-align: center; font-family: Arial, Helvetica, sans-serif; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <img src="https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2024_1_29_638421681698161851_750.jpg" alt="Logo KADU Shop" style="max-width: 150px; height: auto; display: block; margin: 0 auto 20px;">
            <h3 style="font-family: Georgia, 'Times New Roman', Times, serif; font-size: 24px; color: #02A4E9; margin: 0 0 15px; font-weight: bold;">
                Đăng Nhập Nhanh - KADU Shop
            </h3>
            <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px;">
                Xin chào <strong>${tai_khoan}</strong>,<br>
                Chúng tôi vừa nhận yêu cầu đăng nhập nhanh vào tài khoản của bạn.
            </p>
            <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px;">
                Nhấp vào nút bên dưới để <strong>đăng nhập ngay lập tức</strong> (không cần mật khẩu):
            </p>
            <a
                href="${magicLink}"
                style="display: inline-block; padding: 14px 28px; background-color: #02A4E9; color: #ffffff; text-decoration: none; font-size: 17px; font-weight: bold; border-radius: 8px; margin: 15px 0; box-shadow: 0 4px 8px rgba(2, 164, 233, 0.3);"
            >
                Đăng Nhập Ngay
            </a>
            <p style="font-size: 14px; color: #666666; line-height: 1.6; margin: 20px 0 10px; padding: 0 20px;">
                Link này sẽ <strong>hết hạn sau 15 phút</strong> vì lý do bảo mật.
            </p>
            <p style="font-size: 14px; color: #666666; line-height: 1.6; margin: 0; padding: 0 20px;">
                Nếu bạn <strong>không yêu cầu đăng nhập</strong>, vui lòng bỏ qua email này.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
            <p style="font-size: 13px; color: #999999; line-height: 1.5; margin: 0;">
                Thân ái,<br>
                <strong>Đội ngũ KADU Shop</strong><br>
                <span style="font-size: 11px;">Email tự động - Vui lòng không trả lời</span>
            </p>
        </div>`;
}
//hàm này đang tắt if else khi nào có fe làm deploy thì sẽ mở lên lại
export const taoTrangPopupPortMessage = (
    clientUrl: string, 
    data: object):string=>{
        //lưu ý nếu chuyển từ json để nhúng vào htmk thì phải lọc lại để tránh XSS

        const jsonData = JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/'/g, '\\u0027');
        //cchuyee cac ký tư huy hiểm thành safe ký tự
        const dataDangNhap = data as dataToSendLogin;
        const message = dataDangNhap.success 
            ? "Đăng nhập thành công! Cửa số này sẽ tự đóng"
            : "Có lỗi xảy ra cửa sổ này sẽ tự đóng";
            //nhớ sửa lại !                                
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Đang xử lý...</title>
            </head>
            <body>
                <p>${message}</p>
                <script>
                    // Đảm bảo rằng trang này được mở bằng window.opener
                    document.addEventListener('DOMContentLoaded', function() {
                        if (!window.opener) {
                            // Gửi dữ liệu về cửa sổ cha
                            // ${jsonData} sẽ trở thành: { "user": {...}, "success": true, ... }
                            window.opener.postMessage(${jsonData}, '${clientUrl}');
                            
                            // Tự động đóng cửa sổ popup
                            window.close();
                        } else {
                            // Fallback nếu trang không được mở từ popup
                            // document.body.innerHTML = '<p>Vui lòng đăng nhập từ trang ứng dụng chính.</p>';
                        }
                    });
                </script>
            </body>
            </html>`;
}
