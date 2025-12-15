import { ParsedQs } from "qs";
import {ParamsDictionary} from 'express-serve-static-core'
export interface getAllYeuThichByUser extends ParsedQs{
    page: string;
    limit: string;
}
export interface ParamsYeuthichSP extends ParamsDictionary{
    id: string;
}