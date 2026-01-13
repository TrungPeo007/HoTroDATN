import cron from "node-cron";
import { sequelize } from "../config/database";
import { DonHang, ViShop } from "../models";
import { DON_HANG_DA_GIAO_VALUE, THANH_TOAN_THANH_CONG_VALUE } from "../config/explain";
import { Op } from "sequelize";
const CHE_DO_TEST = false;
//nế test chaạy một 1 phút quét 1 lần
//nếu chạy t hật chạy vào 00: 00 mỗi đêm
const CRON_TIME = CHE_DO_TEST ? '*/1 * * * *' : '0 0 * * *';
const TIME_LIMIT_NUMBER =  CHE_DO_TEST ? 1: 3;
const TIME_UNIT = CHE_DO_TEST ? 'minutes' : 'days';
const job = cron.schedule(CRON_TIME, async()=>{
    if(CHE_DO_TEST) console.log(`[DEMO] Đang quét đơn hàng quá hạn ${TIME_LIMIT_NUMBER} ${TIME_UNIT}...`);
    else console.log(`[REAL] Đang quét đơn hàng quá hạn 3 ngày...`);
    const deadline = new Date();
    if(CHE_DO_TEST){
        deadline.setMinutes(deadline.getMinutes() - TIME_LIMIT_NUMBER);// lùi lại 1 phút
    }else{
        deadline.setDate(deadline.getDate() - TIME_LIMIT_NUMBER);//lùi lại 3 ngày
    }
    
    try {
        const donHangs = await DonHang.findAll({
            where: {
                trang_thai_dh: DON_HANG_DA_GIAO_VALUE,
                trang_thai_thanh_toan: THANH_TOAN_THANH_CONG_VALUE,
                ngay_hoan_thanh: null,
                updatedAt: {[Op.lt]: deadline}//nhỏ hơn dead line
            }
        })
        if(donHangs.length === 0) return;
        
        console.log(`=> Tìm thấy ${donHangs.length} đơn cần xử lý.`);
        for(const donHang of donHangs){
            const t = await sequelize.transaction();
            try {
                const viShop = await ViShop.findOne({where: {id_shop: donHang.id_shop}, transaction: t});
                if(viShop){
                    const tienCongThem = Number(donHang.tong_tien);
                    await viShop.increment('so_du',{by: tienCongThem, transaction: t});
                    await donHang.update({
                        ngay_hoan_thanh: new Date()
                    },{transaction: t});
                    await t.commit();
                }else{
                    await t.rollback();
                    console.error(`Lỗi đơn hàng ${donHang.id}, Shop  không có ví`);
                }
            } catch (error) {
                await t.rollback();
                console.error(` Lỗi xử lý đơn hàng ${donHang.id}`)
            }
        }
    } catch (error) {
        console.error("Lỗi Cron job", error);
    }
})
export default job;