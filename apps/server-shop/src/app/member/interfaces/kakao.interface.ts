export interface KakaoTokenResponse {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
}

export interface KakaoUserInfo {
    id: number;
    kakao_account?: {
        email?: string;
        profile?: {
            nickname?: string;
        };
    };
}
