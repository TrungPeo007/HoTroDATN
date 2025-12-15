import { ParsedQs } from "qs";

export interface getAllBanner extends ParsedQs{
    page: string;
    limit: string
}
export interface AllowedUpdateBanner{
    stt?: number;
    name?: string;
    url?: string;
    img?: string| null;
    vi_tri?: string;
    an_hien?: number;
}