export interface ThanhToanBody{
    orderCode: number;
    amount: number;
    description: string;
    cancelUrl: string;
    returnUrl: string;
}
export interface PayOsWebhookData{
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string
}
export interface PayOswebhookPayLoad<T>{
    code: string;
    desc?: string;
    data: T;
    signature: string;
}
export interface GetAllChuaThanhToan{

    page: string;
    limit: string;
}