import { LCDClient, AccAddress } from "@terra-money/terra.js"

export const searchToken = async (lcd:LCDClient, data: string) => {
    if (isAddress(lcd, data)) {
        let info: any
        await lcd.wasm.contractInfo(data).then((res: any) => {
            if (!res || !res.init_msg || !res.init_msg.symbol) info = {name: res.init_msg.name, symbol: res.init_msg.symbol, decimals: res.init_msg.decimals}
            else info = {}
        })
        return { state: true }
    } else {
        return { state: false }
    }
}

export const isAddress = (lcd:LCDClient, data: string) => {
    return AccAddress.validate(data)
}