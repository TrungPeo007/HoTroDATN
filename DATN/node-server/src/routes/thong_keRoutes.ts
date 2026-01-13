import express  from 'express';
import { sequelize } from '../config/database';
import { DonHang, DonHangChiTiet, SanPham, User } from '../models';
import { ACTIVATED_VALUE, ADMIN_ROLE_ID, AN_HIEN_VALUE, DON_HANG_DA_CHUA_XAC_NHAN, DON_HANG_DA_GIAO_VALUE, DON_HANG_DANG_GIAO_VALUE, DON_HANG_HUY_VALUE, DON_HANG_SHOP_CHUAN_BI_HANG_VALUE, KHOA_VALUE, SHOP_VALUE, THANH_TOAN_THANH_CONG_VALUE } from '../config/explain';
import {  col, fn, literal, Op, where } from 'sequelize';
import { ThongKeDoanhThu, ThongKeTop } from '../types/thong_ke';

const router = express.Router();
interface CustomError{
    status?: number;
    thong_bao?: string;
    message?: string
}


router.get('/tong-quan',async(req ,res)=>{
    try {
        const NGUONG_TON_KHO_THAP = 10;
        const [tongDanhThu, donHuy,donHangMoi, tongUser, tongShop, spSapHet, donDaThanhToan] =
            await Promise.all([
                DonHang.sum('tong_tien',{where: {
                    trang_thai_thanh_toan: THANH_TOAN_THANH_CONG_VALUE,
                    trang_thai_dh: {[Op.ne]: DON_HANG_HUY_VALUE}
                }}),
                DonHang.count({where: {trang_thai_dh: DON_HANG_HUY_VALUE}}),
                DonHang.count({where: { trang_thai_dh: DON_HANG_DA_CHUA_XAC_NHAN}}),
                User.count({
                    where: {
                        is_shop: {[Op.ne]: SHOP_VALUE},
                        vai_tro: {[Op.ne]: ADMIN_ROLE_ID},
                        khoa: {[Op.ne] : KHOA_VALUE}
                    }
                }),
                User.count({//đếm này có tính luôn admin
                    where: {
                        is_shop: SHOP_VALUE,
                        khoa: {[Op.ne]: KHOA_VALUE},
                    }
                }),
                SanPham.count({
                    where: {so_luong: {[Op.lt]: NGUONG_TON_KHO_THAP}, an_hien: AN_HIEN_VALUE, is_active: ACTIVATED_VALUE}
                }),
                DonHang.count({
                    where: {trang_thai_thanh_toan: THANH_TOAN_THANH_CONG_VALUE}
                })

            ]);
        return res.status(200).json({data: {
            doanh_thu: tongDanhThu || 0,
            don_da_huy: donHuy,
            don_hang_moi: donHangMoi,
            tong_user: tongUser,
            tong_shop: tongShop,
            san_pham_sap_het: spSapHet,
            don_hang_thanh_toan: donDaThanhToan
        }, success: true})
    } catch (error) {
        const err = error as CustomError;
        console.log(err.message);
        return res.status(500).json({thong_bao: 'Lỗi máy chủ khi thống kê tổng quan', success: false});
    }
})
// /doanh-thu-chart?type=day&year=2024&month=5
// type: 'day' (xem từng ngày trong 1 tháng) hoặc 'month' (xem từng tháng trong 1 năm)
router.get<{},{},{},ThongKeDoanhThu>('/doanh-thu-chart', async (req, res) => {
    try {
        const type = req.query.type || 'month'; // Mặc định là xem theo tháng
        const year = Number(req.query.year) || new Date().getFullYear(); // Mặc định năm nay
        const month = Number(req.query.month) || new Date().getMonth() + 1; // Mặc định tháng này

        
        const whereCondition: any = {
            trang_thai_thanh_toan: THANH_TOAN_THANH_CONG_VALUE, // Tiền đã về
            trang_thai_dh: { [Op.ne]: DON_HANG_HUY_VALUE }      // Đơn không hủy
        };

        let attributes: any[] = [];
        let groupBy: any;
        let labels: number[] = []; // Dùng để tạo trục hoành 

        // 2. Xử lý Logic theo Type
        if (type === 'month') {//nếu là mouth thì chỉ lấy yaer
            // --- LOGIC: THỐNG KÊ 12 THÁNG TRONG NĂM ---
            
            // Filter theo năm
            whereCondition[Op.and] = [
                sequelize.where(fn('YEAR', col('createdAt')), year)
            ];

            // Lấy THÁNG và TỔNG TIỀN
            attributes = [
                [fn('MONTH', col('createdAt')), 'label'], // Trả về 1, 2, ..., 12
                [fn('SUM', col('tong_tien')), 'data']
            ];
            
            groupBy = [fn('MONTH', col('createdAt'))];

            // Tạo khung xương cho 12 tháng
            labels = Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, ..., 12]

        } else if (type === 'day') {
            //  THỐNG KÊ CÁC NGÀY TRONG 1 THÁNG ---
            // nếu làm ngày thì lấy tham số month và year
            // Filter theo Tháng và Năm
            whereCondition[Op.and] = [
                sequelize.where(fn('MONTH', col('createdAt')), month),
                sequelize.where(fn('YEAR', col('createdAt')), year)
            ];

            // Select: Lấy NGÀY và TỔNG TIỀN
            attributes = [
                [fn('DAY', col('createdAt')), 'label'], // Trả về 1, 2, 3...
                [fn('SUM', col('tong_tien')), 'data']
            ];

            groupBy = [fn('DAY', col('createdAt'))];

            // Tính số ngày trong tháng đó (để xử lý tháng 2 nhuận, tháng 30, 31 ngày)
            const daysInMonth = new Date(year, month, 0).getDate();
            labels = Array.from({ length: daysInMonth }, (_, i) => i + 1); // [1, 2, ..., 30/31]
        }

        // Query Database
        const results = await DonHang.findAll({
            attributes: attributes,
            where: whereCondition,
            group: groupBy,
            raw: true // Trả về JSON thuần để dễ map
        }) as unknown as { label: number, data: string }[];

        // Lấp đầy dữ liệu (Zero-filling) - QUAN TRỌNG
        // Database chỉ trả về những ngày có đơn. Ta cần map vào danh sách labels đầy đủ.
        const chartData = labels.map(label => {
            // Tìm trong kết quả DB xem có ngày/tháng này không
            const found = results.find(item => item.label === label);
            return {
                label: type === 'month' ? `Tháng ${label}` : `${label}/${month}`, // Tên hiển thị
                value: found ? Number(found.data) : 0 // Nếu không có thì là 0đ
            };
        });

        return res.status(200).json({
            success: true,
            type: type,
            year: year,
            month: type === 'day' ? month : null,
            chart_data: chartData, // Mảng này ném thẳng vào FE vẽ biểu đồ
            summary: {
                total: chartData.reduce((acc, curr) => acc + curr.value, 0) // Tổng doanh thu cả kỳ
            }
        });

    } catch (error) {
        const err = error as CustomError;
        console.error(err);
        return res.status(500).json({ thong_bao: "Lỗi thống kê biểu đồ", success: false });
    }
});
// api nay đang lỗi
router.get<{}, {}, {},ThongKeTop>('/top',async(req , res)=>{
    try {
        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 5;
        const topSanPham = await DonHangChiTiet.findAll({
            attributes: [
                'id_sp',
                [fn('Sum', col('donHangChiTiet.so_luong')), 'tong_da_ban']
            ],
            include: [{
                model: DonHang,
                as: 'don_hang',
                attributes: []//khong lấy dữ leeuj đơn hàng chỉ lọc
                ,where: {
                     [Op.and]: [
                    {
                        [Op.or]: [
                            { trang_thai_dh: DON_HANG_DA_GIAO_VALUE },
                            { trang_thai_thanh_toan: THANH_TOAN_THANH_CONG_VALUE }
                        ]
                    },
                    { trang_thai_dh: { [Op.ne]: DON_HANG_HUY_VALUE } }
                ]
                }//chỉ tính đơn hàng ko  bị hủy
            },{
                model: SanPham,
                as: 'san_pham',
                attributes: ['id','ten_sp','img','gia','slug']
            }],
            group: [col('san_pham.id'),'id_sp'],//nhóm theo id sản phẩm
            order: [[literal('tong_da_ban'), 'DESC']],
            limit: limit
        });
        const topShop = await DonHang.findAll({
            attributes: [
                'id_shop',
                [fn('Sum', col('tong_tien')), 'tong_doanh_thu'],
                [fn('COUNT', col('Donhang.id')), 'so_don_hang']
            ],
            where: {
                // Logic: (Giao thành công HOẶC Đã thanh toán) VÀ (Không bị hủy)
                [Op.and]: [
                    {
                        [Op.or]: [
                            { trang_thai_dh: DON_HANG_DA_GIAO_VALUE },
                            { trang_thai_thanh_toan: THANH_TOAN_THANH_CONG_VALUE }
                        ]
                    },
                    { trang_thai_dh: { [Op.ne]: DON_HANG_HUY_VALUE } }
                ]
            },
            include: [{
                model: User,
                as: 'shop',
                attributes: ['id','ten_shop','hinh']
            }],
            group: ['id_shop'],//nhóm theo shop
            limit: limit,
            order: [[literal('tong_doanh_thu'), 'DESC']]
        });
        return res.status(200).json({data: {
            top_san_pham: topSanPham,
            top_shop: topShop
        }});

    } catch (error) {
        const err = error as CustomError;
        console.log(err.message);
        return res.status(500).json({thong_bao: "Lỗi khi lấy top  shop  và top  sản phẩm bán chạy"});

    }
})

