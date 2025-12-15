import crypto from 'crypto'
const  ALGORITHM = 'aes-256-cbc';//chỉ định thuật toán mẫ hóa ở đây là dùng khóa 256 = 32 type 
//bufter để lluw dữ liệu thô byte(aes-256): 32 byte iv cho  cbc: 16 byte nói cchung là buffter chuyên chuỗi thành byte
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY||"976666f3796acae940c8651c9ce11ec44ddb7b9a223e29d2100c8d43fd414962",'hex');
const IV_LENGTH = 16//2 ký tự  hex = 1 byte
export const encrypt = (text: string): string=>{
	//tạo ra một chuỗi 16 byte ngẫu nhiên cho mỗi lần mã hóa
	const iv = crypto.randomBytes(IV_LENGTH);
	//tạo cipher với thuật toán,key và iv
	const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
	//mã hóa phần chính
	let encrypted = cipher.update(text, 'utf8', 'hex');
	//mã hóa phần cuios nếu con block dỡ dang
	encrypted += cipher.final('hex');
	//gợp lại thành chuỗi hex bằng cacchs ghép iv đã chuyển về hex
	return iv.toString('hex') + ':' + encrypted;

}
//hàm giải mã một chuỗi
export const decrypt = (text: string): string=>{
	try {
		//tách dữ liệu ra  phần là phần iv và dữ liệu mã hóa
		const parts = text.split(':');
		//lấy ra iv từ phần dầu đẻ giải mã
		const iv = Buffer.from(parts.shift()!||'8f9a32e1a23b7c9d2e56a1f0b4d8e3f2', 'hex');
		//lấy nd mã hóa
		const encryptedText = parts.join(':');
		//tạo decipher
		const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
		//giải mẫ 
		let decrypted = decipher.update(encryptedText, 'hex','utf8');//chuyền về chuỗi string
		decrypted += decipher.final('utf8');
		return decrypted;
	} catch (error) {
		console.warn("Giải mã thất bại:", error);
		throw new Error("Dữ liệu ko hợp lệ")
	}
}
