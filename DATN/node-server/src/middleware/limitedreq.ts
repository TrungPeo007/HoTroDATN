import rateLimit from "express-rate-limit"

export const resendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,//15 phút
    max: 3,//cho phép 3 request từ 1 ip
    message: {
        
        thong_bao: "Bạn đã yêu cầu gửi lại quá nhiều lần. Vui lòng thử lại sau 15 phút.",
        success: false
    },
    standardHeaders: true, // để gửi header chuẩn http rare limit retry-after
    legacyHeaders: false//kiểu cũ nên  tắt

})