router.get('/trang-thai-don-hang', async (req, res) => {
    try {
        // Dùng Promise.all để đếm song song các trạng thái ông quan tâm
        const [
            donChoXacNhan, 
            donDaXacNhan, 
            donDangGiao, 
            donThanhCong, 
            donHuy,
            tongDon
        ] = await Promise.all([
            // 1. Chờ xác nhận
            DonHang.count({ where: { trang_thai_dh: DON_HANG_DA_CHUA_XAC_NHAN } }),
            DonHang.count({ where: { trang_thai_dh: DON_HANG_SHOP_CHUAN_BI_HANG_VALUE } }),
            DonHang.count({ where: { trang_thai_dh: DON_HANG_DANG_GIAO_VALUE } }),
            DonHang.count({ where: { trang_thai_dh: DON_HANG_DA_GIAO_VALUE } }),
            DonHang.count({ where: { trang_thai_dh: DON_HANG_HUY_VALUE } }),
            DonHang.count()
        ]);

        return res.status(200).json({
            success: true,
            data: {
                cho_xac_nhan: donChoXacNhan,
                da_xac_nhan: donDaXacNhan,
                dang_giao: donDangGiao,
                thanh_cong: donThanhCong,
                da_huy: donHuy,
                tong_cong: tongDon
            }
        });

    } catch (error) {
        const err = error as CustomError;
        console.error(err);
        return res.status(500).json({ 
            success: false, 
            thong_bao: "Lỗi thống kê trạng thái đơn hàng" 
        });
    }
});
export default router;