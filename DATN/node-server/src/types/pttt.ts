import { ParsedQs } from "qs";

export interface GetAllPttt extends ParsedQs{
    page: string;
    limit: string;
}
export interface allowedUpdatePTTT{
    ten_pt?: string;
    code?: string;
    img?: string | null;
    an_hien?: number;
}