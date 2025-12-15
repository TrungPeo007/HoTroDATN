export const AUTH_PROVIDER = {
    LOCAL: 'local',
    GOOGLE: 'google',
    FACEBOOK: 'facebook'
}

export const GOOGLE_CALLBACK_PATH = '/api/auth/google/callback'
export const FACEBOOK_CALLBACK_PATH =`/api/auth/facebook/callback`
export const generateRandomString = (length: number): string =>{
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for(let i = 0; i< length; i++){
        result += characters.charAt(Math.floor(Math.random() * charactersLength));//nó charat nó sẽ lấy ký tự làm tròn từ random * length vd là 1 thì lấy a
    }
    return result;
}
