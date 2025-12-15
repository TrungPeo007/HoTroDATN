

// Định nghĩa kiểu dữ liệu cho user được gắn vào request
export interface AuthUser {
    id: number;
    tai_khoan: string;
    vai_tro: number;
    ho_ten: string | null;
    token_version: string | number;
}

// Mở rộng namespace Express
declare global {
    namespace Express {
        // Mở rộng Request interface từ Express
        interface Request {
            user?: AuthUser; // Thêm thuộc tính user tùy chọn
        }
    }
}

// Đây là một module để đảm bảo các định nghĩa được đưa vào phạm vi toàn cục
export {};