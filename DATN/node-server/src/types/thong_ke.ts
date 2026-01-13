import { ParsedQs } from "qs";

export interface ThongKeDoanhThu extends ParsedQs{
    type: string;
    year: string;
    mouth: string;
}
export interface ThongKeTop extends ParsedQs{
    limit: string;
}