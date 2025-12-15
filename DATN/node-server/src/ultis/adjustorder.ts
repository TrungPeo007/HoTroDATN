import { Model, WhereOptions, ModelStatic} from "sequelize";
import {DM_San_Pham, ThuongHieu} from "../models";



export const adJustOrderInLoaiDanhMucSP = async (
    amount: number,
    whereThuTu:  WhereOptions
): Promise<void> => {
    await DM_San_Pham.increment(
        { stt: amount },
        {
            where: whereThuTu
        }
    );
};

export const adJustOrderInDanhMucTin = async (
    amount: number,
    model:  ModelStatic<Model>,
    whereThuTu:  WhereOptions
): Promise<void> => {
    await model.increment(
        { stt: amount },
        {
            where: whereThuTu
        }
    );
};
