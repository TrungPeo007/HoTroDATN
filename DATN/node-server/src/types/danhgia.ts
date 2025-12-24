import { ParsedQs } from "qs";
import {ParamsDictionary} from 'express-serve-static-core'
export interface GetAllDanhGia extends ParsedQs{
    page: string;
    limit: string;
}
export interface ParamsDanhGiaBySlug extends ParamsDictionary{
    slug: string;
}
export interface ParamsDanhGiaById extends ParamsDictionary{
    id: string;
}
export type RatingAggregateResult = {
  ratingAvg: string;
  ratingCount: string;
};