import { Model, ModelStatic } from "sequelize";
import { AddressNames, ApiDistrict, ApiProvince, ApiResponse, ApiWard, LocationCache } from "../types/dia_chi_user";
import fetch from 'node-fetch';
export const normalizeBoolean = (value:boolean | string | number| null | undefined, fieldName: string = "trường"): 0  | 1=>{
    if(value === "" || value === undefined || value === null){
        throw {status: 400, thong_bao: ` Bạn  chưa nhâp giá trị cho ${fieldName}`};
    } 
    if(value === true || value === 'true' || value === 1  || value === "1") return 1;
    if(value === false || value === "false" || value === 0 || value === "0") return 0;
    throw {status: 400, thong_bao: ` Giá trị của ${fieldName} không hợp lệ`};
}
const API_BASE = 'https://vn-public-apis.fpo.vn';
const cache: LocationCache = {
    provinces: null,
    districts: {},
    wards: {}
}
const getProinces = async(): Promise<Record<string, ApiProvince>>=>{
    if(cache.provinces) return cache.provinces;//neeus cos duwx lieu trả về luôn
    // console.log("CACHE: Đang tải Tỉnh/Thành từ API...");
    const res = await fetch(`${API_BASE}/provinces/getAll?limit=-1`);
    const json = (await res.json()) as ApiResponse<ApiProvince>//eps kieu generic t cho data chua laf apiprovice
    // console.log("json:", json);
    cache.provinces = json.data.data.reduce<Record<string, ApiProvince>>((acc,p)=>{//dungf reduce de chuyen mang thanh object tra cuws theo  code va chi dinh kieu cho ac laf string có value  la 1 object map 
        acc[p.code] = p;// 79 : {provice}, 1: : {}
        return acc;
     },{});//khởi tạo ac là 1 object rỗng có kiểu
    return cache.provinces;
}
const  getDistricts = async(provinceCode: string):Promise<Record<string, ApiDistrict>>=>{
    if(cache.districts[provinceCode]) return cache.districts[provinceCode];
    // console.log(`CACHE: Đang tải Quận/Huyện của [${provinceCode}] từ API...`);
    const res = await fetch(`${API_BASE}/districts/getByProvince?provinceCode=${provinceCode}&limit=-1`);
    const json = (await res.json()) as ApiResponse<ApiDistrict>;
    cache.districts[provinceCode] = json.data.data.reduce<Record<string, ApiDistrict>>((acc,d)=>{
        acc[d.code] = d;
        return acc;
    },{})
    return cache.districts[provinceCode];
}
const getWards  = async(districtCode: string): Promise<Record<string, ApiWard>>=>{
    if(cache.wards[districtCode]) return cache.wards[districtCode];
    // console.log(`CACHE: Đang tải Phường/Xã của [${districtCode}] từ API...`);
    const res = await fetch(`${API_BASE}/wards/getByDistrict?districtCode=${districtCode}&limit=-1`);
    const json = (await res.json()) as  ApiResponse<ApiWard>;
    cache.wards[districtCode] = json.data.data.reduce<Record<string, ApiWard>>((acc,w)=>{
        acc[w.code] = w;
        return acc;
    },{});
    return cache.wards[districtCode];
}
export const validateAddressCodes = async(
    provinceCode: string,
    districtCode: string,
    wardCode: string
): Promise<boolean>=>{
    try {
        const provinces = await  getProinces();
        if(!provinces[provinceCode]) return false;
        const districts = await getDistricts(provinceCode);
        if(!districts[districtCode] || districts[districtCode].parent_code !== provinceCode){
            return false;
        }
        const wards = await getWards(districtCode);
        if(!wards[wardCode] || wards[wardCode].parent_code !== districtCode){
            return false
        }
        return true;
    } catch (error) {
        console.error("Lỗi khi validateAddressCodes:", error);
        return false
    }
}
//hàm lấy tên từ 3 mã code
export const  getNameFromCodes=async(
    provinceCode: string,
    districtCode: string,
    wardCode: string
): Promise<AddressNames>=>{
    try {
        const [provices, districts, wards] = await Promise.all([
            getProinces(),
            getDistricts(provinceCode),
            getWards(districtCode)
        ]);
        return {
            tinh_name: provices[provinceCode]?.name_with_type || "không rõ",
            quan_name: districts[districtCode]?.name_with_type || "Không rõ",
            phuong_name: wards[wardCode]?.name_with_type || "không rõ"
        }
    } catch (error) {
        console.error("Lỗi khi getNamesFromCodes:", error);
        return {
            tinh_name: "lỖi",
            quan_name: "Lỗi",
            phuong_name: "lỗi"
        }
    }
}
export const validateForeignKey = async(id: number, model: ModelStatic<Model>, fieldName: string, allowNull:boolean = false)=>{
    if(allowNull) return null;
    const record = await model.findByPk(id);
    if(!record){
        throw {status: 404, thong_bao: ` Không tìm thấy ${fieldName} có ID ${id}`};
    }
    return  id;
}