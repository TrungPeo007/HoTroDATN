import { ParsedQs } from "qs";

export interface GetAllThuocTinh extends ParsedQs{
    page: string;
    limit: string
}
export interface AllowedUpdateThuocTinhSP{
    ten_thuoc_tinh?: string;
}