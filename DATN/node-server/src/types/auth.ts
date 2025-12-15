

import { JwtPayload } from 'jsonwebtoken';

// Định nghĩa kiểu dữ liệu cho JWT Payload tùy chỉnh
export interface CustomJwtPayload extends JwtPayload {
    id: number;
    tai_khoan: string;
    vai_tro: number;
    ho_ten: string | null;
    token_version: number;
}
export interface RefreshJwtPayload extends JwtPayload{
    id: number;
    token_version: number;
}
//cái này để tạo custom kia thua jwtpayload
export interface SafeUserData{
    ho_ten: string | null;
    tai_khoan: string;
    vai_tro: number;
    email: string;
}
export interface DangKyBody{
    tai_khoan : string;
    email: string;
    mat_khau: string;
    mat_khau_nhap_lai: string;
    dien_thoai: string
}
export interface DangNhapBody{
    tai_khoan: string;
    mat_khau: string;
}
export interface mailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
}
export interface XacThucDangKy{
    token: string;
    email: string;
}
export interface GuiLaiXacThucDKBody{
    email: string;
}

export interface QuenMatKhauBody{
    otp: string;
    mat_khau_moi: string;
    mat_khau_nhap_lai: string;
}
export interface DoiMatKhauBody{
    mat_khau_cu: string;
    mat_khau_moi: string;
    mat_khau_nhap_lai: string;
}
export interface XacThucDangNhapNhanh {
     tokenDangNhap: string;
     email: string;
}

export interface dataToSendLogin{
    user?: object;
    thong_bao?: string;
    success: boolean;
    source: string//key để fe nó nhận diện là dữ lieuj trả về của login google hoặc faceboook
}
export interface InfoAuth{
    thong_bao?: string;
    status?: number;
}
