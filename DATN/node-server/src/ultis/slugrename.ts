import crypto from 'crypto';
export const removeVietnameseTones = (str: string): string=>{
    return str
        .normalize('NFD')//tách các dấu ra khỏi chữ 
        .replace(/[\u0300-\u036f]/g, "")//xóa các dấu khi bị tách ra khỏi chữ
        .replace(/đ/g, 'd')//chuyển đ thành d
        .replace(/Đ/g, 'D')// gióng trên
}
export const generateSlug = (text: string): string=>{
    if(!text) return "";
    return removeVietnameseTones(text)
        .toLowerCase()
        .replace(/\s+/g, '-')// thay khoản trang banggwf gạch
        .replace(/[^a-z0-9\-]/g, "");//chỉ giữ lịa số chữ gạnh ngang
}
export const generateSku = ():string=>{
    
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}
export const generateOrderCode = (): string=>{
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `DH-${date}-${random}`;
}