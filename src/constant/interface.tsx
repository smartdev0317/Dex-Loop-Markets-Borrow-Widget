
export interface MenuDetail {
    id: number,
    name: string,
    link: string,
    active: Boolean,
    created_at: string,
    updated_at: string,
    menu_type: string,
    position: number
}

export interface CollateralResponse {
    borrower: string,
    collaterals: string[]
}

export interface SwapLiquiditiesDetail {
    liquidity: string,
    asset1: AssetInfo | NativeInfo,
    asset2: AssetInfo | NativeInfo
}

export interface AssetInfo {
    token: { contract_addr: string }
}

export interface NativeInfo {
    native_token: { denom: string }
}

export interface CollateralDetail {
    address: string,
    symbol: string,
    decimals: number,
    price: string,
    amount: string,
    amountUST: string
}

export interface BorrowDetail {
    borrow_amount: String,
    borrow_limit: string
}

export interface Transaction {
    time: string,
    txhash: string,
    link: string
}

export interface PriceImpact {
    path: string,
    impact: string | undefined
}

export interface PriceImpacts {
    loop: PriceImpact[],
    terraswap: PriceImpact[],
    astroport: PriceImpact[]
}