import {z} from 'zod';
export const BANNER_POSITIONS = [
    'home_top',
    'home_middle',
    'home_bottom',
    'home_slider',
    'popup',
] as const;
export const createbannerSchema = z.object({
    body: z.object({
        name: z.string()
            .trim()
            .min(1, "Tên banner không được để trống"),
        url: z.string()
            .trim()
            .min(1,"Đường dẫn không được để trống")
            .url("URL phải hợp lệ và bắt đầu bằng http hoặc https"),

        vi_tri: z.enum(BANNER_POSITIONS, 
            { message: "Vị trí không hợp lệ. Các vị trí cho phép: home_top, home_middle, home_bottom, home_slider, popup" }
        ),
        an_hien: z.union([z.string(), z.number(), z.boolean()])
            .optional()
            .transform((val)=>{
                if(val === 1 || val === "1" || val === true || val === "true") return 1;
                return 0;
            })
    })
})
 const ParamsBannerSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID banner phải là số")
});

export const updateBannerSchema = z.object({
    params: ParamsBannerSchema,
    body: z.object({
        stt: z.coerce.number().int().positive("Stt phải là số nguyên dương").optional(),
        name: z.string()
            .trim()
            .min(1, "Tên banner không được để trống"),
        url: z.string()
            .trim()
            .min(1,"Đường dẫn không được để trống")
            .url("URL phải hợp lệ và bắt đầu bằng http hoặc https"),
        vi_tri: z.enum(BANNER_POSITIONS, 
            { message: "Vị trí không hợp lệ. Các vị trí cho phép: home_top, home_middle, home_bottom, home_slider, popup" }
        ),
        an_hien: z.union([z.string(), z.number(), z.boolean()])
            .optional()
            .transform((val)=>{
                if(val === 1 || val === "1" || val === true || val === "true") return 1;
                return 0;
            })

    })
})
export const getBannerSchema = z.object({
    query: z.object({
        vi_tri: z.enum(BANNER_POSITIONS, 
            { message: "Vị trí không hợp lệ. Các vị trí cho phép: home_top, home_middle, home_bottom, home_slider, popup" }
        ),
    })
});


// Type
export type GetBannerInput = z.infer<typeof getBannerSchema>;
export type updateBannerInput = z.infer<typeof updateBannerSchema>;
export type createbannerInput = z.infer<typeof createbannerSchema>['body'];
export type getBannerSchema = z.infer<typeof getBannerSchema>['query'];