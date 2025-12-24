import { ParsedQs } from "qs";

export interface getAllVoucher extends ParsedQs{
    page: string;
    limit: string;
}