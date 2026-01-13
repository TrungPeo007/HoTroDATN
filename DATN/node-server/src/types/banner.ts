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
type BannerPosition = 'home_top'
    | 'home_middle'
    | 'home_bottom'
    | 'home_slider'
    | 'popup';

export interface MangBanner {
    id: number;
    img: string;
    url: string | null;
    vi_tri: BannerPosition;
    stt: number;
}

export type GroupedBanner = Record<BannerPosition, MangBanner[]>;