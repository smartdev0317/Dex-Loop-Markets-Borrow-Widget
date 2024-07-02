import axios from 'axios'
import { MsgExecuteContract, Coin, Coins, LCDClient, Msg, MsgTransfer, MsgSend } from '@terra-money/terra.js'
import { AssetInfo, NativeInfo, TokenInfo, defaultBorrowAssetInfo, defaultCollateralAssetInfo, defaultTestnetBorrowAssetInfo,
    defaultTestnetCollateralAssetInfo, coinInfos, mainnet_tokenInfos, testnet_tokenInfos, collateralTokens, test_collateralTokens, defaultSwapAssetInfo } from 'constant/usePairs'
import { chainID, test_DEXLOOPFACTORY, DEXLOOPFACTORY, RPC, UUSD, ANCHO_BLUNA_CASTODY, test_ANCHO_BLUNA_CASTODY, bLUNA, bETH,
    test_bLUNA, ANCHO_BETH_CASTODY, ANCHO_MARKET, test_ANCHO_MARKET, test_ANCHO_OVERSEER, ANCHO_OVERSEER, ORACLE, test_ORACLE,
    ANCHO_INTEREST, test_ANCHO_INTEREST, ULUNA, defaultSwapCoin, treasuryWallet, wasAVAX, defaultPriceImpact, PRICEIMPACTMAX, BORROWRATELIMIT, BORROWMAX, SWAP_FEE, STABLE_SWAP_FEE, TREASURY_FEE, N_COINS, ITERATIONS, AMP_PRECISION, N_COINS_SQUARED, STABLE_SWAP_LIMIT } from 'constant/constants'
import { CollateralResponse, CollateralDetail, BorrowDetail, SwapLiquiditiesDetail } from 'constant/interface'
import { useGetUserAutoCompoundSubription } from 'data/farming/FarmV2'
import { binary } from 'ramda'
    
interface LiquidityDetail {
    asset_infos: AssetInfo | NativeInfo [],
    contract_addr: string,
    liquidity_token: string
}



export const getTokenBalance = async (rpc: string, tokenInfos: Map<string, TokenInfo>, walletAddress: string) => {
    const calls = [...tokenInfos.keys()].map(k => {
        const query_msg = {
            balance: {
            address: walletAddress
            }
        }
        return axios.get(`${rpc}/wasm/contracts/${k}/store?query_msg=${JSON.stringify(query_msg)}`)
    })
    const response = await Promise.all(calls);
    return response
}

export const getCoinBalances = async (lcd: LCDClient, walletAddress: string) => {
    const balances = new Map<string, number>()
    await lcd.bank.balance(walletAddress).then(([coins]) => {
        coins.toArray().map(c => {
            balances.set(c.denom, c.amount.toNumber())
        })
    })
    return balances
}


const getFactoryAddress = (chain: string) => {
    if (chain === chainID.main || !chain) return DEXLOOPFACTORY
    else return test_DEXLOOPFACTORY
}

const getTokenInfos = (chain: string) => {
    return chain === chainID.main ? mainnet_tokenInfos : testnet_tokenInfos
}

export const isCoin = (asset: AssetInfo | NativeInfo) => {
    return 'native_token' in asset
}

export const getDecimals = (chain: string, asset: AssetInfo | NativeInfo) => {
    const tokenInfos = getTokenInfos(chain)
    if ('native_token' in asset) return coinInfos.get(asset.native_token.denom)?.decimals || 0
    else return tokenInfos.get(asset.token.contract_addr)?.decimals || 0
}

export const getDecimalsWithAddress = (chain: string, address: string) => {
    const tokenInfos = getTokenInfos(chain)
    return coinInfos.get(address)?.decimals || tokenInfos.get(address)?.decimals || 0
}

export const denomOfCoin = (asset: AssetInfo | NativeInfo) => {
    if ('native_token' in asset) return asset.native_token.denom
    else return ''
}

export const contract_addrOfToken = (asset: AssetInfo | NativeInfo) => {
    if ('token' in asset) return asset.token.contract_addr
    else return ''
}

export const getSymbolWithAddress = (chain: string, asset: string) => {
    return coinInfos.get(asset)?.symbol || mainnet_tokenInfos.get(asset)?.symbol || testnet_tokenInfos.get(asset)?.symbol || ''
}

export const getSymbol = (chain: string, asset: AssetInfo | NativeInfo) => {
    const assetAddress = isCoin(asset) ? denomOfCoin(asset) : contract_addrOfToken(asset)
    return coinInfos.get(assetAddress)?.symbol || mainnet_tokenInfos.get(assetAddress)?.symbol || testnet_tokenInfos.get(assetAddress)?.symbol || ''
}

interface PairDetail {
    asset_infos: AssetInfo | NativeInfo[]
    contract_addr: string
    liquidity_token: string
}

export const getSwapLiquidities = (rawPairs: any, terraswapPairs: any, asset1: AssetInfo | NativeInfo, asset2: AssetInfo | NativeInfo, isDoubleCall?: Boolean) => {
    //asset_infos: AssetInfo|NativeInfo[], contract_addr, liquidity_token
    if (!rawPairs) return []
    const _rawPairs = Object.values(rawPairs).filter((each: any) => each.asset_infos).concat(rawPairs.pairs)
    // console.log(_rawPairs.filter((each: any) => each?.asset_infos[0]?.native_token?.denom  === "uluna" || each?.asset_infos[1]?.native_token?.denom  === "uluna"))

    let exception = false;
    if (isCoin(asset1) && denomOfCoin(asset1) === UUSD && !isCoin(asset2) && contract_addrOfToken(asset2) === bLUNA) exception = true;

    const asset1Pairs = Object.values(_rawPairs).filter((each: PairDetail) => {
        const _asset_infos = each.asset_infos
        const asset1Addr = isCoin(asset1) ? denomOfCoin(asset1) : contract_addrOfToken(asset1)
        const _asset1Addr = isCoin(_asset_infos[0]) ? denomOfCoin(_asset_infos[0]) : contract_addrOfToken(_asset_infos[0])
        const _asset2Addr = isCoin(_asset_infos[1]) ? denomOfCoin(_asset_infos[1]) : contract_addrOfToken(_asset_infos[1])
        if (_asset1Addr === asset1Addr || _asset2Addr === asset1Addr) return true
        return false
    })
    const directPairs = asset1Pairs.filter((each: PairDetail) => {
        const _asset_infos = each.asset_infos
        const asset2Addr = isCoin(asset2) ? denomOfCoin(asset2) : contract_addrOfToken(asset2)
        const _asset1Addr = isCoin(_asset_infos[0]) ? denomOfCoin(_asset_infos[0]) : contract_addrOfToken(_asset_infos[0])
        const _asset2Addr = isCoin(_asset_infos[1]) ? denomOfCoin(_asset_infos[1]) : contract_addrOfToken(_asset_infos[1])
        if (_asset1Addr === asset2Addr || _asset2Addr === asset2Addr) return true
        return false
    }).map((each: PairDetail) => each.contract_addr)
    if (directPairs.length && !exception) return [{ 
        liquidity: directPairs[0],
        asset1: asset1,
        asset2: asset2
    }]
    else {
        const asset2Pairs = Object.values(_rawPairs).filter((each: PairDetail) => {
            const _asset_infos = each.asset_infos
            const asset2Addr = isCoin(asset2) ? denomOfCoin(asset2) : contract_addrOfToken(asset2)
            const _asset1Addr = isCoin(_asset_infos[0]) ? denomOfCoin(_asset_infos[0]) : contract_addrOfToken(_asset_infos[0])
            const _asset2Addr = isCoin(_asset_infos[1]) ? denomOfCoin(_asset_infos[1]) : contract_addrOfToken(_asset_infos[1])
            if (_asset1Addr === asset2Addr || _asset2Addr === asset2Addr) return true
            return false
        })
        const uusdAsset1Pairs = asset1Pairs.filter((each: PairDetail) => {
            const _asset_infos = each.asset_infos
            if (isCoin(_asset_infos[0]) && denomOfCoin(_asset_infos[0]) === UUSD) return true
            if (isCoin(_asset_infos[1]) && denomOfCoin(_asset_infos[1]) === UUSD) return true
            return false
        }).map((each: PairDetail) => each.contract_addr)
        const ulunaAsset1Pairs = asset1Pairs.filter((each: PairDetail) => {
            const _asset_infos = each.asset_infos
            if (isCoin(_asset_infos[0]) && denomOfCoin(_asset_infos[0]) === ULUNA) return true
            if (isCoin(_asset_infos[1]) && denomOfCoin(_asset_infos[1]) === ULUNA) return true
            return false
        }).map((each: PairDetail) => each.contract_addr)
        if (ulunaAsset1Pairs.length > 0) {
            const ulunaAsset2Pairs = asset2Pairs.filter((each: PairDetail) => {
                const _asset_infos = each.asset_infos
                if (isCoin(_asset_infos[0]) && denomOfCoin(_asset_infos[0]) === ULUNA) return true
                if (isCoin(_asset_infos[1]) && denomOfCoin(_asset_infos[1]) === ULUNA) return true
                return false
            }).map((each: PairDetail) => each.contract_addr)
            if (ulunaAsset2Pairs.length > 0) return [{
                liquidity: ulunaAsset1Pairs[0],
                asset1: asset1,
                asset2: {
                    native_token: {
                        denom: ULUNA
                    }
                }
            }, {
                liquidity: ulunaAsset2Pairs[0],
                asset1: {
                    native_token: {
                        denom: ULUNA
                    }
                },
                asset2: asset2
            }]
        } else {
            const uusdAsset2Pairs = asset2Pairs.filter((each: PairDetail) => {
                const _asset_infos = each.asset_infos
                if (isCoin(_asset_infos[0]) && denomOfCoin(_asset_infos[0])) return true
                if (isCoin(_asset_infos[1]) && denomOfCoin(_asset_infos[1])) return true
                return false
            }).map((each: PairDetail) => each.contract_addr)
            if (uusdAsset2Pairs.length > 0) return [{
                liquidity: uusdAsset1Pairs[0],
                asset1: asset1,
                asset2: {
                    native_token: {
                        denom: UUSD
                    }
                }
            }, {
                liquidity: uusdAsset2Pairs[0],
                asset1: {
                    native_token: {
                        denom: UUSD
                    }
                },
                asset2: asset2
            }]
        }
    }
    return []
}

// export const getSwapLiquidities = async (lcd: LCDClient, chain: string, asset1: AssetInfo | NativeInfo, asset2: AssetInfo | NativeInfo, isDoubleCall?: Boolean) => {
//     const factoryAddress = getFactoryAddress(chain)
//     // console.log(asset1, asset2)
//     //asset1 and asset2 must not equal
//     if (isCoin(asset1) && isCoin(asset2) && denomOfCoin(asset1) === denomOfCoin(asset2)) return [{liquidity: '', asset1, asset2}]
//     if (!isCoin(asset1) && !isCoin(asset2) && contract_addrOfToken(asset1) === contract_addrOfToken(asset2)) return [{liquidity: '', asset1, asset2}]

//     if (lcd.config.chainID === chainID.main) {
//         if (isCoin(asset1) && denomOfCoin(asset1) === ULUNA || isCoin(asset2) && denomOfCoin(asset2) === ULUNA) {
//             const factoryQuery = {
//                 pair: {
//                     asset_infos: [
//                         asset1,
//                         asset2
//                     ]
//                 }
//             }
//             try {
//                 const response: LiquidityDetail = await lcd.wasm.contractQuery(factoryAddress, factoryQuery)
//                 if (response?.contract_addr) {
//                     return [{liquidity: response.contract_addr, asset1, asset2}]
//                 }
//                 return []
//             } catch(e) {
//                 console.log(e)
//                 const uusdAsset: NativeInfo = {
//                     native_token: {
//                         denom: UUSD
//                     }
//                 }
//                 const factoryQuery1 = {
//                     pair: {
//                         asset_infos: [
//                             asset1,
//                             uusdAsset
//                         ]
//                     }
//                 }
//                 const factoryQuery2 = {
//                     pair: {
//                         asset_infos: [
//                             uusdAsset,
//                             asset2
//                         ]
//                     }
//                 }
//                 try {
//                     const res1: LiquidityDetail  = await lcd.wasm.contractQuery(factoryAddress, factoryQuery1);
//                     const res2: LiquidityDetail = await lcd.wasm.contractQuery(factoryAddress, factoryQuery2);
//                     if (res1?.contract_addr && res2?.contract_addr) return [{liquidity: res1.contract_addr.toString(), asset1, asset2: uusdAsset}, {liquidity: res2.contract_addr.toString(), asset1: uusdAsset, asset2}]
//                     else return [{liquidity: '', asset1, asset2}]
//                 } catch(e) {
//                     console.log(e)
//                     return []
//                 }
//             }
//         } else {
//             const lunaAsset: NativeInfo = {
//                 native_token: {
//                     denom: ULUNA
//                 }
//             }
//             const factoryQuery1 = {
//                 pair: {
//                     asset_infos: [
//                         asset1,
//                         lunaAsset
//                     ]
//                 }
//             }
//             const factoryQuery2 = {
//                 pair: {
//                     asset_infos: [
//                         lunaAsset,
//                         asset2
//                     ]
//                 }
//             }
//             try {
//                 const res1: LiquidityDetail  = await lcd.wasm.contractQuery(factoryAddress, factoryQuery1);
//                 const res2: LiquidityDetail = await lcd.wasm.contractQuery(factoryAddress, factoryQuery2);
//                 if (res1?.contract_addr && res2?.contract_addr) return [{liquidity: res1.contract_addr.toString(), asset1, asset2: lunaAsset}, {liquidity: res2.contract_addr.toString(), asset1: lunaAsset, asset2}]
//                 else return [{liquidity: '', asset1, asset2}]
//             } catch(e) {
//                 if (isCoin(asset1) && denomOfCoin(asset1) === UUSD || isCoin(asset2) && denomOfCoin(asset2) === UUSD) {
//                     const factoryQuery = {
//                         pair: {
//                             asset_infos: [
//                                 asset1,
//                                 asset2
//                             ]
//                         }
//                     }
//                     try {
//                         const response: LiquidityDetail = await lcd.wasm.contractQuery(factoryAddress, factoryQuery)
//                         if (response?.contract_addr) {
//                             return [{liquidity: response.contract_addr, asset1, asset2}]
//                         }
//                         return []
//                     } catch(e) {
//                         console.log(e)
//                         return []
//                     }
//                 } else {
//                     const uusdAsset: NativeInfo = {
//                         native_token: {
//                             denom: UUSD
//                         }
//                     }
//                     const factoryQuery1 = {
//                         pair: {
//                             asset_infos: [
//                                 asset1,
//                                 uusdAsset
//                             ]
//                         }
//                     }
//                     const factoryQuery2 = {
//                         pair: {
//                             asset_infos: [
//                                 uusdAsset,
//                                 asset2
//                             ]
//                         }
//                     }
//                     try {
//                         const res1: LiquidityDetail  = await lcd.wasm.contractQuery(factoryAddress, factoryQuery1);
//                         const res2: LiquidityDetail = await lcd.wasm.contractQuery(factoryAddress, factoryQuery2);
//                         if (res1?.contract_addr && res2?.contract_addr) return [{liquidity: res1.contract_addr.toString(), asset1, asset2: uusdAsset}, {liquidity: res2.contract_addr.toString(), asset1: uusdAsset, asset2}]
//                         else return [{liquidity: '', asset1, asset2}]
//                     } catch(e) {
//                         console.log(e)
//                         return []
//                     }
//                 }
//             }
//         }
//     } else {
//         if (isCoin(asset1) && denomOfCoin(asset1) === UUSD || isCoin(asset2) && denomOfCoin(asset2) === UUSD) {
//             const factoryQuery = {
//                 pair: {
//                     asset_infos: [
//                         asset1,
//                         asset2
//                     ]
//                 }
//             }
//             try {
//                 const response: LiquidityDetail = await lcd.wasm.contractQuery(factoryAddress, factoryQuery)
//                 if (response?.contract_addr) {
//                     return [{liquidity: response.contract_addr, asset1, asset2}]
//                 }
//                 return []
//             } catch(e) {
//                 console.log(e)
//                 return []
//             }
//         } else {
//             const ustAsset: NativeInfo = {
//                 native_token: {
//                     denom: UUSD
//                 }
//             }
//             const factoryQuery1 = {
//                 pair: {
//                     asset_infos: [
//                         asset1,
//                         ustAsset
//                     ]
//                 }
//             }
//             const factoryQuery2 = {
//                 pair: {
//                     asset_infos: [
//                         ustAsset,
//                         asset2
//                     ]
//                 }
//             }
//             try {
//                 const res1: LiquidityDetail  = await lcd.wasm.contractQuery(factoryAddress, factoryQuery1);
//                 const res2: LiquidityDetail = await lcd.wasm.contractQuery(factoryAddress, factoryQuery2);
//                 if (res1?.contract_addr && res2?.contract_addr) return [{liquidity: res1.contract_addr.toString(), asset1, asset2: ustAsset}, {liquidity: res2.contract_addr.toString(), asset1: ustAsset, asset2}]
//                 else return []
//             } catch(e) {
//                 console.log(e)
//                 return []
//             }
//         }
//     }
    
// }

export const getUSTSwapLiquidity = async (lcd: LCDClient, chain: string, asset: AssetInfo | NativeInfo) => {
    const factoryAddress = getFactoryAddress(chain)

    if (lcd.config.chainID === chainID.main) {
        if (isCoin(asset) && denomOfCoin(asset) === UUSD) {
            return ""
        } else {
            const ustAsset: NativeInfo = {
                native_token: {
                    denom: UUSD
                }
            }
            const factoryQuery = {
                pair: {
                    asset_infos: [
                        asset,
                        ustAsset
                    ]
                }
            }
            try {
                const res: LiquidityDetail  = await lcd.wasm.contractQuery(factoryAddress, factoryQuery);
                if (res?.contract_addr) return res.contract_addr.toString()
                else return ""
            } catch(e) {
                console.log(e)
                return ""
            }
        }
    } else {
        if (isCoin(asset) && denomOfCoin(asset) === UUSD) {
            return ""
        } else {
            const ustAsset: NativeInfo = {
                native_token: {
                    denom: UUSD
                }
            }
            const factoryQuery = {
                pair: {
                    asset_infos: [
                        asset,
                        ustAsset
                    ]
                }
            }
            try {
                const res: LiquidityDetail  = await lcd.wasm.contractQuery(factoryAddress, factoryQuery);
                if (res?.contract_addr) return res.contract_addr.toString()
                else return ""
            } catch(e) {
                console.log(e)
                return ""
            }
        }
    }
    
}
// export const getSwapLiquidities = async (lcd: LCDClient, chain: string, asset1: AssetInfo | NativeInfo, asset2: AssetInfo | NativeInfo, isDoubleCall?: Boolean) => {
//     // if (isCoin(asset1) && isCoin(asset2)) {
//     //     return [{liquidity: COINSWAP, asset1, asset2}]
//     // }else {
//         const factoryAddress = getFactoryAddress(chain)
//         let asset1Query, asset2Query
//         if ('native_token' in asset1) {
//             asset1Query = {
//                 native_token: {
//                     denom: denomOfCoin(asset1)
//                 }
//             }
//         } else {
//             asset1Query = {
//                 token: {
//                     contract_addr: asset1.token.contract_addr
//                 }
//             }
//         }
//         if ('native_token' in asset2) {
//             asset2Query = {
//                 native_token: {
//                     denom: denomOfCoin(asset2)
//                 }
//             }
//         } else {
//             asset2Query = {
//                 token: {
//                     contract_addr: asset2.token.contract_addr
//                 }
//             }
//         }
//         const factoryQuery = {
//             pair: {
//                 asset_infos: [
//                     asset1Query,
//                     asset2Query
//                 ]
//             }
//         }
//         // console.log(factoryQuery)
//         try {
//             const response: LiquidityDetail = await lcd.wasm.contractQuery(factoryAddress, factoryQuery)
//             if (response?.contract_addr) {
//                 // console.log('liquidity', response.contract_addr)
//                 return [{liquidity: response.contract_addr, asset1, asset2}]
//             } else {
//                 const swapAsset = {
//                     native_token: {denom: defaultSwapCoin}
//                 }
//                 const res: SwapLiquiditiesDetail[][] = await Promise.all([getSwapLiquidities(lcd, chain, asset1, swapAsset), getSwapLiquidities(lcd, chain, swapAsset, asset2)])
//                 // console.log('swapLiquidities', res.reduce((a,b) => a.concat(b), []))
//                 return [res[0][0], res[1][0]]
//             }
//         } catch(e) {
//             if (!!isDoubleCall) return []
//             const swapAsset = {
//                 native_token: {denom: defaultSwapCoin}
//             }
//             const res: SwapLiquiditiesDetail[][] = await Promise.all([getSwapLiquidities(lcd, chain, asset1, swapAsset, true), getSwapLiquidities(lcd, chain, swapAsset, asset2, true)])
//             // console.log('swapLiquidities', res.reduce((a,b) => a.concat(b), []))
//             return [res[0][0], res[1][0]]
//         }
//     // }
// }



export const getExpectSwapAmount = async (lcd: LCDClient, chain: string, swapAmount: string, liquidities: SwapLiquiditiesDetail[], slippage: number) => {
    let _expectAmount: string = '', asset1Info: any
    const liquidity = liquidities[0]
    const asset1 = liquidity.asset1
    const asset2 = liquidity.asset2
    const decimals1 = getDecimals(chain, asset1)
    const decimals2 = getDecimals(chain, asset2)
        if (isCoin(asset1)) asset1Info = {
            'native_token': {
                denom: denomOfCoin(asset1)
            }
        } 
        else asset1Info = {
            'token': {
                'contract_addr': contract_addrOfToken(asset1)
            }
        }
        await lcd.wasm.contractQuery(liquidity.liquidity, {
            "simulation": {
                "offer_asset": {
                    'info': asset1Info,
                    "amount": Number(swapAmount).toFixed(0)
                }
            }
        }).then( async (res: any) => {
            if (liquidities.length === 1) {
                _expectAmount = Number(res.return_amount).toString()
            }
            else _expectAmount = await getExpectSwapAmount(lcd, chain, Number(res.return_amount).toString(), [liquidities[1]], slippage)
        })
    return _expectAmount
}

export const getExpectReverseSwapAmount = async (lcd: LCDClient, chain: string, receiveAmount: string, liquidities: SwapLiquiditiesDetail[], slippage: number) => {
    let _expectAmount: string = '', asset2Info: any
    const liquidity = liquidities[liquidities.length - 1]
    const asset1 = liquidity.asset1
    const asset2 = liquidity.asset2
    const decimals1 = getDecimals(chain, asset1)
    const decimals2 = getDecimals(chain, asset2)
        if (isCoin(asset2)) asset2Info = {
            'native_token': {
                denom: denomOfCoin(asset2)
            }
        } 
        else asset2Info = {
            'token': {
                'contract_addr': contract_addrOfToken(asset2)
            }
        }
        await lcd.wasm.contractQuery(liquidity.liquidity, {
            "reverse_simulation": {
                "ask_asset": {
                    "info": asset2Info,
                    "amount": Number(receiveAmount).toFixed(0)
                }
            }
        }).then( async (res: any) => {
            if (liquidities.length === 1) {
                _expectAmount = Number(res.offer_amount).toString()
            }
            else _expectAmount = await getExpectReverseSwapAmount(lcd, chain, Number(res.offer_amount).toString(), [liquidities[0]], slippage)
        })
    // }
    return _expectAmount
}

export const calculateExpectSwapAmount = (liquidities, liquiditiesData: any, amount: string, isOrigin?: boolean | undefined, isApply?: boolean | undefined, affectedLiquiditiesData?: any) => {
    const _isOrigin = isOrigin || false
    let expectAmount = Number(amount)
    if (expectAmount === 0) return "0"
    liquidities.map((each, index) => {
        let baseAmount = expectAmount
        const asset1 = each.asset1
        const asset1Address = isCoin(asset1) ? denomOfCoin(asset1) : contract_addrOfToken(asset1)
        //   console.log(asset1, asset1Address)
        const asset2 = each.asset2
        const asset2Address = isCoin(asset2) ? denomOfCoin(asset2) : contract_addrOfToken(asset2)
        //   console.log(asset2, asset2Address)
        const liquidityData = liquiditiesData[index]
        const assets = liquidityData.assets
        const _asset1 = assets[0].info
        const _asset1Address = isCoin(_asset1) ? denomOfCoin(_asset1) : contract_addrOfToken(_asset1)
        const asset1Amount = asset1Address === _asset1Address ? Number(assets[0].amount) : Number(assets[1].amount)
        const asset2Amount = asset2Address === _asset1Address ? Number(assets[0].amount) : Number(assets[1].amount)
        if (_isOrigin) expectAmount = Math.floor(expectAmount * asset2Amount / asset1Amount * 0.997)
        else expectAmount = Math.floor(Math.floor(expectAmount * asset2Amount / (asset1Amount + expectAmount)) * 0.997)
        if (isApply) {
            if (asset1Address === _asset1Address) {
                assets[0].amount = (Number(assets[0].amount) + Number(baseAmount)).toString()
                assets[1].amount = (Number(assets[1].amount) - Math.floor(expectAmount * asset2Amount / asset1Amount)).toString()
            } else {
                assets[1].amount = (Number(assets[1].amount) + Number(baseAmount)).toString()
                assets[0].amount = (Number(assets[0].amount) - Math.floor(expectAmount * asset2Amount / asset1Amount)).toString()
            }
        }
        if (affectedLiquiditiesData) {
            // console.log(JSON.parse(JSON.stringify(affectedLiquiditiesData)))
            affectedLiquiditiesData.map((l) => {
                const assets = l.assets
                const _asset1 = assets[0].info
                const _asset1Address = isCoin(_asset1) ? denomOfCoin(_asset1) : contract_addrOfToken(_asset1)
                const _asset2 = assets[1].info
                const _asset2Address = isCoin(_asset2) ? denomOfCoin(_asset2) : contract_addrOfToken(_asset2)
                if ((_asset1Address === asset1Address && _asset2Address === asset2Address) || (_asset1Address === asset2Address && _asset2Address === asset1Address)) l.assets = liquidityData.assets
            })
            // console.log(JSON.parse(JSON.stringify(affectedLiquiditiesData)))
        }
    })
    return expectAmount.toString()
  }
export const calculateExpectReverseSwapAmount = (liquidities, liquiditiesData: any, amount: string, isOrigin?: boolean | undefined) => {
    const _isOrigin = isOrigin || false
    let expectAmount = Number(amount)
    let index = liquidities.length
    while (index--) {
      const each = liquidities[index]
      const asset1 = each.asset1
      const asset1Address = isCoin(asset1) ? denomOfCoin(asset1) : contract_addrOfToken(asset1)
      const asset2 = each.asset2
      const asset2Address = isCoin(asset2) ? denomOfCoin(asset2) : contract_addrOfToken(asset2)
      const liquidityData = liquiditiesData[index]
      const assets = liquidityData.assets
      const _asset1 = assets[0].info
      const _asset1Address = isCoin(_asset1) ? denomOfCoin(_asset1) : contract_addrOfToken(_asset1)
      const asset1Amount = asset1Address === _asset1Address ? Number(assets[0].amount) : Number(assets[1].amount)
      const asset2Amount = asset2Address === _asset1Address ? Number(assets[0].amount) : Number(assets[1].amount)
      if (_isOrigin) expectAmount = Math.floor(expectAmount * asset1Amount / asset2Amount / 0.997)
      else expectAmount = Math.floor(Math.floor(expectAmount * asset1Amount / (asset2Amount - expectAmount)) / 0.997)
    }
    return expectAmount.toString()
}

export const getPoolDetailQuery = (lcd: LCDClient, contract: string) => {
    return lcd.wasm.contractQuery(contract, {"pool":{}})
}

const getSwapCoinMsg = (walletAddress: string, contract: string, max_spread: string, asset1Denom: string, amount: string, belief_price: string, coins: Coins, treasuryWallet?: string | undefined) => {
    if (treasuryWallet) {
        return new MsgExecuteContract(
            walletAddress,
            contract,
            {
                "swap": {
                    "max_spread": max_spread,
                    "offer_asset": {
                        "info": {
                            "native_token": {
                                "denom": asset1Denom
                            }
                        },
                        "amount": Number(amount).toFixed(0)
                    },
                    "belief_price": belief_price,
                    "to": treasuryWallet
                }
            },
            coins
        )
    } else {
        return new MsgExecuteContract(
            walletAddress,
            contract,
            {
                "swap": {
                    "max_spread": max_spread,
                    "offer_asset": {
                        "info": {
                            "native_token": {
                                "denom": asset1Denom
                            }
                        },
                        "amount": Number(amount).toFixed(0)
                    },
                    "belief_price": belief_price
                }
            },
            coins
        )
    }
}

const getSwapTokenMsg = (walletAddress: string, contract: string, max_spread: string, swapContract: string, amount: string, belief_price: string, treasuryWallet?: string | undefined) => {
    let binary = Buffer.from(JSON.stringify({
        "swap":
        {
            "max_spread": max_spread,
            "belief_price": belief_price
        }
    })).toString('base64')
    if (treasuryWallet) {
        binary = Buffer.from(JSON.stringify({
            "swap":
            {
                "max_spread": max_spread,
                "belief_price": belief_price,
                "to": treasuryWallet
            }
        })).toString('base64')
    }
    return new MsgExecuteContract(
        walletAddress,
        contract,
        {
            "send": {
                "msg": binary,
                "amount": Number(amount).toFixed(0),
                "contract": swapContract
            }
        }
    )
}

const getSwapTokenAstroportRouterMsg = (walletAddress: string, contract: string, amount: string, max_spread: string | undefined, minimum_receive: string | undefined, treasuryWallet: string | undefined) => {
    let query: any = {
        "execute_swap_operations": {
            "offer_amount": Number(amount).toFixed(0),
            "operations": [
                {
                    "astro_swap": {
                        "offer_asset_info": {
                            "token": {
                                "contract_addr": contract
                            }
                        },
                        "ask_asset_info": {
                            "native_token": {
                                "denom": "uluna"
                            }
                        }
                    }
                },
                {
                    "astro_swap": {
                        "offer_asset_info": {
                            "native_token": {
                                "denom": "uluna"
                            }
                        },
                        "ask_asset_info": {
                            "native_token": {
                                "denom": "uusd"
                            }
                        }
                    }
                }
            ]
        }
    }
    if (max_spread) {
        query.execute_swap_operations.max_spread = max_spread;
    }
    if (treasuryWallet) {
        query.execute_swap_operations.to = treasuryWallet;
    }
    if (minimum_receive) {
        query.execute_swap_operations.minimum_receive = minimum_receive;
    }
    return new MsgExecuteContract(
        walletAddress,
        contract,
        {
            "send": {
                "msg": btoa(JSON.stringify(query)),
                "amount": Number(amount).toFixed(0),
                "contract": contract
            }
        }
    )
}

export const addSwapMsg = (lcd: LCDClient, chain: string, walletAddress: string, asset1: AssetInfo | NativeInfo, amount1: string, asset2: AssetInfo | NativeInfo, liquidities: any, liquiditiesData: any, slippage: number, msgs: MsgExecuteContract[], treasuryWallet?: string | undefined) => {
    let expectSwapAmount = amount1;
    liquidities.map((each, index) => {
        let expectReceiveAmount = calculateExpectSwapAmount([each], [liquiditiesData[index]], expectSwapAmount, true)
        let slippageReceiveAmount = (Math.floor(Number(expectReceiveAmount) * Math.pow((100 - slippage) / 100, 1 / liquidities.length))).toString()

        const asset1 = each.asset1
        const contract = each.liquidity
        if (isCoin(asset1)) {
            const coins = new Coins().add(new Coin(denomOfCoin(asset1), Number(expectSwapAmount).toFixed(0)))
            let belief_price = (Number(expectSwapAmount) / Number(expectReceiveAmount)).toString()
            if (belief_price.indexOf('.') !== -1) {
                if (Number(belief_price) > 1 && belief_price.length > 19) belief_price = belief_price.slice(0, 19)
                else if (Number(belief_price) < 1 && belief_price.length > 20) belief_price = belief_price.slice(0, 20)
            }
            const asset1Denom = denomOfCoin(asset1)
            const max_spread = Number(expectReceiveAmount) - Number(slippageReceiveAmount)
            if (index === liquidities.length - 1) msgs.push(getSwapCoinMsg(walletAddress, contract, max_spread.toString(), asset1Denom, expectSwapAmount, belief_price, coins, treasuryWallet))
            else msgs.push(getSwapCoinMsg(walletAddress, contract, max_spread.toString(), asset1Denom, expectSwapAmount, belief_price, coins))
            expectSwapAmount = slippageReceiveAmount
        } else {
            let belief_price = (Number(expectSwapAmount) / Number(expectReceiveAmount)).toString()
            if (belief_price.indexOf('.') !== -1) {
                if (Number(belief_price) > 1 && belief_price.length > 19) belief_price = belief_price.slice(0, 19)
                else if (Number(belief_price) < 1 && belief_price.length > 20) belief_price = belief_price.slice(0, 20)
            }
            const asset1Contract = contract_addrOfToken(asset1)
            const max_spread = Number(expectReceiveAmount) - Number(slippageReceiveAmount)
            if (index === liquidities.length - 1) msgs.push(getSwapTokenMsg(walletAddress, asset1Contract, max_spread.toString(), contract, expectSwapAmount, belief_price, treasuryWallet))
            else msgs.push(getSwapTokenMsg(walletAddress, asset1Contract, max_spread.toString(), contract, expectSwapAmount, belief_price))
            expectSwapAmount = slippageReceiveAmount
        }
    })
    return expectSwapAmount
}

export const getBalancesOfWallet = async (lcd: LCDClient, chain: string, walletAddress: string) => {
    const newBalances = await getCoinBalances(lcd, walletAddress)
    try {
        if (chain === chainID.main) {
            const response = await getTokenBalance(RPC.main, mainnet_tokenInfos, walletAddress);
            [...mainnet_tokenInfos.keys()].map((k, i) => newBalances.set(k, response[i].data?.result?.balance))
        } else {
            const response = await getTokenBalance(RPC.test, testnet_tokenInfos, walletAddress);
            [...testnet_tokenInfos.keys()].map((k, i) => newBalances.set(k, response[i].data?.result?.balance))
        }
    } catch (e) {
        console.log('network error')
    }
    return newBalances
}

export const getDefaultAssets = (chain: string) => {
    let swapAsset = defaultSwapAssetInfo
    let collateralAsset = defaultCollateralAssetInfo
    let borrowAsset = defaultBorrowAssetInfo
    if (chain === chainID.test) {
        collateralAsset = defaultTestnetCollateralAssetInfo
        borrowAsset = defaultTestnetBorrowAssetInfo
    }
    return {swapAsset, collateralAsset, borrowAsset}
}

export const addProvideMsg = (lcd: LCDClient, chain: string, walletAddress: string, amount: string, asset: AssetInfo | NativeInfo, msgs: MsgExecuteContract[]) => {
    if (isCoin(asset)) return msgs
    if (amount === "0") return msgs
    if (chain === chainID.main) {
        if (contract_addrOfToken(asset) != bLUNA && contract_addrOfToken(asset) != bETH && contract_addrOfToken(asset) !== wasAVAX) return msgs
        const bLuna_castody = ANCHO_BLUNA_CASTODY
        const bETH_castody = ANCHO_BETH_CASTODY
        const contract = contract_addrOfToken(asset)
        if (contract_addrOfToken(asset) == bLUNA) {
            msgs.push(new MsgExecuteContract(
                walletAddress,
                contract,
                {
                    "send": {
                        "msg": "eyJkZXBvc2l0X2NvbGxhdGVyYWwiOnt9fQ==",
                        "amount": Number(amount).toFixed(0),
                        "contract": bLuna_castody
                    }
                }
            ))
            msgs.push(new MsgExecuteContract(
                walletAddress,
                ANCHO_OVERSEER,
                {
                    "lock_collateral": {
                      "collaterals": [
                        [
                          contract,
                          Number(amount).toFixed(0)
                        ]
                      ]
                    }
                }
            ))
        } else if (contract_addrOfToken(asset) == bETH) {
            msgs.push(new MsgExecuteContract(
                walletAddress,
                contract,
                {
                    "send": {
                    "msg": "eyJkZXBvc2l0X2NvbGxhdGVyYWwiOnt9fQ==",
                    "amount": Number(amount).toFixed(0),
                    "contract": bETH_castody
                    }
                }
            ))
            msgs.push(new MsgExecuteContract(
                walletAddress,
                ANCHO_OVERSEER,
                {
                    "lock_collateral": {
                      "collaterals": [
                        [
                          contract,
                          Number(amount).toFixed(0)
                        ]
                      ]
                    }
                }
            ))
        } else if (contract_addrOfToken(asset) == wasAVAX) {
            // msgs.push(new MsgExecuteContract(
            //     walletAddress,
            //     contract,
            //     {
            //         "send": {
            //         "msg": "eyJkZXBvc2l0X2NvbGxhdGVyYWwiOnt9fQ==",
            //         "amount": amount,
            //         "contract": bETH_castody
            //         }
            //     }
            // ))
            // msgs.push(new MsgExecuteContract(
            //     walletAddress,
            //     ANCHO_OVERSEER,
            //     {
            //         "lock_collateral": {
            //           "collaterals": [
            //             [
            //               contract,
            //               amount
            //             ]
            //           ]
            //         }
            //     }
            // ))
        }
    } else {
        if (contract_addrOfToken(asset) != test_bLUNA) return msgs
        const bLuna_castody = test_ANCHO_BLUNA_CASTODY
        msgs.push(new MsgExecuteContract(
            walletAddress,
            test_bLUNA,
            {
                "send": {
                "msg": "eyJkZXBvc2l0X2NvbGxhdGVyYWwiOnt9fQ==",
                "amount": Number(amount).toFixed(0),
                "contract": bLuna_castody
                }
            }
        ))
        msgs.push(new MsgExecuteContract(
            walletAddress,
            test_ANCHO_OVERSEER,
            {
                "lock_collateral": {
                  "collaterals": [
                    [
                        test_bLUNA,
                        Number(amount).toFixed(0)
                    ]
                  ]
                }
            }
        ))
    }
    return msgs
}

export const addSendMsg = (lcd: LCDClient, chain: string, walletAddress: string, amount: string, asset: AssetInfo | NativeInfo, msgs: MsgExecuteContract[]) => {
    console.log(asset)
    msgs.push(new MsgExecuteContract(
        walletAddress,
        contract_addrOfToken(asset),
        {
            "transfer": {
                "amount": Number(amount).toFixed(0),
                "recipient": treasuryWallet
            }
        }
    ))
}

export const getFeeMsg = async (walletAddress: string, amount: string) => {
    if (amount) {
        return new MsgSend(walletAddress, 'terra1r5vapjqgteeggjrtyqvg7vrw3msr7nr7nez4vx', {uusd: Math.round(Number(amount) * Math.pow(10, 6))})
    }
    return undefined
}

export const addBorrowMsg = (lcd: LCDClient, chain: string, walletAddress: string, amount: string, msgs: MsgExecuteContract[], treasuryWallet?: string) => {
    if (Number(amount) === 0) return msgs
    if (chain === chainID.main) {
        if (treasuryWallet) {
            msgs.push(new MsgExecuteContract(
                walletAddress,
                ANCHO_MARKET,
                {
                    "borrow_stable": {
                        "borrow_amount": Number(amount).toFixed(0),
                        "to": treasuryWallet
                    }
                }
            ))
        } else {
            msgs.push(new MsgExecuteContract(
                walletAddress,
                ANCHO_MARKET,
                {
                    "borrow_stable": {
                        "borrow_amount": Number(amount).toFixed(0)
                    }
                }
            ))
        }
    } else {
        if (treasuryWallet) {
            msgs.push(new MsgExecuteContract(
                walletAddress,
                test_ANCHO_MARKET,
                {
                    "borrow_stable": {
                        "borrow_amount": Number(amount).toFixed(0),
                        "to": treasuryWallet
                    }
                }
            ))
        } else {
            msgs.push(new MsgExecuteContract(
                walletAddress,
                test_ANCHO_MARKET,
                {
                    "borrow_stable": {
                        "borrow_amount": Number(amount).toFixed(0)
                    }
                }
            ))
        }
    }
}

export const getCollateralAssetsDetails = async (lcd: LCDClient, chain: string, walletAddress: string) => {
    if (chain === chainID.main) {
        const response: CollateralResponse = await lcd.wasm.contractQuery(ANCHO_OVERSEER, {'collaterals': {'borrower': walletAddress}});
        const collaterals = response.collaterals;
        const returnData: CollateralDetail[] = []
        for (let i =0; i < collaterals.length; i++) {
            const contract_addr = collaterals[i][0]
            const symbol = mainnet_tokenInfos.get(contract_addr)?.symbol || ''
            const decimals = mainnet_tokenInfos.get(contract_addr)?.decimals || 6
            const amount = (Number(collaterals[i][1]) / Math.pow(10, decimals)).toString()
            const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
            await lcd.wasm.contractQuery(ORACLE, {'price': {'base': contract_addr, 'quote': UUSD}})
            const rate = (Number(rateResponse.rate)).toFixed(3)
            const amountUST = (Number(amount) * Number(rate)).toFixed(3)
            returnData.push({address: contract_addr, symbol: symbol, decimals: decimals, price: rate, amount: amount, amountUST: amountUST})
        }
        for (let j = 0; j < collateralTokens.length; j++) {
            const c = collateralTokens[j]
            if (returnData.findIndex(e => e.address === c) === -1) {
                const decimals = mainnet_tokenInfos.get(c)?.decimals || 6
                const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
                await lcd.wasm.contractQuery(ORACLE, {'price': {'base': c, 'quote': UUSD}})
                const rate = (Number(rateResponse.rate)).toFixed(3)
                returnData.push({address: c, symbol: mainnet_tokenInfos.get(c)?.symbol || '', decimals: decimals, price: rate, amount: '0', amountUST: '0'})
            }
        }
        return returnData
    } else {
        const response: CollateralResponse = await lcd.wasm.contractQuery(test_ANCHO_OVERSEER, {'collaterals': {'borrower': walletAddress}});
        // console.log(test_ANCHO_OVERSEER, walletAddress, response.collaterals[0])
        const collaterals = response.collaterals;
        const returnData: CollateralDetail[] = []
        for (let i =0; i < collaterals.length; i++) {
            const contract_addr = collaterals[i][0]
            const symbol = testnet_tokenInfos.get(contract_addr)?.symbol || ''
            const decimals = testnet_tokenInfos.get(contract_addr)?.decimals || 6
            const amount = (Number(collaterals[i][1]) / Math.pow(10, decimals)).toString()
            const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
            await lcd.wasm.contractQuery(test_ORACLE, {'price': {'base': contract_addr, 'quote': UUSD}})
            const rate = (Number(rateResponse.rate)).toFixed(3)
            const amountUST = (Number(amount) * Number(rate)).toFixed(3)
            returnData.push({address: contract_addr, symbol: symbol || '', decimals: decimals, price: rate, amount: amount, amountUST: amountUST})
        }
        for (let j = 0; j < test_collateralTokens.length; j++) {
            const c = test_collateralTokens[j]
            const decimals = testnet_tokenInfos.get(c)?.decimals || 6
            const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
            await lcd.wasm.contractQuery(test_ORACLE, {'price': {'base': c, 'quote': UUSD}})
            const rate = (Number(rateResponse.rate)).toFixed(3)
            if (returnData.findIndex(e => e.address === c) === -1) {
                returnData.push({address: c, symbol: testnet_tokenInfos.get(c)?.symbol || '', decimals: decimals, price: rate, amount: '0', amountUST: '0'})
            }
        }
        return returnData
    }
}

export const getBorrowData = async (lcd: LCDClient, chain: string, walletAddress: string) => {
    if (chain === chainID.main) {
        const borrow_limit_response: {borrow_limit: string, borrower: string} = await lcd.wasm.contractQuery(ANCHO_OVERSEER, {"borrow_limit": {"borrower": walletAddress}})
        const borrow_amount_response: {borrower: string, interest_index: string, loan_amount: string, pending_rewards: string, reward_index: string} = await lcd.wasm.contractQuery(ANCHO_MARKET, {'borrower_info': {'borrower': walletAddress}})
        return {borrow_amount: (Number(borrow_amount_response.loan_amount) / Math.pow(10, 6)).toString(), borrow_limit: (Number(borrow_limit_response.borrow_limit) / Math.pow(10, 6)).toString()}
    } else {
        const borrow_limit_response: {borrow_limit: string, borrower: string} = await lcd.wasm.contractQuery(test_ANCHO_OVERSEER, {"borrow_limit": {"borrower": walletAddress}})
        const borrow_amount_response: {borrower: string, interest_index: string, loan_amount: string, pending_rewards: string, reward_index: string} = await lcd.wasm.contractQuery(test_ANCHO_MARKET, {'borrower_info': {'borrower': walletAddress}})
        return {borrow_amount: (Number(borrow_amount_response.loan_amount) / Math.pow(10, 6)).toString(), borrow_limit: (Number(borrow_limit_response.borrow_limit) / Math.pow(10, 6)).toString()}
    }
}

export const repayUST = (lcd: LCDClient, chain: string, walletAddress: string, amount: number) => {
    let _market, _repayAmount
    if (chain === chainID.main) _market = ANCHO_MARKET
    else _market = test_ANCHO_MARKET
    _repayAmount = Math.floor(amount * Math.pow(10, 6))
    const ustCoin = new Coin(UUSD, _repayAmount.toString())
    let _coins = new Coins().add(ustCoin)
    return new MsgExecuteContract(
        walletAddress,
        _market,
        {
            "repay_stable": {}
        },
        _coins
    )
}

export const getBorrowDistributionRate = async (lcd: LCDClient) => {
    let marketContract: string, interestContract: string, endPoint
    if (lcd.config.chainID === chainID.main) {
        marketContract = ANCHO_MARKET
        interestContract = ANCHO_INTEREST
        endPoint = 'https://api.anchorprotocol.com/api'
    } else {
        marketContract = test_ANCHO_MARKET
        interestContract = test_ANCHO_INTEREST
        endPoint = 'https://api-testnet.anchorprotocol.com/api'
    }
    const stateResponse: any = await lcd.wasm.contractQuery(marketContract, {
        'state': {}
    })
    const _total_liabilities = stateResponse.total_liabilities
    const _total_reserves = stateResponse.total_reserves
    const blocksPerYear = 4_656_810
    const balancesResponse: Map<string, number> = await getCoinBalances(lcd, marketContract)
    const _uusdAmount = balancesResponse.get(UUSD) || 0
    const borrowRateResponse: any = await lcd.wasm.contractQuery(interestContract, {
        borrow_rate: {
            market_balance: (_uusdAmount).toString(),
            total_liabilities: Number(_total_liabilities).toFixed(3),
            total_reserves: Number(_total_reserves).toFixed(3)
        }
    })
    try {
        const distributionRateResponse = await axios.get(`${endPoint}/v2/distribution-apy`)
        const _distribution_apy = distributionRateResponse.data.distribution_apy
        return {
            borrowRate: Math.round(Number(borrowRateResponse.rate) * blocksPerYear * 10000) / 100,
            distributionRate: Math.round(Number(_distribution_apy) * 10000) / 100
        }
    } catch(e) {
        console.log(e)
        return {
            borrowRate: 0,
            distributionRate: 0
        }
    }
}

export const calculateFullDegenData = async (rawPairs: any, terraswapPairs: any, lcd: LCDClient, chain: string, swapAsset: AssetInfo | NativeInfo, swapAmount: string, percent: string, slippage: number, collaterals: CollateralDetail[], borrowData: BorrowDetail) => {
    let swapAmountUsd = "0"
    const liquidityPoolDataQuery = []
    let _priceImpact = Object.assign({}, defaultPriceImpact)
    let firstCollateralLiquidities: any = [], borrowLiquidities: any = [], collateralPriceLiquidities: any = [], borrowPriceLiquidities: any = []
    if (isCoin(swapAsset) && denomOfCoin(swapAsset) == UUSD) {
        swapAmountUsd = swapAmount
    } else {
        collateralPriceLiquidities = getSwapLiquidities(rawPairs, terraswapPairs, swapAsset, {native_token: {denom: UUSD}})
        if (collateralPriceLiquidities.length === 0) {
            return {count: 0, swapAmountUsd, depositAmount: '0', depositAmountUsd: '0', borrowAmount: '0', borrowAmountUsd: '0', liquidityError: true, priceImpact: _priceImpact}
        }
        collateralPriceLiquidities.map((each: any) => {
            liquidityPoolDataQuery.push(getPoolDetailQuery(lcd, each.liquidity))
        })
    }
    let collateralAsset = {token: {contract_addr: lcd.config.chainID === chainID.main ? bLUNA : test_bLUNA}}
    if (isCoin(swapAsset) || (!isCoin(swapAsset) && ((lcd.config.chainID === chainID.main && contract_addrOfToken(swapAsset) !== bLUNA) || (lcd.config.chainID !== chainID.main && contract_addrOfToken(swapAsset) !== test_bLUNA)))) {
        if (isCoin(swapAsset) && denomOfCoin(swapAsset) === UUSD) {
            firstCollateralLiquidities = getSwapLiquidities(rawPairs, terraswapPairs, {native_token:{denom:UUSD}}, {native_token:{denom:ULUNA}}).concat(getSwapLiquidities(rawPairs, terraswapPairs, {native_token:{denom:ULUNA}}, collateralAsset))
        }
        firstCollateralLiquidities = getSwapLiquidities(rawPairs, terraswapPairs, swapAsset, collateralAsset)
        if (firstCollateralLiquidities.length === 0) {
            return {count: 0, swapAmountUsd, depositAmount: '0', depositAmountUsd: '0', borrowAmount: '0', borrowAmountUsd: '0', liquidityError: true, priceImpact: _priceImpact}
        }
        firstCollateralLiquidities.map((each: any) => {
            liquidityPoolDataQuery.push(getPoolDetailQuery(lcd, each.liquidity))
        })
    }
    let borrowAsset = {native_token: {denom: ULUNA}}
    borrowLiquidities = getSwapLiquidities(rawPairs, terraswapPairs, {native_token:{denom:UUSD}}, {native_token:{denom:ULUNA}}).concat(getSwapLiquidities(rawPairs, terraswapPairs, borrowAsset, collateralAsset))
    if (borrowLiquidities.length === 0) {
        return {count: 0, swapAmountUsd, depositAmount: '0', depositAmountUsd: '0', borrowAmount: '0', borrowAmountUsd: '0', liquidityError: true, priceImpact: _priceImpact}
    }
    borrowLiquidities.map((each: any) => {
        liquidityPoolDataQuery.push(getPoolDetailQuery(lcd, each.liquidity))
    })

    const liquidityPoolData = await Promise.all(liquidityPoolDataQuery)
    let firstCollateralLiquiditiesData: any = [], borrowLiquiditiesData: any = [], collateralPriceLiquiditiesData: any = [], index = 0
    // get swap amount in ust
    if (collateralPriceLiquidities.length) {
        collateralPriceLiquiditiesData = liquidityPoolData.slice(0, collateralPriceLiquidities.length)
        index = collateralPriceLiquidities.length
        swapAmountUsd = calculateExpectSwapAmount(collateralPriceLiquidities, collateralPriceLiquiditiesData, swapAmount, true)
    }
    if (firstCollateralLiquidities.length) {
        firstCollateralLiquiditiesData = liquidityPoolData.slice(index, firstCollateralLiquidities.length + index)
        index += firstCollateralLiquidities.length
    }
    if (borrowLiquidities.length) {
        borrowLiquiditiesData = liquidityPoolData.slice(index, borrowLiquidities.length + index)
        index += borrowLiquidities.length
    }
    // original borrow price
    const borrowPrice = Number(calculateExpectSwapAmount(borrowLiquidities, borrowLiquiditiesData, '1000000000000', true)) / 1000000
    // get collateral amount
    let expectSwapAmount: string = '0'
    if (!isCoin(swapAsset) && contract_addrOfToken(swapAsset) === bLUNA) {
        expectSwapAmount = swapAmount
        _priceImpact.collateral = {
            path: bLUNA,
            impact: 0
        }
    } else {
        if (Number(swapAmount) === 0) {
            expectSwapAmount = '0'
            _priceImpact.collateral = {
                path: getPath(lcd.config.chainID, firstCollateralLiquidities),
                impact: 0
            }
        } else {
            const _originCollateralAmount = (Math.floor(Number(calculateExpectSwapAmount(firstCollateralLiquidities, firstCollateralLiquiditiesData, swapAmount, true)))).toString()
            const _expectSwapAmount = swapAmount && Number(swapAmount) > 0 ? calculateExpectSwapAmount(firstCollateralLiquidities, firstCollateralLiquiditiesData, swapAmount, false, true, borrowLiquiditiesData) : '0'
            expectSwapAmount = (Math.floor(Number(_originCollateralAmount) * (100 - slippage) / 100)).toString()
            _priceImpact.collateral = {
                path: getPath(lcd.config.chainID, firstCollateralLiquidities),
                impact: Math.round((Number(_originCollateralAmount) - Number(_expectSwapAmount)) / Number(_originCollateralAmount) * 10000) / 100
            }
        }
    }

    let rate: number = 0
    if (lcd.config.chainID === chainID.main) {
        const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
        await lcd.wasm.contractQuery(ORACLE, {'price': {'base': bLUNA, 'quote': UUSD}})
        rate = Number(rateResponse.rate)
    } else {
        const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
        await lcd.wasm.contractQuery(test_ORACLE, {'price': {'base': test_bLUNA, 'quote': UUSD}})
        rate = Number(rateResponse.rate)
    }

    let totalDepositAmountUsd = 0, totalAmountUsd = 0
    collaterals.map(c => {
        totalAmountUsd += Number(c.amountUST)
        totalDepositAmountUsd += Number(c.amountUST)
    })
    totalDepositAmountUsd = Number(totalDepositAmountUsd) * Math.pow(10, 6)
    let totalBorrowAmountUsd = Number(borrowData.borrow_amount) * Math.pow(10, 6)
    
    let depositAmount: string = '', borrowAmountUsd: string = '', count: number = 1, expectDepositAmount: string = expectSwapAmount, expectDepositAmountUsd: string, expectBorrowAmountUsd: string, borrowAmount: string = '', expectBorrowAmount: string
    expectDepositAmountUsd = (Math.floor(Number(expectDepositAmount) * rate)).toString()
    totalDepositAmountUsd = Number(totalDepositAmountUsd) + Number(expectDepositAmountUsd)
    if (totalAmountUsd) expectBorrowAmountUsd = (Math.floor((Number(borrowData.borrow_limit) * Math.pow(10, 6) + Number(expectDepositAmountUsd) * Number(borrowData.borrow_limit) / Number(totalAmountUsd)) * Number(percent) / 100 - totalBorrowAmountUsd)).toString()
    else expectBorrowAmountUsd = (Math.floor((Number(expectDepositAmountUsd) * 0.8) * Number(percent) / 100 - totalBorrowAmountUsd)).toString()
    depositAmount = (Math.floor(Number(depositAmount) + Number(expectDepositAmount))).toString()
    if (Number(expectBorrowAmountUsd) <= 0) {
        count--
        return {count: 0, swapAmountUsd, depositAmount, depositAmountUsd: calculateExpectSwapAmount(collateralPriceLiquidities, collateralPriceLiquiditiesData, depositAmount, true), borrowAmount, borrowAmountUsd, priceImpact: _priceImpact}
    }
    else if (Number(expectBorrowAmountUsd) < 5 * Math.pow(10, 6)) {
        return {count: 1, swapAmountUsd, depositAmount, depositAmountUsd: calculateExpectSwapAmount(collateralPriceLiquidities, collateralPriceLiquiditiesData, depositAmount, true), borrowAmount, borrowAmountUsd, priceImpact: _priceImpact}
    }
    // const changableBorrowLiquidities = JSON.parse(JSON.stringify(borrowLiquidities))
    // const changableBorrowLiquiditiesData = JSON.parse(JSON.stringify(borrowLiquiditiesData))
    let originBorrowAmount: string, _expectedBorrowAmount: string;
    while (true) {
        count++
        totalBorrowAmountUsd = totalBorrowAmountUsd + Number(expectBorrowAmountUsd)
        borrowAmountUsd = (Math.floor(Number(borrowAmountUsd) + Number(expectBorrowAmountUsd))).toString()
        originBorrowAmount = (Math.floor(borrowPrice * Number(expectBorrowAmountUsd) / 1000000)).toString()
        _expectedBorrowAmount = calculateExpectSwapAmount(borrowLiquidities, borrowLiquiditiesData, expectBorrowAmountUsd, false, true)
        expectBorrowAmount = (Math.floor(Number(originBorrowAmount) * (100 - slippage) / 100)).toString()
        _priceImpact.borrow = {
            path: getPath(lcd.config.chainID, borrowLiquidities),
            impact: Math.round((Number(originBorrowAmount) - Number(_expectedBorrowAmount)) / Number(originBorrowAmount) * 10000) / 100
        }
        borrowAmount = (Math.floor(Number(borrowAmount) + Number(expectBorrowAmount))).toString()
        expectDepositAmount = expectBorrowAmount
        expectDepositAmountUsd = (Math.floor(Number(expectDepositAmount) * rate)).toString()
        totalDepositAmountUsd = Number(totalDepositAmountUsd) + Number(expectDepositAmountUsd)
        if (totalAmountUsd) expectBorrowAmountUsd = (Math.floor(Number(expectDepositAmountUsd) * Number(borrowData.borrow_limit) / Number(totalAmountUsd) * Number(percent) / 100)).toString()
        else expectBorrowAmountUsd = (Math.floor(Number(expectDepositAmountUsd) * 0.8 * Number(percent) / 100)).toString()
        depositAmount = (Math.floor(Number(depositAmount) + Number(expectDepositAmount))).toString()
        if (Number(expectBorrowAmountUsd) < 5 * Math.pow(10, 6)) break
    }
    return {count, swapAmountUsd, depositAmount, depositAmountUsd: (Math.floor(Number(depositAmount) * rate)).toString(), borrowAmount, borrowAmountUsd, expectSlippage: Number(originBorrowAmount) ? (Number(originBorrowAmount) - Number(_expectedBorrowAmount)) / Number(originBorrowAmount) * 100 : 0, priceImpact: _priceImpact}
}

export const calculateNormalData = async (rawPairs: any, terraswapPairs: any, lcd: LCDClient, chain: string, swapAsset: AssetInfo | NativeInfo, swapAmount: string, percent: number | undefined, slippage: number, collateralAsset: AssetInfo | NativeInfo, borrowAsset: AssetInfo | NativeInfo, borrowAmount: string, collaterals: CollateralDetail[], borrowData: BorrowDetail) => {
    // get swap pool address
    const collateralLiquidities = _getSwapLiquidities(rawPairs, terraswapPairs, swapAsset, collateralAsset)
    const borrowLiquidities = _getSwapLiquidities(rawPairs, terraswapPairs, {native_token: {denom: UUSD}}, borrowAsset);
    const swapUstLiquidity = _getLiquidityAddr(rawPairs, swapAsset, {native_token: {denom: UUSD}});
    const borrowUstLiquidity = _getLiquidityAddr(rawPairs, borrowAsset, {native_token: {denom: UUSD}});
    const collateralUstLiquidity = _getLiquidityAddr(rawPairs, collateralAsset, {native_token: {denom: UUSD}})
    // get swap pool token amount
    const liquiditiesDataQuery = [];
    Object.values(collateralLiquidities).map(each => {
        if (each.direct) liquiditiesDataQuery.push(getPoolDetailQuery(lcd, each.direct[0].liquidity))
        if (each.ust) liquiditiesDataQuery.push(getPoolDetailQuery(lcd, each.ust[0].liquidity), getPoolDetailQuery(lcd, each.ust[1].liquidity))
        if (each.luna) liquiditiesDataQuery.push(getPoolDetailQuery(lcd, each.luna[0].liquidity), getPoolDetailQuery(lcd, each.luna[1].liquidity))
    })
    Object.values(borrowLiquidities).map(each => {
        if (each.direct) liquiditiesDataQuery.push(getPoolDetailQuery(lcd, each.direct[0].liquidity))
        if (each.ust) liquiditiesDataQuery.push(getPoolDetailQuery(lcd, each.ust[0].liquidity), getPoolDetailQuery(lcd, each.ust[1].liquidity))
        if (each.luna) liquiditiesDataQuery.push(getPoolDetailQuery(lcd, each.luna[0].liquidity), getPoolDetailQuery(lcd, each.luna[1].liquidity))
    })
    if (swapUstLiquidity) liquiditiesDataQuery.push(getPoolDetailQuery(lcd, swapUstLiquidity))
    if (borrowUstLiquidity) liquiditiesDataQuery.push(getPoolDetailQuery(lcd, borrowUstLiquidity))
    if (collateralUstLiquidity) liquiditiesDataQuery.push(getPoolDetailQuery(lcd, collateralUstLiquidity))
    liquiditiesDataQuery.push(getAstroportLunaBlunaConfigQuery(lcd, terraswapPairs))

    const liquiditiesData = await Promise.all(liquiditiesDataQuery);
    // combine address with token amount
    Object.values(collateralLiquidities).map(each => {
        if (each.direct) _addPoolAmount(each.direct[0], liquiditiesData.shift());
        if (each.ust) {
            _addPoolAmount(each.ust[0], liquiditiesData.shift());
            _addPoolAmount(each.ust[1], liquiditiesData.shift());
        }
        if (each.luna) {
            _addPoolAmount(each.luna[0], liquiditiesData.shift());
            _addPoolAmount(each.luna[1], liquiditiesData.shift());
        }
    })
    Object.values(borrowLiquidities).map(each => {
        if (each.direct) _addPoolAmount(each.direct[0], liquiditiesData.shift());
        if (each.ust) {
            _addPoolAmount(each.ust[0], liquiditiesData.shift());
            _addPoolAmount(each.ust[1], liquiditiesData.shift());
        }
        if (each.luna) {
            _addPoolAmount(each.luna[0], liquiditiesData.shift());
            _addPoolAmount(each.luna[1], liquiditiesData.shift());
        }
    })
    const swapUstLiquidityDetail = swapUstLiquidity ? liquiditiesData.shift() : undefined;
    const borrowUstLiquidityDetail = borrowUstLiquidity ? liquiditiesData.shift() : undefined;
    const collateralUstLiquidityDetail = collateralUstLiquidity ? liquiditiesData.shift() : undefined;
    const stableLunaBlunaAstroportPairConfig = liquiditiesData.shift();
    const amp = getAmpFromConfig(stableLunaBlunaAstroportPairConfig);

    const swapAssetPrice = swapUstLiquidityDetail ? getPrice(swapUstLiquidityDetail, swapAsset) : 1
    const borrowAssetPrice = borrowUstLiquidityDetail ? getPrice(borrowUstLiquidityDetail, borrowAsset) : 1
    // add swap limit to collateralLiquidities
    Object.keys(collateralLiquidities).map(key => calculateSwapLimit(key, collateralLiquidities[key], amp))

    let collateralAmount: string, swapError: any;
    // add swap amount to collateralLiquidities
    if (Number(swapAmount) > 0) {
        if (!isCoin(swapAsset) && !isCoin(collateralAsset) && contract_addrOfToken(swapAsset) === contract_addrOfToken(collateralAsset)) {
            collateralAmount = swapAmount;
        } else {
            const error = addSwapAmount(swapAmount, collateralLiquidities, amp);
            if (error) {
                swapError = {
                    type: 'overflow',
                    data: `${Number(error.totalSwapLimit) / Math.pow(10, getDecimals(chain, swapAsset))} ${getSymbol(chain, swapAsset)}`
                }
                return {
                    collateralLiquidities,
                    borrowLiquidities,
                    config: configReturnData(chain, collateralLiquidities, borrowLiquidities, swapAssetPrice, undefined, borrowAssetPrice, swapAmount, collateralAmount, borrowAmount, undefined, percent, swapAsset, collateralAsset, borrowAsset, undefined, undefined, swapError, undefined, amp)
                }
            }
            // calculate collateral amount
            collateralAmount = getSlippageReceiveAmount(collateralLiquidities, slippage)
        }
    } else {
        collateralAmount = '0'
    }

    // take away fee from collateral amount
    const fee = (Math.floor(Number(collateralAmount) * TREASURY_FEE / 100)).toFixed(0)
    collateralAmount = (Number(collateralAmount) - Number(fee)).toFixed(0)

    // anchor protocol collateral / ust rate
    const rate = await getRate(lcd, collateralAsset)

    // calculate collateral amount in ust
    const collateralAmountUst = (Math.floor(Number(collateralAmount) * rate)).toFixed(0)

    // get current Anchor protocol position
    let currentCollateralAmountUst = 0, borrowUst = 0
    if (collaterals) {
        collaterals.map(c => {
            currentCollateralAmountUst += Number(c.amountUST) * Math.pow(10, 6)
        })
    }
    if (borrowData) borrowUst = Number(borrowData.borrow_amount) * Math.pow(10, 6)

    //add swap limit to borrowLiquidities
    Object.keys(borrowLiquidities).map(key => calculateSwapLimitForBorrowLiquidities(key, borrowLiquidities[key], collateralLiquidities, amp))
    console.log(collateralLiquidities, borrowLiquidities)

    // calculate borrowAmountUst
    let borrowAmountUst: string, borrowError: any;
    if (Number(borrowAmount)) {
        if (isCoin(borrowAsset) && denomOfCoin(borrowAsset) === UUSD) {
            borrowAmountUst = borrowAmount;
            percent = Number(borrowAmountUst) / (Number(collateralAmountUst) * BORROWRATELIMIT) * 100
        } else {
            const error = addSwapAmountReverse(borrowAmount, borrowLiquidities, amp)
            if (error) borrowError = {
                type: 'overflow',
                data: `${Number(error.totalReceiveLimit) / Math.pow(10, getDecimals(chain, borrowAsset))} ${getSymbol(chain, borrowAsset)}`
            }
            return {
                collateralLiquidities,
                borrowLiquidities,
                config: configReturnData(chain, collateralLiquidities, borrowLiquidities, swapAssetPrice, rate, borrowAssetPrice, swapAmount, collateralAmount, borrowAmount, fee, percent, swapAsset, collateralAsset, borrowAsset, currentCollateralAmountUst, borrowUst, undefined, borrowError, amp)
            }
        }
    } else {
        borrowAmountUst = (Math.floor(((Number(collateralAmountUst) + Number(currentCollateralAmountUst)) * BORROWRATELIMIT) * Number(percent) / 100) - Number(borrowUst)).toFixed(0)
        if (isCoin(borrowAsset) && denomOfCoin(borrowAsset) === UUSD) {
            borrowAmount = borrowAmountUst
        } else {
            const error = addSwapAmount(borrowAmountUst, borrowLiquidities, amp)
            if (error) borrowError = {
                type: 'overflow',
                data: `${Number(error.totalSwapLimit) / Math.pow(10, 6)} UST`
            }
            return {
                collateralLiquidities,
                borrowLiquidities,
                config: configReturnData(chain, collateralLiquidities, borrowLiquidities, swapAssetPrice, rate, borrowAssetPrice, swapAmount, collateralAmount, borrowAmount, fee, percent, swapAsset, collateralAsset, borrowAsset, currentCollateralAmountUst, borrowUst, undefined, borrowError, amp)
            }
        }
    }
    return {
        collateralLiquidities,
        borrowLiquidities,
        config: configReturnData(chain, collateralLiquidities, borrowLiquidities, swapAssetPrice, rate, borrowAssetPrice, swapAmount, collateralAmount, borrowAmount, fee, percent, swapAsset, collateralAsset, borrowAsset, currentCollateralAmountUst, borrowUst, undefined, undefined, amp)
    }
}

export const getAmpFromConfig = (config: any) => {
    return JSON.parse(atob(config.params)).amp;
}

export const getAstroportLunaBlunaConfigQuery = (lcd: LCDClient, terraswapPairs: any) => {
    const astroportLunaBlunaPairAddr = Object.keys(terraswapPairs).filter((key: string) => {
        const each = terraswapPairs[key]
        if (each.dex === 'astroport' && each.assets.indexOf(ULUNA) !== -1 && each.assets.indexOf(bLUNA) !== -1) return true
        // if (each.type === 'stable') return true
        else return false
    })[0]
    return lcd.wasm.contractQuery(astroportLunaBlunaPairAddr, {"config":{}})
}

export const configReturnData = (chain: string, collateralLiquidities: any, borrowLiquidities: any, swapAssetPrice: number, collateralAssetPrice: number, borrowAssetPrice: number, swapAmount: string, collateralAmount: string, borrowAmount: string, treasuryFee: string, percent: number | undefined, swapAsset: AssetInfo | NativeInfo, collateralAsset: AssetInfo | NativeInfo, borrowAsset: AssetInfo | NativeInfo, currentCollateralAmountUst: number, borrowUst: number, swapError: any, borrowError: any, amp) => {
    const swapAmountUsd = (Math.floor(Number(swapAmount) * Number(swapAssetPrice)) / Math.pow(10, getDecimals(chain, swapAsset))).toFixed(6)
    if (swapError) return {
        swapAmount: (Number(swapAmount) / Math.pow(10, getDecimals(chain, swapAsset))).toFixed(6),
        swapAmountUsd: swapAmountUsd,
        collateralAmount: collateralAmount ? (Number(collateralAmount) / Math.pow(10, getDecimals(chain, collateralAsset))).toFixed(6) : '-',
        collateralAmountUsd: '-',
        borrowAmount: (Number(borrowAmount) / Math.pow(10, getDecimals(chain, borrowAsset))).toFixed(6) || '-',
        borrowAmountUsd: '-',
        percent: percent,
        collateralPriceImpact: undefined,
        borrowPriceImpact: undefined,
        swapError: swapError
    }
    const collateralAmountUsd = (Math.floor(Number(collateralAmount) * Number(collateralAssetPrice)) / Math.pow(10, getDecimals(chain, collateralAsset))).toFixed(6)
    let collateralPriceImpact: any = {
        loop: [],
        terraswap: [],
        astroport: []
    };
    let collateralPriceImpactExist = false;
    Object.keys(collateralLiquidities).map(key => {
        const protocolData = collateralLiquidities[key];
        if (protocolData.directSwapAmount) {
            if (key === 'astroport' && isLunaBLunaPair(collateralLiquidities[key].direct[0])) {
                const path = `${getSymbol(chain, swapAsset)}-${getSymbol(chain, collateralAsset)}`;
                const priceImpact = (Number(protocolData.directOriginReceiveAmount) - Number(protocolData.directReceiveAmount)) > 0 ? ((Number(protocolData.directOriginReceiveAmount) - Number(protocolData.directReceiveAmount)) / Number(protocolData.directOriginReceiveAmount) * 100).toFixed(2) : '0.00';
                collateralPriceImpact[key].push({path: path, impact: priceImpact})
                collateralPriceImpactExist = true;
            } else {
                const path = `${getSymbol(chain, swapAsset)}-${getSymbol(chain, collateralAsset)}`;
                const priceImpact = ((Number(protocolData.directOriginReceiveAmount) - Number(protocolData.directReceiveAmount)) / Number(protocolData.directOriginReceiveAmount) * 100).toFixed(2)
                collateralPriceImpact[key].push({path: path, impact: priceImpact})
                collateralPriceImpactExist = true;

            }
        }
        if (protocolData.lunaSwapAmount) {
            if (key === 'astroport' && isLunaBLunaPair(collateralLiquidities[key].luna[1])) {
                const path = `${getSymbol(chain, swapAsset)}-LUNA-${getSymbol(chain, collateralAsset)}`;
                const priceImpact = (Number(protocolData.lunaOriginReceiveAmount) - Number(protocolData.lunaReceiveAmount)) > 0 ? ((Number(protocolData.lunaOriginReceiveAmount) - Number(protocolData.lunaReceiveAmount)) / Number(protocolData.lunaOriginReceiveAmount) * 100).toFixed(2) : '0.00';
                collateralPriceImpact[key].push({path: path, impact: priceImpact})
                collateralPriceImpactExist = true;
            } else {
                const path = `${getSymbol(chain, swapAsset)}-LUNA-${getSymbol(chain, collateralAsset)}`;
                const priceImpact = ((Number(protocolData.lunaOriginReceiveAmount) - Number(protocolData.lunaReceiveAmount)) / Number(protocolData.lunaOriginReceiveAmount) * 100).toFixed(2)
                collateralPriceImpact[key].push({path: path, impact: priceImpact})
                collateralPriceImpactExist = true;

            }
        }
        if (protocolData.ustSwapAmount) {
            const path = `${getSymbol(chain, swapAsset)}-UST-${getSymbol(chain, collateralAsset)}`;
            const priceImpact = ((Number(protocolData.ustOriginReceiveAmount) - Number(protocolData.ustReceiveAmount)) / Number(protocolData.ustOriginReceiveAmount) * 100).toFixed(2)
            collateralPriceImpact[key].push({path: path, impact: priceImpact})
            collateralPriceImpactExist = true;
        }
    })
    if (!collateralPriceImpactExist) collateralPriceImpact = undefined
    if (borrowError) return {
        swapAmount: (Number(swapAmount) / Math.pow(10, getDecimals(chain, swapAsset))).toFixed(6),
        swapAmountUsd: swapAmountUsd,
        collateralAmount: (Number(collateralAmount) / Math.pow(10, getDecimals(chain, collateralAsset))).toFixed(6),
        collateralAmountUsd: collateralAmountUsd,
        borrowAmount: (Number(borrowAmount) / Math.pow(10, getDecimals(chain, borrowAsset))).toFixed(6) || '-',
        borrowAmountUsd: '-',
        percent: percent,
        collateralPriceImpact: collateralPriceImpact,
        borrowPriceImpact: undefined,
        borrowError: borrowError
    }
    borrowAmount = Number(borrowAmount) ? (Number(borrowAmount) / Math.pow(10, getDecimals(chain, borrowAsset))).toFixed(6) : ((Object.values(borrowLiquidities).reduce<number>((prev: number, current: any) => prev + Number(current.directReceiveAmount || 0) + Number(current.ustReceiveAmount || 0) + Number(current.lunaReceiveAmount || 0), 0)) / Math.pow(10, getDecimals(chain, borrowAsset))).toFixed(6)
    const borrowAmountUsd = (Number(borrowAmount) * Number(borrowAssetPrice)).toFixed(6)
    percent = percent ? percent : Number((((Object.values(borrowLiquidities).reduce<number>((prev: number, current: any) => prev + Number(current.directSwapAmount || 0) + Number(current.ustSwapAmount || 0) + Number(current.lunaSwapAmount || 0), 0)) + borrowUst) / (Math.floor(Number(collateralAmount) * Number(collateralAssetPrice)) + currentCollateralAmountUst) * 100).toFixed(2))
    let borrowPriceImpact: any = {
        loop: [],
        terraswap: [],
        astroport: []
    };
    let borrowPriceImpactExist = false;
    Object.keys(borrowLiquidities).map(key => {
        const protocolData = borrowLiquidities[key];
        if (protocolData.directSwapAmount) {
            const path = `UST-${getSymbol(chain, borrowAsset)}`;
            const originReceiveAmount = Math.floor((Number(protocolData.direct[0].amount2) * Number(protocolData.directSwapAmount)) / Number(protocolData.direct[0].amount1))
            const priceImpact = (Number(originReceiveAmount) - Number(protocolData.directReceiveAmount) > 0) ? ((Number(originReceiveAmount) - Number(protocolData.directReceiveAmount)) / Number(originReceiveAmount) * 100).toFixed(2) : '0.00'
            borrowPriceImpact[key].push({path: path, impact: priceImpact})
            borrowPriceImpactExist = true;
        }
        if (protocolData.lunaSwapAmount) {
            const path = `UST-LUNA-${getSymbol(chain, borrowAsset)}`;
            if (key === 'astroport' && isLunaBLunaPair(protocolData.luna[1])) {
                const originReceiveAmount = Math.floor((Number(protocolData.luna[0].amount2) * Number(protocolData.lunaSwapAmount)) / Number(protocolData.luna[0].amount1));
                const priceImpact = (Number(originReceiveAmount) - Number(protocolData.lunaReceiveAmount) > 0) ? ((Number(originReceiveAmount) - Number(protocolData.lunaReceiveAmount)) / Number(originReceiveAmount) * 100).toFixed(2) : '0.00'
                borrowPriceImpact[key].push({path: path, impact: priceImpact})
                borrowPriceImpactExist = true;
            } else {
                const originReceiveAmount = Math.floor((Number(protocolData.luna[0].amount2) * Number(protocolData.luna[1].amount2) * Number(protocolData.lunaSwapAmount)) / (Number(protocolData.luna[0].amount1) * Number(protocolData.luna[1].amount1)));
                const priceImpact = (Number(originReceiveAmount) - Number(protocolData.lunaReceiveAmount) > 0) ? ((Number(originReceiveAmount) - Number(protocolData.lunaReceiveAmount)) / Number(originReceiveAmount) * 100).toFixed(2) : '0.00'
                borrowPriceImpact[key].push({path: path, impact: priceImpact})
                borrowPriceImpactExist = true;
            }
        }
    })
    if (!borrowPriceImpactExist) borrowPriceImpact = undefined;
    return {
        swapAmount: (Number(swapAmount) / Math.pow(10, getDecimals(chain, swapAsset))).toFixed(6),
        swapAmountUsd: swapAmountUsd,
        collateralAmount: (Number(collateralAmount) / Math.pow(10, getDecimals(chain, collateralAsset))).toFixed(6),
        collateralAmountUsd: collateralAmountUsd,
        borrowAmount: borrowAmount,
        treasuryFee,
        borrowAmountUsd: borrowAmountUsd,
        percent: percent,
        collateralPriceImpact: collateralPriceImpact,
        borrowPriceImpact: borrowPriceImpact
    }
}

export const getPrice = (liquidityData, asset) => {
    const assetAddr = isCoin(asset) ? denomOfCoin(asset) : contract_addrOfToken(asset)
    const liquidityDataAsset1Address = isCoin(liquidityData.assets[0].info) ? denomOfCoin(liquidityData.assets[0].info) : contract_addrOfToken(liquidityData.assets[0].info)
    const liquidityDataAsset2Address = isCoin(liquidityData.assets[1].info) ? denomOfCoin(liquidityData.assets[1].info) : contract_addrOfToken(liquidityData.assets[1].info)
    if (assetAddr === liquidityDataAsset1Address) return Number(liquidityData.assets[1].amount) / Number(liquidityData.assets[0].amount)
    if (assetAddr === liquidityDataAsset2Address) return Number(liquidityData.assets[2].amount) / Number(liquidityData.assets[1].amount)
    else return undefined
}

export const getRate = async (lcd, collateralAsset) => {
    if (lcd?.config?.chainID === chainID.main) {
        const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
        await lcd.wasm.contractQuery(ORACLE, {'price': {'base': contract_addrOfToken(collateralAsset), 'quote': 'uusd'}})
        return Number(rateResponse.rate)
      } else {
        const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
        await lcd.wasm.contractQuery(test_ORACLE, {'price': {'base': test_bLUNA, 'quote': 'uusd'}})
        return Number(rateResponse.rate)
      }
}

export const getSlippageReceiveAmount = (liquidities, slippage) => {
    let slippageReceiveAmount = 0;
    Object.values(liquidities).map((eachProtocol: any) => {
        if (eachProtocol.directOriginReceiveAmount) slippageReceiveAmount += Math.floor(Number(eachProtocol.directOriginReceiveAmount) * (100 - slippage) / 100)
        if (eachProtocol.ustOriginReceiveAmount) slippageReceiveAmount += Math.floor(Number(eachProtocol.ustOriginReceiveAmount) * (100 - slippage) / 100)
        if (eachProtocol.lunaOriginReceiveAmount) slippageReceiveAmount += Math.floor(Number(eachProtocol.lunaOriginReceiveAmount) * (100 - slippage) / 100)
    })
    return slippageReceiveAmount.toFixed(0)
}

export const calculateSwapLimitForBorrowLiquidities = (key, liquidities, collateralLiquidities, amp) => {
    if (liquidities.direct) {
        Object.values(collateralLiquidities).map((each: any) => {
            if (each.direct && each.directSwapAmount && each.direct[0].liquidity === liquidities.direct[0].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.direct[0], each.direct[0], each.directSwapAmount)
            }
            if (each.ust && each.ustSwapAmount && each.ust[0].liquidity === liquidities.direct[0].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.direct[0], each.ust[0], each.ustSwapAmount)
            }
            if (each.ust && each.ustSwapAmount && each.ust[1].liquidity === liquidities.direct[0].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.direct[0], each.ust[1], each.ustSwapAmount)
            }
            if (each.luna && each.lunaSwapAmount && each.luna[0].liquidity === liquidities.direct[0].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.direct[0], each.luna[0], each.lunaSwapAmount)
            }
            if (each.luna && each.lunaSwapAmount && each.luna[1].liquidity === liquidities.direct[0].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.direct[0], each.luna[1], each.lunaSwapAmount)
            }
        })
        if (key === "astroport" && isLunaBLunaPair(liquidities.direct[0])) {
            liquidities.directSwapLimit = calculateStableBlunaSwapLimit(liquidities.direct[0], amp, PRICEIMPACTMAX)
        } else {
            const a = liquidities.direct[0].amount1;
            const a1 = liquidities.direct[0].changedAmount1 ? liquidities.direct[0].changedAmount1 : liquidities.direct[0].amount1;
            const b = liquidities.direct[0].amount2;
            const b1 = liquidities.direct[0].changedAmount2 ? liquidities.direct[0].changedAmount2 : liquidities.direct[0].amount2;
            const maxAmount = Math.floor((a * b1 * (100 - SWAP_FEE) - a1 * b * (100 - PRICEIMPACTMAX)) / (b * (100 - PRICEIMPACTMAX)))
            liquidities.directSwapLimit = maxAmount
        }
    }
    if (liquidities.ust) {
        Object.values(collateralLiquidities).map((each: any) => {
            if (each.direct && each.directSwapAmount && each.direct[0].liquidity === liquidities.ust[0].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.ust[0], each.direct[0], each.directSwapAmount)
            }
            if (each.direct && each.directSwapAmount && each.direct[0].liquidity === liquidities.ust[1].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.ust[1], each.direct[0], each.directSwapAmount)
            }
            if (each.ust && each.ustSwapAmount && each.ust[0].liquidity === liquidities.ust[0].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.ust[0], each.ust[0], each.ustSwapAmount)
            }
            if (each.ust && each.ustSwapAmount && each.ust[1].liquidity === liquidities.ust[1].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.ust[1], each.ust[1], each.ustSwapAmount)
            }
        })
        if (!liquidities.ust[0].changedAmount1 && !liquidities.ust[1].changedAmount1) {
            const maxAmount = computeExpectSwapLimit(Number(liquidities.ust[0].amount1), Number(liquidities.ust[0].amount2), Number(liquidities.ust[1].amount1), Number(liquidities.ust[1].amount2), Number(liquidities.ust[0].amount1), Number(liquidities.ust[0].amount2), Number(liquidities.ust[1].amount1), Number(liquidities.ust[1].amount2), PRICEIMPACTMAX, SWAP_FEE)
            liquidities.ustSwapLimit = maxAmount
        } else if (liquidities.ust[0].changedAmount1 && !liquidities.ust[1].changedAmount1) {
            const maxAmount = computeExpectSwapLimit(Number(liquidities.ust[0].amount1), Number(liquidities.ust[0].amount2), Number(liquidities.ust[1].amount1), Number(liquidities.ust[1].amount2), Number(liquidities.ust[0].changedAmount1), Number(liquidities.ust[0].changedAmount2), Number(liquidities.ust[1].amount1), Number(liquidities.ust[1].amount2), PRICEIMPACTMAX, SWAP_FEE)
            liquidities.ustSwapLimit = maxAmount
        } else if (!liquidities.ust[0].changedAmount1 && liquidities.ust[1].changedAmount1) {
            const maxAmount = computeExpectSwapLimit(Number(liquidities.ust[0].amount1), Number(liquidities.ust[0].amount2), Number(liquidities.ust[1].amount1), Number(liquidities.ust[1].amount2), Number(liquidities.ust[0].amount1), Number(liquidities.ust[0].amount2), Number(liquidities.ust[1].changedAmount1), Number(liquidities.ust[1].changedAmount2), PRICEIMPACTMAX, SWAP_FEE)
            liquidities.ustSwapLimit = maxAmount
        } else {
            const maxAmount = computeExpectSwapLimit(Number(liquidities.ust[0].amount1), Number(liquidities.ust[0].amount2), Number(liquidities.ust[1].amount1), Number(liquidities.ust[1].amount2), Number(liquidities.ust[0].changedAmount1), Number(liquidities.ust[0].changedAmount2), Number(liquidities.ust[1].changedAmount1), Number(liquidities.ust[1].changedAmount2), PRICEIMPACTMAX, SWAP_FEE)
            liquidities.ustSwapLimit = maxAmount
        }
    }
    if (liquidities.luna) {
        Object.values(collateralLiquidities).map((each: any) => {
            if (each.direct && each.directSwapAmount && each.direct[0].liquidity === liquidities.luna[0].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.luna[0], each.direct[0], each.directSwapAmount)
            }
            if (each.direct && each.directSwapAmount && each.direct[0].liquidity === liquidities.luna[1].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.luna[1], each.direct[0], each.directSwapAmount)
            }
            if (each.luna && each.lunaSwapAmount && each.luna[0].liquidity === liquidities.luna[0].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.luna[0], each.luna[0], each.lunaSwapAmount)
            }
            if (each.luna && each.lunaSwapAmount && each.luna[1].liquidity === liquidities.luna[1].liquidity) {
                considerChangedAmountForEachBorrowLiquidity(liquidities.luna[1], each.luna[1], each.lunaSwapAmount)
            }
        })
        if (!liquidities.luna[0].changedAmount1 && !liquidities.luna[1].changedAmount1) {
            if (key === "astroport" && isLunaBLunaPair(liquidities.luna[1])) {
                liquidities.lunaSwapLimit = calculateCombinedLunaSwapLimit(liquidities.luna, amp)
            } else {
                const maxAmount = computeExpectSwapLimit(Number(liquidities.luna[0].amount1), Number(liquidities.luna[0].amount2), Number(liquidities.luna[1].amount1), Number(liquidities.luna[1].amount2), Number(liquidities.luna[0].amount1), Number(liquidities.luna[0].amount2), Number(liquidities.luna[1].amount1), Number(liquidities.luna[1].amount2), PRICEIMPACTMAX, SWAP_FEE)
                liquidities.lunaSwapLimit = maxAmount
            }
        } else if (liquidities.luna[0].changedAmount1 && !liquidities.luna[1].changedAmount1) {
            if (key === "astroport" && isLunaBLunaPair(liquidities.luna[1])) {
                liquidities.lunaSwapLimit = calculateCombinedLunaSwapLimit(liquidities.luna, amp)
            } else {
                const maxAmount = computeExpectSwapLimit(Number(liquidities.luna[0].amount1), Number(liquidities.luna[0].amount2), Number(liquidities.luna[1].amount1), Number(liquidities.luna[1].amount2), Number(liquidities.luna[0].changedAmount1), Number(liquidities.luna[0].changedAmount2), Number(liquidities.luna[1].amount1), Number(liquidities.luna[1].amount2), PRICEIMPACTMAX, SWAP_FEE)
                liquidities.lunaSwapLimit = maxAmount
            }
        } else if (!liquidities.luna[0].changedAmount1 && liquidities.luna[1].changedAmount1) {
            if (key === "astroport" && isLunaBLunaPair(liquidities.luna[1])) {
                liquidities.lunaSwapLimit = calculateCombinedLunaSwapLimit(liquidities.luna, amp)
            } else {
                const maxAmount = computeExpectSwapLimit(Number(liquidities.luna[0].amount1), Number(liquidities.luna[0].amount2), Number(liquidities.luna[1].amount1), Number(liquidities.luna[1].amount2), Number(liquidities.luna[0].amount1), Number(liquidities.luna[0].amount2), Number(liquidities.luna[1].changedAmount1), Number(liquidities.luna[1].changedAmount2), PRICEIMPACTMAX, SWAP_FEE)
                liquidities.lunaSwapLimit = maxAmount
            }
        } else {
            if (key === "astroport" && isLunaBLunaPair(liquidities.luna[1])) {
                liquidities.lunaSwapLimit = calculateCombinedLunaSwapLimit(liquidities.luna, amp)
            } else {
                const maxAmount = computeExpectSwapLimit(Number(liquidities.luna[0].amount1), Number(liquidities.luna[0].amount2), Number(liquidities.luna[1].amount1), Number(liquidities.luna[1].amount2), Number(liquidities.luna[0].changedAmount1), Number(liquidities.luna[0].changedAmount2), Number(liquidities.luna[1].changedAmount1), Number(liquidities.luna[1].changedAmount2), PRICEIMPACTMAX, SWAP_FEE)
                liquidities.lunaSwapLimit = maxAmount
            }
        }
    }
}

export const computeExpectSwapLimit = (a, b, c, d, a1, b1, c1, d1, limit, fee) => {
    // 100 - fee
    const reverse_fee = 100 - fee;
    // 100 - limit
    const reverse_limit = 100 - limit;
    // d1 * b1 * (100 - fee) ^ 2 - d * b / (a * c) * (100 - limit) * 100 * c1 * a1
    const numerator = d1 * b1 * Math.pow(reverse_fee, 2) - (d * b * reverse_limit * 100 * c1 * a1) / (a * c);
    if (numerator < 0) return 0
    // (100 * c1 + b1 * (100 - fee)) * d * b * (100 - limit) / (a * c)
    const denominator = ((100 * c1 + reverse_fee * b1) * b * d * reverse_limit) / (a * c)
    return Math.floor(numerator / denominator)
}

export const considerChangedAmountForEachBorrowLiquidity = (liquidity, collateralLiquidity, swapAmount) => {
    const asset1Addr = isCoin(liquidity.asset1) ? denomOfCoin(liquidity.asset1) : contract_addrOfToken(liquidity.asset1)
    const asset1AddrOfEach = isCoin(collateralLiquidity.asset1) ? denomOfCoin(collateralLiquidity.asset1) : contract_addrOfToken(collateralLiquidity.asset1)
    if (asset1Addr === asset1AddrOfEach) {
        liquidity.changedAmount1 = Number(collateralLiquidity.amount1) + Number(swapAmount);
        liquidity.changedAmount2 = Number(collateralLiquidity.amount2) - Math.floor(Number(collateralLiquidity.amount2) / Number(collateralLiquidity.amount1) * Number(swapAmount))
    } else {
        liquidity.changedAmount1 = Number(collateralLiquidity.amount2) + Number(swapAmount);
        liquidity.changedAmount2 = Number(collateralLiquidity.amount1) - Math.floor(Number(collateralLiquidity.amount1) / Number(collateralLiquidity.amount2) * Number(swapAmount))
    }
}

export const addSwapAmountReverse = (receiveAmount, liquidities, amp) => {
    let totalReceiveLimit = 0;
    for (let i = 0; i < Object.keys(liquidities).length; i++) {
        const key = Object.keys(liquidities)[i];
        const eachProtocolLiquidities: any = liquidities[key];
        if (eachProtocolLiquidities.directSwapLimit) {
            let originAmount1 = eachProtocolLiquidities.direct[0].amount1
            let originAmount2 = eachProtocolLiquidities.direct[0].amount2
            let amount1 = eachProtocolLiquidities.direct[0].changedAmount1 ? eachProtocolLiquidities.direct[0].changedAmount1 : eachProtocolLiquidities.direct[0].amount1
            let amount2 = eachProtocolLiquidities.direct[0].changedAmount2 ? eachProtocolLiquidities.direct[0].changedAmount2 : eachProtocolLiquidities.direct[0].amount2
            if (key === 'astroport' && isLunaBLunaPair(eachProtocolLiquidities.direct[0])) {
                const commission_rate = STABLE_SWAP_FEE / 100;
                const result = computeStableBLuna(amount1, amount2, eachProtocolLiquidities.directSwapLimit, commission_rate, amp);
                const receiveAmountMax = result.return_amount;
                if (Number(receiveAmount) <= Number(receiveAmountMax)) {
                    const result = computeStableBLunaReverse(amount1, amount2, receiveAmount, commission_rate, amp);
                    eachProtocolLiquidities.directSwapAmount = result.offer_amount;
                    eachProtocolLiquidities.directReceiveAmount = Number(receiveAmount);
                    eachProtocolLiquidities.directOriginReceiveAmount = result.offer_amount;
                    return;
                } else {
                    eachProtocolLiquidities.directSwapAmount = Number(eachProtocolLiquidities.directSwapLimit);
                    receiveAmount = Number(receiveAmount) - Number(receiveAmountMax);
                    totalReceiveLimit += Number(receiveAmountMax);
                    eachProtocolLiquidities.directReceiveAmount = Number(receiveAmountMax);
                    eachProtocolLiquidities.directOriginReceiveAmount = Number(eachProtocolLiquidities.directSwapLimit);
                }
            } else {
                const receiveAmountMax = Math.floor(Number(amount2) * Number(eachProtocolLiquidities.directSwapLimit) / (Number(amount1) + Number(eachProtocolLiquidities.directSwapLimit)) * (100 - SWAP_FEE) / 100)
                if (Number(receiveAmount) <= Number(receiveAmountMax)) {
                    eachProtocolLiquidities.directSwapAmount = Math.floor((Number(amount1) * Number(receiveAmount) * 100) / (Number(amount2) * (100 - SWAP_FEE) - 100 * Number(receiveAmount)))
                    eachProtocolLiquidities.directReceiveAmount = Number(receiveAmount)
                    eachProtocolLiquidities.directOriginReceiveAmount = Math.floor(Number(originAmount2) * Number(eachProtocolLiquidities.directSwapAmount) / Number(originAmount1))
                    return;
                } else {
                    eachProtocolLiquidities.directSwapAmount = Number(eachProtocolLiquidities.directSwapLimit);
                    receiveAmount = Number(receiveAmount) - Number(receiveAmountMax);
                    totalReceiveLimit += Number(receiveAmountMax);
                    eachProtocolLiquidities.directReceiveAmount = Math.floor(Number(amount2) * Number(eachProtocolLiquidities.directSwapLimit) / (Number(amount1) + Number(eachProtocolLiquidities.directSwapLimit)) * (100 - SWAP_FEE) / 100)
                    eachProtocolLiquidities.directOriginReceiveAmount = Math.floor(Number(amount2) * Number(eachProtocolLiquidities.directSwapLimit) / Number(amount1))
                }
            }
            eachProtocolLiquidities.directPriceImpact = (eachProtocolLiquidities.directSwapAmount - eachProtocolLiquidities.directReceiveAmount) / eachProtocolLiquidities.directSwapAmount;
        }
        if (eachProtocolLiquidities.lunaSwapLimit) {
            let originAmount1_1 = eachProtocolLiquidities.luna[0].amount1
            let originAmount1_2 = eachProtocolLiquidities.luna[0].amount2
            let originAmount2_1 = eachProtocolLiquidities.luna[1].amount1
            let originAmount2_2 = eachProtocolLiquidities.luna[1].amount2
            let amount1_1 = eachProtocolLiquidities.luna[0].changedAmount1 ? eachProtocolLiquidities.luna[0].changedAmount1 : eachProtocolLiquidities.luna[0].amount1
            let amount1_2 = eachProtocolLiquidities.luna[0].changedAmount2 ? eachProtocolLiquidities.luna[0].changedAmount2 : eachProtocolLiquidities.luna[0].amount2
            let amount2_1 = eachProtocolLiquidities.luna[1].changedAmount1 ? eachProtocolLiquidities.luna[1].changedAmount1 : eachProtocolLiquidities.luna[1].amount1
            let amount2_2 = eachProtocolLiquidities.luna[1].changedAmount2 ? eachProtocolLiquidities.luna[1].changedAmount2 : eachProtocolLiquidities.luna[1].amount2
            let receiveAmount1: number, originReceiveAmount1: number, originReceiveAmount2: number;
            if (key === 'astroport' && isLunaBLunaPair(eachProtocolLiquidities.luna[1])) {
                const commission_rate = STABLE_SWAP_FEE / 100;
                let receiveAmountMax = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.lunaSwapLimit) / (Number(amount1_1) + Number(eachProtocolLiquidities.lunaSwapLimit)) * (100 - SWAP_FEE) / 100)
                const result = computeStableBLuna(amount2_1, amount2_2, receiveAmountMax.toFixed(0), commission_rate, amp);
                receiveAmountMax = result.return_amount;
                if (Number(receiveAmount) <= receiveAmountMax) {
                    const result = computeStableBLunaReverse(amount2_1, amount2_2, receiveAmount, commission_rate, amp);
                    receiveAmount1 = result.offer_amount;
                    eachProtocolLiquidities.lunaSwapAmount = Math.floor(Number(amount1_1) * Number(receiveAmount1) * 100 / (Number(amount1_2) * (100 - SWAP_FEE) - 100 * Number(receiveAmount1)));
                    originReceiveAmount1 = Math.floor(Number(originAmount1_2) * eachProtocolLiquidities.lunaSwapAmount / Number(originAmount1_1));
                    eachProtocolLiquidities.lunaReceiveAmount = Number(receiveAmount)
                    eachProtocolLiquidities.lunaOriginReceiveAmount = Math.floor(Number(originAmount1_2) * Number(eachProtocolLiquidities.lunaSwapAmount) / Number(originAmount1_1));
                    eachProtocolLiquidities.lunaPriceImpact2 = (receiveAmount1 - receiveAmount) / receiveAmount1
                    eachProtocolLiquidities.lunaPriceImpact1 = (originReceiveAmount1 - receiveAmount1) / originReceiveAmount1;
                    return;
                } else {
                    eachProtocolLiquidities.lunaSwapAmount = Number(eachProtocolLiquidities.lunaSwapLimit);
                    receiveAmount1 = Math.floor(Number(amount1_1) * eachProtocolLiquidities.lunaSwapAmount / (Number(amount1_2) + eachProtocolLiquidities.lunaSwapAmount) * (100 - SWAP_FEE) / 100);
                    originReceiveAmount1 = Math.floor(Number(originAmount1_1) * eachProtocolLiquidities.lunaSwapAmount / Number(originAmount1_2));
                    receiveAmount = Number(receiveAmount) - Number(receiveAmountMax);
                    totalReceiveLimit += Number(receiveAmountMax);
                    eachProtocolLiquidities.lunaReceiveAmount = receiveAmountMax;
                    eachProtocolLiquidities.lunaOriginReceiveAmount = Math.floor(Number(originAmount1_2) * Number(eachProtocolLiquidities.lunaSwapLimit) / Number(originAmount1_1))
                    eachProtocolLiquidities.lunaPriceImpact2 = (receiveAmount1 - receiveAmountMax) / receiveAmount1
                }
                eachProtocolLiquidities.lunaPriceImpact1 = (originReceiveAmount1 - receiveAmount1) / originReceiveAmount1;
            } else {
                let receiveAmountMax = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.lunaSwapLimit) / (Number(amount1_1) + Number(eachProtocolLiquidities.lunaSwapLimit)) * (100 - SWAP_FEE) / 100)
                receiveAmountMax = Math.floor(Number(amount2_2) * Number(receiveAmountMax) / (Number(amount2_1) + Number(receiveAmountMax)) * (100 - SWAP_FEE) / 100)
                if (Number(receiveAmount) <= receiveAmountMax) {
                    receiveAmount1 = Math.floor(Number(amount2_1) * Number(receiveAmount) / (Number(amount2_2) * (100 - SWAP_FEE) / 100 - Number(receiveAmount)));
                    originReceiveAmount2 = Math.floor(Number(originAmount2_2) * Number(receiveAmount1) / Number(originAmount2_1))
                    eachProtocolLiquidities.lunaSwapAmount = Math.floor(Number(amount1_1) * Number(receiveAmount1) / (Number(amount1_2) * (100 - SWAP_FEE) / 100 - Number(receiveAmount1)));
                    originReceiveAmount1 = Math.floor(Number(originAmount1_2) * Number(eachProtocolLiquidities.lunaSwapAmount) / Number(originAmount1_1))
                    eachProtocolLiquidities.lunaReceiveAmount = Number(receiveAmount)
                    eachProtocolLiquidities.lunaOriginReceiveAmount = Math.floor(Number(originAmount1_2) * Number(originAmount2_2)  *Number(eachProtocolLiquidities.lunaSwapAmount) / Number(originAmount1_1) / Number(originAmount2_1))
                    eachProtocolLiquidities.lunaPriceImpact1 = (originReceiveAmount1 - receiveAmount1) / originReceiveAmount1;
                    eachProtocolLiquidities.lunaPriceImpact2 = (originReceiveAmount2 - eachProtocolLiquidities.lunaReceiveAmount) / originReceiveAmount2;
                    return;
                } else {
                    eachProtocolLiquidities.lunaSwapAmount = Number(eachProtocolLiquidities.lunaSwapLimit);
                    receiveAmount1 = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.lunaSwapAmount) / (Number(amount1_1) + Number(eachProtocolLiquidities.lunaSwapAmount)) * (100 - SWAP_FEE) / 100)
                    originReceiveAmount1 = Math.floor(Number(originAmount1_2) * Number(eachProtocolLiquidities.lunaSwapLimit) / Number(originAmount1_1))
                    originReceiveAmount2 = Math.floor(Number(originAmount2_2) * Number(receiveAmount1) / Number(originAmount2_1))
                    receiveAmount = Number(receiveAmount) - Number(receiveAmountMax);
                    totalReceiveLimit += Number(receiveAmountMax);
                    eachProtocolLiquidities.lunaReceiveAmount = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.lunaSwapLimit) / (Number(amount1_1) + Number(eachProtocolLiquidities.lunaSwapLimit)) * (100 - SWAP_FEE) / 100)
                    eachProtocolLiquidities.lunaReceiveAmount = Math.floor(Number(amount2_2) * Number(eachProtocolLiquidities.lunaReceiveAmount) / (Number(amount2_1) + Number(eachProtocolLiquidities.lunaReceiveAmount)) * (100 - SWAP_FEE) / 100)
                    eachProtocolLiquidities.lunaOriginReceiveAmount = Math.floor(Number(originAmount1_2) * Number(originAmount2_2)  *Number(eachProtocolLiquidities.lunaSwapLimit) / Number(originAmount1_1) / Number(originAmount2_1))
                }
                eachProtocolLiquidities.lunaPriceImpact1 = (originReceiveAmount1 - receiveAmount1) / originReceiveAmount1;
                eachProtocolLiquidities.lunaPriceImpact2 = (originReceiveAmount2 - eachProtocolLiquidities.lunaReceiveAmount) / originReceiveAmount2;
            }
        }
        if (eachProtocolLiquidities.ustSwapLimit) {
            let originAmount1_1 = eachProtocolLiquidities.ust[0].amount1
            let originAmount1_2 = eachProtocolLiquidities.ust[0].amount2
            let originAmount2_1 = eachProtocolLiquidities.ust[1].amount1
            let originAmount2_2 = eachProtocolLiquidities.ust[1].amount2
            let amount1_1 = eachProtocolLiquidities.ust[0].changedAmount1 ? eachProtocolLiquidities.ust[0].changedAmount1 : eachProtocolLiquidities.ust[0].amount1
            let amount1_2 = eachProtocolLiquidities.ust[0].changedAmount2 ? eachProtocolLiquidities.ust[0].changedAmount2 : eachProtocolLiquidities.ust[0].amount2
            let amount2_1 = eachProtocolLiquidities.ust[1].changedAmount1 ? eachProtocolLiquidities.ust[1].changedAmount1 : eachProtocolLiquidities.ust[1].amount1
            let amount2_2 = eachProtocolLiquidities.ust[1].changedAmount2 ? eachProtocolLiquidities.ust[1].changedAmount2 : eachProtocolLiquidities.ust[1].amount2
            let receiveAmountMax = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.ustSwapLimit) / (Number(amount1_1) + Number(eachProtocolLiquidities.ustSwapLimit)) * (100 - SWAP_FEE) / 100)
            receiveAmountMax = Math.floor(Number(amount2_2) * Number(receiveAmountMax) / (Number(amount2_1) + Number(eachProtocolLiquidities.receiveAmountMax)) * (100 - SWAP_FEE) / 100)
            let receiveAmount1: number, originReceiveAmount1: number, originReceiveAmount2: number;
            if (Number(receiveAmount) <= receiveAmountMax) {
                receiveAmount1 = Math.floor(Number(amount2_1) * Number(receiveAmount) / (Number(amount2_2) * (100 - SWAP_FEE) / 100 - Number(receiveAmount)));
                originReceiveAmount2 = Math.floor(Number(originAmount2_2) * Number(receiveAmount1) / Number(originAmount2_1));
                eachProtocolLiquidities.ustSwapAmount = Math.floor(Number(amount1_1) * Number(receiveAmount1) / (Number(amount1_2) * (100 - SWAP_FEE) / 100 - Number(receiveAmount1)));
                originReceiveAmount1 = Math.floor(Number(originAmount1_2) * Number(eachProtocolLiquidities.ustSwapAmount) / Number(originAmount1_1));
                eachProtocolLiquidities.ustReceiveAmount = Number(receiveAmount)
                eachProtocolLiquidities.ustOriginReceiveAmount = Math.floor(Number(originAmount1_2) * Number(originAmount2_2)  *Number(eachProtocolLiquidities.ustSwapAmount) / Number(originAmount1_1) / Number(originAmount2_1))
                eachProtocolLiquidities.ustPriceImpact1 = (originReceiveAmount1 - receiveAmount1) / originReceiveAmount1
                eachProtocolLiquidities.ustPriceImpact2 = (originReceiveAmount2 - eachProtocolLiquidities.ustReceiveAmount) / originReceiveAmount2
                return;
            } else {
                eachProtocolLiquidities.ustSwapAmount = Number(eachProtocolLiquidities.ustSwapLimit);
                originReceiveAmount1 = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.ustSwapLimit) / Number(amount1_1))
                receiveAmount1 = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.ustSwapLimit) / (Number(amount1_1) + Number(eachProtocolLiquidities.ustSwapLimit)) * (100 - SWAP_FEE) / 100)
                originReceiveAmount1 = Math.floor(Number(originAmount1_2) * Number(eachProtocolLiquidities.ustSwapLimit) / Number(originAmount1_1))
                originReceiveAmount2 = Math.floor(Number(originAmount2_2) * Number(receiveAmount1) / Number(originAmount2_1));
                receiveAmount = Number(receiveAmount) - Number(receiveAmountMax);
                totalReceiveLimit += Number(receiveAmountMax);
                eachProtocolLiquidities.ustReceiveAmount = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.ustSwapLimit) / (Number(amount1_1) + Number(eachProtocolLiquidities.ustSwapLimit)) * (100 - SWAP_FEE) / 100)
                eachProtocolLiquidities.ustReceiveAmount = Math.floor(Number(amount2_2) * Number(eachProtocolLiquidities.ustReceiveAmount) / (Number(amount2_1) + Number(eachProtocolLiquidities.ustReceiveAmount)) * (100 - SWAP_FEE) / 100)
                eachProtocolLiquidities.ustOriginReceiveAmount = Math.floor(Number(originAmount1_2) * Number(originAmount2_2)  *Number(eachProtocolLiquidities.ustSwapLimit) / Number(originAmount1_1) / Number(originAmount2_1))
            }
            eachProtocolLiquidities.ustPriceImpact1 = (originReceiveAmount1 - receiveAmount1) / originReceiveAmount1
            eachProtocolLiquidities.ustPriceImpact2 = (originReceiveAmount2 - eachProtocolLiquidities.ustReceiveAmount) / originReceiveAmount2
        }
    }
    if (Number(receiveAmount) > 0) return {totalReceiveLimit}
}

export const calculateStep = (initial_d: number, leverage: number, sum_x: number, d_product: number) => {
    let leverage_mul = leverage * sum_x / AMP_PRECISION;
    let d_p_mul = d_product * N_COINS;

    let l_val = (leverage_mul + d_p_mul) * initial_d;

    let leverage_sub = initial_d * (leverage - AMP_PRECISION) / AMP_PRECISION;
    let n_coins_sum = d_product * (N_COINS + 1);

    let r_val = leverage_sub + n_coins_sum;

    return l_val / r_val
}

export const compute_new_balance = (leverage: number, new_source_amount: number, d_val: number) => {

    // sum' = prod' = x
    // c =  D ** (n + 1) / (n ** (2 * n) * prod' * A)
    let c = Math.pow(d_val, N_COINS + 1) * AMP_PRECISION / (new_source_amount * N_COINS_SQUARED * leverage);

    // b = sum' - (A*n**n - 1) * D / (A * n**n)
    let b = new_source_amount + d_val * AMP_PRECISION / leverage;

    // Solve for y by approximating: y**2 + b*y = c
    let y_prev: number;
    let y = d_val;
    for (let i = 0; i < ITERATIONS; i++) {
        y_prev = y;
        y = (Math.pow(y, 2) + c) / (y * 2 + b - d_val);
        if (y === y_prev) {
            break;
        }

    }
    return Math.floor(y);
}

export const computeD = (leverage: number, amount_a: string, amount_b: string) => {
    let amount_a_times_coins = Number(amount_a) * N_COINS + 1;
    let amount_b_times_coins = Number(amount_b) * N_COINS + 1;
    let sum_x = Number(amount_a) + Number(amount_b);
    if (sum_x === 0) return 0;
    else {
        let d_previous: number;
        let d = sum_x;
        for (let i = 0; i < ITERATIONS; i++) {
            let d_product = d;
            d_product = d_product * d / amount_a_times_coins;
            d_product = d_product * d / amount_b_times_coins;
            d_previous = d;
            d = calculateStep(d, leverage, sum_x, d_product);
            if (d === d_previous) break;
        }
        return d;
    }
}

export const calcAskAmount = (offer_pool: string, ask_pool: string, offer_amount: string, amp: string) => {
    let leverage = Number(amp) * N_COINS
    let new_offer_pool = Number(offer_pool) + Number(offer_amount)
    let d = computeD(leverage, offer_pool, ask_pool)

    let new_ask_pool = compute_new_balance(leverage, new_offer_pool, d);
    
    let amount_swapped = Number(ask_pool) - new_ask_pool;
    return Math.floor(amount_swapped);
}

export const calcOfferAmount = (offer_pool: string, ask_pool: string, ask_amount: number, amp: string) => {
    let leverage = Number(amp) * N_COINS;
    let new_ask_pool = Number(ask_pool) - ask_amount;

    let d = computeD(leverage, offer_pool, ask_pool);

    let new_offer_pool = compute_new_balance(leverage, new_ask_pool, d);

    let amount_swapped = new_offer_pool - Number(offer_pool);
    return Math.floor(amount_swapped);
}

export const calculateStableBlunaSwapLimit = (liquidity: any, current_amp: string, price_impact: number) => {
    const offer_pool_amount = liquidity.changedAmount1 ? liquidity.changedAmount1 : liquidity.amount1;
    const ask_pool_amount = liquidity.changedAmount2 ? liquidity.changedAmount2 : liquidity.amount2;
    let offer_amount = Math.round(Number(offer_pool_amount) / 2);
    let diff_offer_amount = Math.round(Number(offer_pool_amount) / 10);
    const commission_rate = STABLE_SWAP_FEE / 100
    let return_amount: number, spread_amount: number, commission_amount: number;
    let position = 0, i = 0;
    while (1) {
        i++;
        const response = computeStableBLuna(offer_pool_amount, ask_pool_amount, offer_amount.toString(), commission_rate, current_amp);
        return_amount = response.return_amount;
        spread_amount = response.spread_amount;
        commission_amount = response.commission_amount;
        if (return_amount < Number(offer_amount) && Math.abs((Number(offer_amount) - return_amount) / Number(offer_amount) * 100 - price_impact) < 0.0001) break;
        if (i === 100) break;
        if (return_amount > Number(offer_amount) * (100 - price_impact) / 100) {
            if (position === -1) diff_offer_amount = Math.round(diff_offer_amount / 2);
            offer_amount += diff_offer_amount;
            position = 1;
        }
        else {
            if (position === 1) diff_offer_amount = Math.round(diff_offer_amount / 2);
            offer_amount -= diff_offer_amount;
            position = -1;
        }
        offer_amount = Math.round(offer_amount);
    }
    return offer_amount
}

export const computeStableBLuna = (offer_pool_amount: string, ask_pool_amount: string, offer_amount: string, commission_rate: number, current_amp: string) => {
    let return_amount = calcAskAmount(offer_pool_amount, ask_pool_amount, offer_amount, current_amp);
    let spread_amount = Number(offer_amount) > return_amount ? Number(offer_amount) - return_amount : 0;
    let commission_amount = Math.floor(return_amount * commission_rate);

    // The commission will be absorbed by the pool
    return_amount = return_amount - commission_amount;

    return {return_amount, spread_amount, commission_amount}
}

export const computeStableBLunaReverse = (offer_pool_amount: string, ask_pool_amount: string, ask_amount: string, commission_rate: number, current_amp: string) => {
    let one_minus_commission = 1 - commission_rate;
    let inv_one_minus_commission = (1 / one_minus_commission);
    let before_commission_deduction = Number(ask_amount) * inv_one_minus_commission;
    let offer_amount = calcOfferAmount(offer_pool_amount, ask_pool_amount, before_commission_deduction, current_amp);
    let spread_amount = Number(offer_amount) > before_commission_deduction ? Number(offer_amount) - before_commission_deduction : 0;
    let commission_amount = Math.floor(before_commission_deduction * commission_rate);

    return {offer_amount, spread_amount, commission_amount}
}

export const addSwapAmount = (swapAmount: string, liquidities: any, amp: string) => {
    let totalSwapLimit = 0;
    for (let i = 0; i < Object.keys(liquidities).length; i++) {
        const key = Object.keys(liquidities)[i];
        const eachProtocolLiquidities: any = liquidities[key];
        if (eachProtocolLiquidities.directSwapLimit) {
            let originAmount1 = eachProtocolLiquidities.direct[0].amount1;
            let originAmount2 = eachProtocolLiquidities.direct[0].amount2;
            let amount1 = eachProtocolLiquidities.direct[0].changedAmount1 ? eachProtocolLiquidities.direct[0].changedAmount1 : eachProtocolLiquidities.direct[0].amount1
            let amount2 = eachProtocolLiquidities.direct[0].changedAmount2 ? eachProtocolLiquidities.direct[0].changedAmount2 : eachProtocolLiquidities.direct[0].amount2
            if (key === 'astroport' && isLunaBLunaPair(eachProtocolLiquidities.direct[0])) {
                const commission_rate = STABLE_SWAP_FEE / 100;
                if (Number(swapAmount) <= Number(eachProtocolLiquidities.directSwapLimit)) {
                    eachProtocolLiquidities.directSwapAmount = Number(swapAmount);
                    const result = computeStableBLuna(amount1, amount2, swapAmount, commission_rate, amp);
                    const return_amount = result.return_amount;
                    eachProtocolLiquidities.directReceiveAmount = return_amount;
                    eachProtocolLiquidities.directOriginReceiveAmount = Number(swapAmount);
                    eachProtocolLiquidities.directPriceImpact = (eachProtocolLiquidities.directOriginReceiveAmount - eachProtocolLiquidities.directReceiveAmount) / eachProtocolLiquidities.directOriginReceiveAmount
                    return;
                } else {
                    eachProtocolLiquidities.directSwapAmount = Number(eachProtocolLiquidities.directSwapLimit);
                    swapAmount = (Number(swapAmount) - Number(eachProtocolLiquidities.directSwapLimit)).toFixed(0);
                    totalSwapLimit += Number(eachProtocolLiquidities.directSwapLimit);
                    const result = computeStableBLuna(amount1, amount2, swapAmount, commission_rate, amp);
                    const return_amount = result.return_amount;
                    eachProtocolLiquidities.directReceiveAmount = return_amount
                    eachProtocolLiquidities.directOriginReceiveAmount = Number(eachProtocolLiquidities.directSwapLimit);
                }
            } else {
                if (Number(swapAmount) <= Number(eachProtocolLiquidities.directSwapLimit)) {
                    eachProtocolLiquidities.directSwapAmount = Number(swapAmount);
                    eachProtocolLiquidities.directReceiveAmount = Math.floor(Number(amount2) * Number(swapAmount) / (Number(amount1) + Number(swapAmount)) * (1 - SWAP_FEE / 100))
                    eachProtocolLiquidities.directOriginReceiveAmount = Math.floor(Number(originAmount2) * Number(swapAmount) / Number(originAmount1));
                    eachProtocolLiquidities.directPriceImpact = (eachProtocolLiquidities.directOriginReceiveAmount - eachProtocolLiquidities.directReceiveAmount) / eachProtocolLiquidities.directOriginReceiveAmount
                    return;
                } else {
                    eachProtocolLiquidities.directSwapAmount = Number(eachProtocolLiquidities.directSwapLimit);
                    swapAmount = (Number(swapAmount) - Number(eachProtocolLiquidities.directSwapLimit)).toFixed(0);
                    totalSwapLimit += Number(eachProtocolLiquidities.directSwapLimit);
                    eachProtocolLiquidities.directReceiveAmount = Math.floor(Number(amount2) * Number(eachProtocolLiquidities.directSwapLimit) / (Number(amount1) + Number(eachProtocolLiquidities.directSwapLimit)) * (1 - SWAP_FEE / 100))
                    eachProtocolLiquidities.directOriginReceiveAmount = Math.floor(Number(originAmount2) * Number(eachProtocolLiquidities.directSwapLimit) / Number(originAmount1))
                }
            }
            eachProtocolLiquidities.directPriceImpact = (eachProtocolLiquidities.directOriginReceiveAmount - eachProtocolLiquidities.directReceiveAmount) / eachProtocolLiquidities.directOriginReceiveAmount
            // if (eachProtocolLiquidities.directPriceImpact < 0) eachProtocolLiquidities.directPriceImpact = 0;
        }
        if (eachProtocolLiquidities.lunaSwapLimit) {
            let originAmount1_1 = eachProtocolLiquidities.luna[0].amount1
            let originAmount1_2 = eachProtocolLiquidities.luna[0].amount2
            let originAmount2_1 = eachProtocolLiquidities.luna[1].amount1
            let originAmount2_2 = eachProtocolLiquidities.luna[1].amount2
            let amount1_1 = eachProtocolLiquidities.luna[0].changedAmount1 ? eachProtocolLiquidities.luna[0].changedAmount1 : eachProtocolLiquidities.luna[0].amount1
            let amount1_2 = eachProtocolLiquidities.luna[0].changedAmount2 ? eachProtocolLiquidities.luna[0].changedAmount2 : eachProtocolLiquidities.luna[0].amount2
            let amount2_1 = eachProtocolLiquidities.luna[1].changedAmount1 ? eachProtocolLiquidities.luna[1].changedAmount1 : eachProtocolLiquidities.luna[1].amount1
            let amount2_2 = eachProtocolLiquidities.luna[1].changedAmount2 ? eachProtocolLiquidities.luna[1].changedAmount2 : eachProtocolLiquidities.luna[1].amount2
            let lunaReceiveAmount1: number, lunaOriginReceiveAmount1: number, lunaOriginReceiveAmount2: number;
            if (key === 'astroport' && isLunaBLunaPair(eachProtocolLiquidities.luna[1])) {
                const commission_rate = STABLE_SWAP_FEE / 100;
                if (Number(swapAmount) <= Number(eachProtocolLiquidities.lunaSwapLimit)) {
                    eachProtocolLiquidities.lunaSwapAmount = Number(swapAmount);
                    lunaReceiveAmount1 = Math.floor(Number(amount1_2) * Number(swapAmount) / (Number(amount1_1) + Number(swapAmount)) * (1 - SWAP_FEE / 100))
                    const result = computeStableBLuna(amount2_1, amount2_2, lunaReceiveAmount1.toFixed(0), commission_rate, amp);
                    eachProtocolLiquidities.lunaReceiveAmount = result.return_amount;
                    eachProtocolLiquidities.lunaOriginReceiveAmount = Math.floor(Number(originAmount1_2) * Number(swapAmount) / Number(originAmount1_1))
                    eachProtocolLiquidities.lunaPriceImpact1 = (Number(eachProtocolLiquidities.lunaOriginReceiveAmount) - lunaReceiveAmount1) / Number(eachProtocolLiquidities.lunaOriginReceiveAmount)
                    eachProtocolLiquidities.lunaPriceImpact2 = (lunaReceiveAmount1 - eachProtocolLiquidities.lunaReceiveAmount) / lunaReceiveAmount1
                    return;
                } else {
                    eachProtocolLiquidities.lunaSwapAmount = Number(eachProtocolLiquidities.lunaSwapLimit);
                    swapAmount = (Number(swapAmount) - Number(eachProtocolLiquidities.lunaSwapLimit)).toFixed(0);
                    totalSwapLimit += Number(eachProtocolLiquidities.lunaSwapLimit);
                    lunaReceiveAmount1 = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.lunaSwapLimit) / (Number(amount1_1) + Number(eachProtocolLiquidities.lunaSwapLimit)) * (1 - SWAP_FEE / 100))
                    const result = computeStableBLuna(amount2_1, amount2_2, lunaReceiveAmount1.toFixed(0), commission_rate, amp);
                    eachProtocolLiquidities.lunaReceiveAmount = result.return_amount;
                    eachProtocolLiquidities.lunaOriginReceiveAmount = Math.floor(Number(originAmount1_2) * Number(eachProtocolLiquidities.lunaSwapLimit) / Number(originAmount1_1))
                }
                eachProtocolLiquidities.lunaPriceImpact1 = (Number(eachProtocolLiquidities.lunaOriginReceiveAmount) - lunaReceiveAmount1) / Number(eachProtocolLiquidities.lunaOriginReceiveAmount)
                eachProtocolLiquidities.lunaPriceImpact2 = (lunaReceiveAmount1 - eachProtocolLiquidities.lunaReceiveAmount) / lunaReceiveAmount1
                // if (eachProtocolLiquidities.lunaPriceImpact2 < 0) eachProtocolLiquidities.lunaPriceImpact2 = 0;
            } else {
                if (Number(swapAmount) <= Number(eachProtocolLiquidities.lunaSwapLimit)) {
                    eachProtocolLiquidities.lunaSwapAmount = Number(swapAmount);
                    lunaReceiveAmount1 = Math.floor(Number(amount1_2) * Number(swapAmount) / (Number(amount1_1) + Number(swapAmount)) * (1 - SWAP_FEE / 100))
                    lunaOriginReceiveAmount1 = Math.floor(Number(originAmount1_2) * Number(swapAmount) / Number(originAmount1_1))
                    eachProtocolLiquidities.lunaReceiveAmount = Math.floor(Number(amount2_2) * Number(lunaReceiveAmount1) / (Number(amount2_1) + Number(lunaReceiveAmount1)) * (1 - SWAP_FEE / 100))
                    lunaOriginReceiveAmount2 = Math.floor(Number(amount2_2) * Number(lunaReceiveAmount1) / Number(amount2_1))
                    eachProtocolLiquidities.lunaOriginReceiveAmount = Math.floor(Number(originAmount2_2) * lunaOriginReceiveAmount1 / Number(originAmount2_1))
                    eachProtocolLiquidities.lunaPriceImpact1 = (lunaOriginReceiveAmount1 - lunaReceiveAmount1) / lunaOriginReceiveAmount1;
                    eachProtocolLiquidities.lunaPriceImpact2 = (lunaOriginReceiveAmount2 - eachProtocolLiquidities.lunaReceiveAmount) / lunaOriginReceiveAmount2
                    return;
                } else {
                    eachProtocolLiquidities.lunaSwapAmount = Number(eachProtocolLiquidities.lunaSwapLimit);
                    swapAmount = (Number(swapAmount) - Number(eachProtocolLiquidities.lunaSwapLimit)).toFixed(0);
                    totalSwapLimit += Number(eachProtocolLiquidities.lunaSwapLimit);
                    lunaReceiveAmount1 = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.lunaSwapLimit) / (Number(amount1_1) + Number(eachProtocolLiquidities.lunaSwapLimit)) * (1 - SWAP_FEE / 100))
                    lunaOriginReceiveAmount1 = Math.floor(Number(originAmount1_2) * Number(eachProtocolLiquidities.lunaSwapLimit) / Number(originAmount1_1))
                    eachProtocolLiquidities.lunaReceiveAmount = Math.floor(Number(amount2_2) * Number(lunaReceiveAmount1) / (Number(amount2_1) + Number(lunaReceiveAmount1)) * (1 - SWAP_FEE / 100))
                    lunaOriginReceiveAmount2 = Math.floor(Number(amount2_2) * lunaReceiveAmount1 / Number(amount2_1))
                    eachProtocolLiquidities.lunaOriginReceiveAmount = Math.floor(Number(originAmount2_2) * lunaOriginReceiveAmount1 / Number(originAmount2_1))
                }
                eachProtocolLiquidities.lunaPriceImpact1 = (lunaOriginReceiveAmount1 - lunaReceiveAmount1) / lunaOriginReceiveAmount1;
                eachProtocolLiquidities.lunaPriceImpact2 = (lunaOriginReceiveAmount2 - eachProtocolLiquidities.lunaReceiveAmount) / lunaOriginReceiveAmount2
            }
        }
        if (eachProtocolLiquidities.ustSwapLimit) {
            let originAmount1_1 = eachProtocolLiquidities.ust[0].amount1
            let originAmount1_2 = eachProtocolLiquidities.ust[0].amount2
            let originAmount2_1 = eachProtocolLiquidities.ust[1].amount1
            let originAmount2_2 = eachProtocolLiquidities.ust[1].amount2
            let amount1_1 = eachProtocolLiquidities.ust[0].changedAmount1 ? eachProtocolLiquidities.ust[0].changedAmount1 : eachProtocolLiquidities.ust[0].amount1
            let amount1_2 = eachProtocolLiquidities.ust[0].changedAmount2 ? eachProtocolLiquidities.ust[0].changedAmount2 : eachProtocolLiquidities.ust[0].amount2
            let amount2_1 = eachProtocolLiquidities.ust[1].changedAmount1 ? eachProtocolLiquidities.ust[1].changedAmount1 : eachProtocolLiquidities.ust[1].amount1
            let amount2_2 = eachProtocolLiquidities.ust[1].changedAmount2 ? eachProtocolLiquidities.ust[1].changedAmount2 : eachProtocolLiquidities.ust[1].amount2
            let ustReceiveAmount1: number, ustOriginReceiveAmount1: number, ustOriginReceiveAmount2: number;
            if (Number(swapAmount) <= Number(eachProtocolLiquidities.ustSwapLimit)) {
                eachProtocolLiquidities.ustSwapAmount = Number(swapAmount);
                ustReceiveAmount1 = Math.floor(Number(amount1_2) * Number(swapAmount) / (Number(amount1_1) + Number(swapAmount)) * (1 - SWAP_FEE / 100))
                ustOriginReceiveAmount1 = Math.floor(Number(originAmount1_2) * Number(swapAmount) / Number(originAmount1_1))
                eachProtocolLiquidities.ustReceiveAmount = Math.floor(Number(amount2_2) * Number(ustReceiveAmount1) / (Number(amount2_1) + Number(ustReceiveAmount1)) * (1 - SWAP_FEE / 100))
                ustOriginReceiveAmount2 = Math.floor(Number(amount2_2) * Number(ustReceiveAmount1) / Number(amount2_1))
                eachProtocolLiquidities.ustOriginReceiveAmount = Math.floor(Number(originAmount2_2) * ustOriginReceiveAmount1 / Number(originAmount2_1))
                eachProtocolLiquidities.ustPriceImpact1 = (ustOriginReceiveAmount1 - ustReceiveAmount1) / ustOriginReceiveAmount1;
                eachProtocolLiquidities.ustPriceImpact2 = (ustOriginReceiveAmount2 - eachProtocolLiquidities.ustReceiveAmount) / ustOriginReceiveAmount2
                return;
            } else {
                eachProtocolLiquidities.ustSwapAmount = Number(eachProtocolLiquidities.ustSwapLimit);
                swapAmount = (Number(swapAmount) - Number(eachProtocolLiquidities.ustSwapLimit)).toFixed(0);
                totalSwapLimit += Number(eachProtocolLiquidities.ustSwapLimit);
                ustReceiveAmount1 = Math.floor(Number(amount1_2) * Number(eachProtocolLiquidities.ustSwapLimit) / (Number(amount1_1) + Number(eachProtocolLiquidities.ustSwapLimit)) * (1 - SWAP_FEE / 100))
                ustOriginReceiveAmount1 = Math.floor(Number(originAmount1_2) * Number(eachProtocolLiquidities.ustSwapLimit) / Number(originAmount1_1))
                eachProtocolLiquidities.ustReceiveAmount = Math.floor(Number(amount2_2) * Number(ustReceiveAmount1) / (Number(amount2_1) + Number(ustReceiveAmount1)) * (1 - SWAP_FEE / 100))
                ustOriginReceiveAmount2 = Math.floor(Number(originAmount2_2) * Number(ustReceiveAmount1) / Number(originAmount2_1))
                eachProtocolLiquidities.ustOriginReceiveAmount = Math.floor(Number(originAmount1_2) * Number(originAmount2_2)  *Number(eachProtocolLiquidities.ustSwapLimit) / Number(originAmount1_1) / Number(originAmount2_1))
            }
            eachProtocolLiquidities.ustPriceImpact1 = (ustOriginReceiveAmount1 - ustReceiveAmount1) / ustOriginReceiveAmount1;
            eachProtocolLiquidities.ustPriceImpact2 = (ustOriginReceiveAmount2 - eachProtocolLiquidities.ustReceiveAmount) / ustOriginReceiveAmount2
        }
    }
    if (Number(swapAmount) > 0) return {totalSwapLimit}
}

export const calculateCombinedLunaSwapLimit = (liquidities: any, current_amp: string) => {
    let priceImpact1 = PRICEIMPACTMAX - SWAP_FEE;
    let priceImpact2 = 0
    const offer_pool_amount = liquidities[1].changedAmount1 ? liquidities[1].changedAmount1 : liquidities[1].amount1;
    const ask_pool_amount = liquidities[1].changedAmount2 ? liquidities[1].changedAmount2 : liquidities[1].amount2;
    const amount1 = liquidities[0].changedAmount1 ? liquidities[0].changedAmount1 : liquidities[0].amount1;
    const amount2 = liquidities[0].changedAmount2 ? liquidities[0].changedAmount2 : liquidities[0].amount2;
    let swap_amount1 = Math.floor(Number(amount1) * priceImpact1 / (100 - PRICEIMPACTMAX))
    let offer_amount = Math.floor(Number(amount2) * Number(swap_amount1) / (Number(amount1) + Number(swap_amount1)) * (100 - SWAP_FEE) / 100)
    const commission_rate = STABLE_SWAP_FEE / 100
    let return_amount: number, spread_amount: number, commission_amount: number;
    let diff_priceImpact = PRICEIMPACTMAX / 10
    let position = 0, i = 0;
    while (1) {
        i++;
        const response = computeStableBLuna(offer_pool_amount, ask_pool_amount, offer_amount.toString(), commission_rate, current_amp);
        return_amount = response.return_amount;
        spread_amount = response.spread_amount;
        commission_amount = response.commission_amount;
        const _priceImpact2 = (Number(offer_amount) > return_amount ? Number(offer_amount) - return_amount : 0) / Number(offer_amount) * 100;
        if (Math.abs(_priceImpact2 - priceImpact2) < 0.001) break;
        if (i === 100) break;
        if (_priceImpact2 > priceImpact2) { // current price impact is over than price impact limit
            if (position === -1) diff_priceImpact = diff_priceImpact / 2; // prev price impact is less than price impact limit
            priceImpact1 -= diff_priceImpact; // reduce price impact 1
            position = 1;
        }
        else {
            if (position === 1) diff_priceImpact = diff_priceImpact / 2;
            priceImpact1 += diff_priceImpact;
            position = -1;
        }
        priceImpact2 = PRICEIMPACTMAX - SWAP_FEE - priceImpact1
        swap_amount1 = Math.floor(Number(amount1) * priceImpact1 / (100 - PRICEIMPACTMAX))
        offer_amount = Math.floor(Number(amount2) * Number(swap_amount1) / (Number(amount1) + Number(swap_amount1)) * (100 - SWAP_FEE) / 100)
    }
    return swap_amount1 > 0 ? swap_amount1 : 0;
}

export const calculateSwapLimit = (key: string, liquidities: any, amp: string) => {
    if (liquidities.direct) {
        if (key === "astroport" && isLunaBLunaPair(liquidities.direct[0])) {
            liquidities.directSwapLimit = calculateStableBlunaSwapLimit(liquidities.direct[0], amp, PRICEIMPACTMAX)
        } else {
            // x = a * (price_impact_max - swap_fee) / (100 - price_impact_max)
            const maxAmount = Math.floor(Number(liquidities.direct[0].amount1) * (PRICEIMPACTMAX - SWAP_FEE) / (100 - PRICEIMPACTMAX))
            liquidities.directSwapLimit = maxAmount > 0 ? maxAmount : 0
        }
    }
    if (liquidities.luna) {
        if (key === "astroport" && isLunaBLunaPair(liquidities.luna[1])) {
            liquidities.lunaSwapLimit = calculateCombinedLunaSwapLimit(liquidities.luna, amp)
        } else {
            // x = n * a * (100 * price_impact_max - 200 * swap_fee + swap_fee * swap_fee) / ((100 - price_impact_max) * (100 * (n + 1) - swap_fee)
            // n = liquidities[1].amount1 / liquidities[0].amount0
            const n = Number(liquidities.luna[1].amount1) / Number(liquidities.luna[0].amount2);
            const maxAmount = Math.floor(n * Number(liquidities.luna[0].amount1) * (100 * PRICEIMPACTMAX - 200 * SWAP_FEE + SWAP_FEE * SWAP_FEE) / ((100 - PRICEIMPACTMAX) * (100 * (n + 1) - SWAP_FEE)));
            liquidities.lunaSwapLimit = maxAmount > 0 ? maxAmount : 0
        }
    }
    if (liquidities.ust) {
        const n = Number(liquidities.ust[1].amount1) / Number(liquidities.ust[0].amount2);
        const maxAmount = Math.floor(n * Number(liquidities.ust[0].amount1) * (100 * PRICEIMPACTMAX - 200 * SWAP_FEE + SWAP_FEE * SWAP_FEE) / ((100 - PRICEIMPACTMAX) * (100 * (n + 1) - SWAP_FEE)));
        liquidities.ustSwapLimit = maxAmount > 0 ? maxAmount : 0
    }
}

export const isLunaBLunaPair = (liquidity: any) => {
    const asset1Addr = isCoin(liquidity.asset1) ? denomOfCoin(liquidity.asset1) : contract_addrOfToken(liquidity.asset1)
    const asset2Addr = isCoin(liquidity.asset2) ? denomOfCoin(liquidity.asset2) : contract_addrOfToken(liquidity.asset2)
    if ((asset1Addr === ULUNA && asset2Addr === bLUNA) || (asset1Addr === bLUNA && asset2Addr === ULUNA)) return true
    return false
}

export const _addPoolAmount = (liquidity, liquidityData) => {
    const asset1Address = isCoin(liquidity.asset1) ? denomOfCoin(liquidity.asset1) : contract_addrOfToken(liquidity.asset1)
    const asset2Address = isCoin(liquidity.asset2) ? denomOfCoin(liquidity.asset2) : contract_addrOfToken(liquidity.asset2)
    const liquidityDataAsset1Address = isCoin(liquidityData.assets[0].info) ? denomOfCoin(liquidityData.assets[0].info) : contract_addrOfToken(liquidityData.assets[0].info)
    const liquidityDataAsset2Address = isCoin(liquidityData.assets[1].info) ? denomOfCoin(liquidityData.assets[1].info) : contract_addrOfToken(liquidityData.assets[1].info)
    if (asset1Address === liquidityDataAsset1Address && asset2Address === liquidityDataAsset2Address) {
        liquidity.amount1 = liquidityData.assets[0].amount;
        liquidity.amount2 = liquidityData.assets[1].amount;
    } else if (asset1Address === liquidityDataAsset2Address && asset2Address === liquidityDataAsset1Address) {
        liquidity.amount1 = liquidityData.assets[1].amount;
        liquidity.amount2 = liquidityData.assets[0].amount;
    }
}

export const _getSwapLiquidities = (rawPairs: any, terraswapPairsList: any, asset1: AssetInfo | NativeInfo, asset2: AssetInfo | NativeInfo) => {
    if (!rawPairs) return {}
    const _rawPairs = Object.values(rawPairs).filter((each: any) => each.asset_infos).concat(rawPairs.pairs)
    const asset1Addr = isCoin(asset1) ? denomOfCoin(asset1) : contract_addrOfToken(asset1)
    const asset2Addr = isCoin(asset2) ? denomOfCoin(asset2) : contract_addrOfToken(asset2)
    if (asset1Addr === asset2Addr) return {}

    // get loop protocol pairs

    const loopPairs = {
        direct: undefined,
        ust: undefined,
        luna: undefined,
        directSwapLimit: undefined,
        lunaSwapLimit: undefined,
        ustSwapLimit: undefined,
        directSwapAmount: undefined,
        lunaSwapAmount: undefined,
        ustSwapAmount: undefined,
        directReceiveAmount: undefined,
        directOriginReceiveAmount: undefined,
        lunaReceiveAmount: undefined,
        lunaOriginReceiveAmount: undefined,
        ustReceiveAmount: undefined,
        ustOriginReceiveAmount: undefined,
        directPriceImpact: undefined,
        lunaPriceImpact1: undefined,
        lunaPriceImpact2: undefined,
        ustPriceImpact1: undefined,
        ustPriceImpact2: undefined
    }
    
    const loopAsset1Pairs = Object.values(_rawPairs).filter((each: PairDetail) => {
        const _asset_infos = each.asset_infos
        const _asset1Addr = isCoin(_asset_infos[0]) ? denomOfCoin(_asset_infos[0]) : contract_addrOfToken(_asset_infos[0])
        const _asset2Addr = isCoin(_asset_infos[1]) ? denomOfCoin(_asset_infos[1]) : contract_addrOfToken(_asset_infos[1])
        if (_asset1Addr === asset1Addr || _asset2Addr === asset1Addr) return true
        return false
    })
    
    const loopAsset2Pairs = Object.values(_rawPairs).filter((each: PairDetail) => {
        const _asset_infos = each.asset_infos
        const _asset1Addr = isCoin(_asset_infos[0]) ? denomOfCoin(_asset_infos[0]) : contract_addrOfToken(_asset_infos[0])
        const _asset2Addr = isCoin(_asset_infos[1]) ? denomOfCoin(_asset_infos[1]) : contract_addrOfToken(_asset_infos[1])
        if (_asset1Addr === asset2Addr || _asset2Addr === asset2Addr) return true
        return false
    })

    const loopDirectPairs = loopAsset1Pairs.filter((each: PairDetail) => {
        const _asset_infos = each.asset_infos
        const _asset1Addr = isCoin(_asset_infos[0]) ? denomOfCoin(_asset_infos[0]) : contract_addrOfToken(_asset_infos[0])
        const _asset2Addr = isCoin(_asset_infos[1]) ? denomOfCoin(_asset_infos[1]) : contract_addrOfToken(_asset_infos[1])
        if (_asset1Addr === asset2Addr || _asset2Addr === asset2Addr) return true
        return false
    }).map((each: PairDetail) => each.contract_addr)

    if (loopDirectPairs.length > 0) loopPairs.direct = [{
        liquidity: loopDirectPairs[0],
        asset1: asset1,
        asset2: asset2,
        amount1: undefined,
        amount2: undefined,
        changedAmount1: undefined,
        changedAmount2: undefined
    }]

    if (asset1Addr !== ULUNA && asset2Addr !== ULUNA) {
        const loopUlunaAsset1Pairs = loopAsset1Pairs.filter((each: PairDetail) => {
            const _asset_infos = each.asset_infos
            if (isCoin(_asset_infos[0]) && denomOfCoin(_asset_infos[0]) === ULUNA) return true
            if (isCoin(_asset_infos[1]) && denomOfCoin(_asset_infos[1]) === ULUNA) return true
            return false
        }).map((each: PairDetail) => each.contract_addr)
    
        if (loopUlunaAsset1Pairs.length > 0) {
            const loopUlunaAsset2Pairs = loopAsset2Pairs.filter((each: PairDetail) => {
                const _asset_infos = each.asset_infos
                if (isCoin(_asset_infos[0]) && denomOfCoin(_asset_infos[0]) === ULUNA) return true
                if (isCoin(_asset_infos[1]) && denomOfCoin(_asset_infos[1]) === ULUNA) return true
                return false
            }).map((each: PairDetail) => each.contract_addr)
            if (loopUlunaAsset2Pairs.length > 0) loopPairs.luna = [{
                liquidity: loopUlunaAsset1Pairs[0],
                asset1: asset1,
                asset2: {
                    native_token: {
                        denom: ULUNA
                    }
                },
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }, {
                liquidity: loopUlunaAsset2Pairs[0],
                asset1: {
                    native_token: {
                        denom: ULUNA
                    }
                },
                asset2: asset2,
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }]
        }
    }

    if (asset1Addr !== UUSD && asset2Addr !== UUSD) {
        const loopUusdAsset1Pairs = loopAsset1Pairs.filter((each: PairDetail) => {
            const _asset_infos = each.asset_infos
            if (isCoin(_asset_infos[0]) && denomOfCoin(_asset_infos[0]) === UUSD) return true
            if (isCoin(_asset_infos[1]) && denomOfCoin(_asset_infos[1]) === UUSD) return true
            return false
        }).map((each: PairDetail) => each.contract_addr)
    
        if (loopUusdAsset1Pairs.length > 0) {
            const loopUusdAsset2Pairs = loopAsset2Pairs.filter((each: PairDetail) => {
                const _asset_infos = each.asset_infos
                if (isCoin(_asset_infos[0]) && denomOfCoin(_asset_infos[0]) === UUSD) return true
                if (isCoin(_asset_infos[1]) && denomOfCoin(_asset_infos[1]) === UUSD) return true
                return false
            }).map((each: PairDetail) => each.contract_addr)
            if (loopUusdAsset2Pairs.length > 0) loopPairs.ust = [{
                liquidity: loopUusdAsset1Pairs[0],
                asset1: asset1,
                asset2: {
                    native_token: {
                        denom: UUSD
                    }
                },
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }, {
                liquidity: loopUusdAsset2Pairs[0],
                asset1: {
                    native_token: {
                        denom: UUSD
                    }
                },
                asset2: asset2,
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }]
        }
    }

    const terraswapPairs = {
        direct: undefined,
        luna: undefined,
        ust: undefined,
        directSwapLimit: undefined,
        lunaSwapLimit: undefined,
        ustSwapLimit: undefined,
        directSwapAmount: undefined,
        lunaSwapAmount: undefined,
        ustSwapAmount: undefined,
        directReceiveAmount: undefined,
        directOriginReceiveAmount: undefined,
        lunaReceiveAmount: undefined,
        lunaOriginReceiveAmount: undefined,
        ustReceiveAmount: undefined,
        ustOriginReceiveAmount: undefined,
        directPriceImpact: undefined,
        lunaPriceImpact1: undefined,
        lunaPriceImpact2: undefined,
        ustPriceImpact1: undefined,
        ustPriceImpact2: undefined
    }

    const astroportPairs = {
        direct: undefined,
        luna: undefined,
        ust: undefined,
        directSwapLimit: undefined,
        lunaSwapLimit: undefined,
        ustSwapLimit: undefined,
        directSwapAmount: undefined,
        lunaSwapAmount: undefined,
        ustSwapAmount: undefined,
        directReceiveAmount: undefined,
        directOriginReceiveAmount: undefined,
        lunaReceiveAmount: undefined,
        lunaOriginReceiveAmount: undefined,
        ustReceiveAmount: undefined,
        ustOriginReceiveAmount: undefined,
        directPriceImpact: undefined,
        lunaPriceImpact1: undefined,
        lunaPriceImpact2: undefined,
        ustPriceImpact1: undefined,
        ustPriceImpact2: undefined
    }

    let terraswapAsset1UusdPair = undefined, terraswapAsset1UlunaPair = undefined, terraswapAsset2UusdPair = undefined, terraswapAsset2UlunaPair = undefined, astroportAsset1UusdPair = undefined, astroportAsset1UlunaPair = undefined, astroportAsset2UusdPair = undefined, astroportAsset2UlunaPair = undefined;

    Object.keys(terraswapPairsList).map(key => {
        const dex = terraswapPairsList[key].dex
        const assets = terraswapPairsList[key].assets
        if ((assets[0] === asset1Addr && assets[1] === asset2Addr) || (assets[0] === asset2Addr && assets[1] === asset1Addr)) {
            if (dex === 'terraswap') terraswapPairs.direct = [{
                liquidity: key,
                asset1: asset1,
                asset2: asset2,
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }]
            if (dex === 'astroport') astroportPairs.direct = [{
                liquidity: key,
                asset1: asset1,
                asset2: asset2,
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }]
        } else if ((assets[0] === asset1Addr && assets[1] === UUSD) || (assets[0] === UUSD && assets[1] === asset1Addr)) {
            const _pair = {
                liquidity: key,
                asset1: asset1,
                asset2: {
                    native_token: {
                        denom: UUSD
                    }
                },
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }
            if (dex === 'terraswap') terraswapAsset1UusdPair = _pair;
            if (dex === 'astroport') astroportAsset1UusdPair = _pair;
        } else if ((assets[0] === asset1Addr && assets[1] === ULUNA) || (assets[0] === ULUNA && assets[1] === asset1Addr)) {
            const _pair = {
                liquidity: key,
                asset1: asset1,
                asset2: {
                    native_token: {
                        denom: ULUNA
                    }
                },
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }
            if (dex === 'terraswap') terraswapAsset1UlunaPair = _pair;
            if (dex === 'astroport') astroportAsset1UlunaPair = _pair;
        } else if ((assets[0] === asset2Addr && assets[1] === UUSD) || (assets[0] === UUSD && assets[1] === asset2Addr)) {
            const _pair = {
                liquidity: key,
                asset1: {
                    native_token: {
                        denom: UUSD
                    }
                },
                asset2: asset2,
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }
            if (dex === 'terraswap') terraswapAsset2UusdPair = _pair;
            if (dex === 'astroport') astroportAsset2UusdPair = _pair;
        } else if ((assets[0] === asset2Addr && assets[1] === ULUNA) || (assets[0] === ULUNA && assets[1] === asset2Addr)) {
            const _pair = {
                liquidity: key,
                asset1: {
                    native_token: {
                        denom: ULUNA
                    }
                },
                asset2: asset2,
                amount1: undefined,
                amount2: undefined,
                changedAmount1: undefined,
                changedAmount2: undefined
            }
            if (dex === 'terraswap') terraswapAsset2UlunaPair = _pair;
            if (dex === 'astroport') astroportAsset2UlunaPair = _pair;
        }
    })

    if (terraswapAsset1UusdPair && terraswapAsset2UusdPair) {
        terraswapPairs.ust = [
            terraswapAsset1UusdPair,
            terraswapAsset2UusdPair
        ]
    }

    if (terraswapAsset1UlunaPair && terraswapAsset2UlunaPair) {
        terraswapPairs.luna = [
            terraswapAsset1UlunaPair,
            terraswapAsset2UlunaPair
        ]
    }

    if (astroportAsset1UusdPair && astroportAsset2UusdPair) {
        astroportPairs.ust = [
            astroportAsset1UusdPair,
            astroportAsset2UusdPair
        ]
    }

    if (astroportAsset1UlunaPair && astroportAsset2UlunaPair) {
        astroportPairs.luna = [
            astroportAsset1UlunaPair,
            astroportAsset2UlunaPair
        ]
    }

    return {
        loop: loopPairs,
        astroport: astroportPairs,
        terraswap: terraswapPairs,
    }
}

export const _getLiquidityAddr = (rawPairs: any, asset1: AssetInfo | NativeInfo, asset2: AssetInfo | NativeInfo) => {
    if (!rawPairs) return undefined
    const _rawPairs = Object.values<PairDetail>(rawPairs).filter((each: any) => each.asset_infos).concat(rawPairs.pairs)
    const asset1Addr = isCoin(asset1) ? denomOfCoin(asset1) : contract_addrOfToken(asset1)
    const asset2Addr = isCoin(asset2) ? denomOfCoin(asset2) : contract_addrOfToken(asset2)
    const filteredPairs = _rawPairs.filter((each: PairDetail) => {
        const _asset_infos = each.asset_infos
        const _asset1Addr = isCoin(_asset_infos[0]) ? denomOfCoin(_asset_infos[0]) : contract_addrOfToken(_asset_infos[0])
        const _asset2Addr = isCoin(_asset_infos[1]) ? denomOfCoin(_asset_infos[1]) : contract_addrOfToken(_asset_infos[1])
        if ((_asset1Addr === asset1Addr && _asset2Addr === asset2Addr) || (_asset2Addr === asset1Addr && _asset1Addr === asset2Addr)) return true
        return false
    })
    if (filteredPairs.length === 0) return undefined
    else return filteredPairs[0].contract_addr
}

export const getPath = (chainID, liquidities) => {
    const startAsset = liquidities[0].asset1;
    let _path = getSymbol(chainID, liquidities[0].asset1)
    liquidities.map(each => {
      _path += `-${getSymbol(chainID, each.asset2)}`
    })
    return _path
  }

export const borrowAssetAsFullDegenMode = async (rawPairs: any, terraswapPairs: any, lcd: LCDClient, chain: string, walletAddress: string, swapAmount: string, swapAsset: AssetInfo | NativeInfo, percent: string, loopHole: number, slippage: number, collaterals: CollateralDetail[], borrowData: BorrowDetail) => {
    const collateralAsset = {token: {contract_addr: chain === chainID.main ? bLUNA : test_bLUNA}}
    const borrowAsset = {native_token: {denom: ULUNA}}
    let swapAmountUsd = "0"
    const liquidityPoolDataQuery = []
    let firstCollateralLiquidities: any = [], borrowLiquidities: any = [], collateralPriceLiquidities: any = [], borrowPriceLiquidities: any = []
    if (isCoin(swapAsset) && denomOfCoin(swapAsset) == UUSD) {
        swapAmountUsd = swapAmount
    } else {
        collateralPriceLiquidities = getSwapLiquidities(rawPairs, terraswapPairs, swapAsset, {native_token: {denom: UUSD}})
        if (collateralPriceLiquidities.length === 0) {
            return {count: 0, swapAmountUsd, depositAmount: '0', depositAmountUsd: '0', borrowAmount: '0', borrowAmountUsd: '0', liquidityError: true}
        }
        collateralPriceLiquidities.map((each: any) => {
            liquidityPoolDataQuery.push(getPoolDetailQuery(lcd, each.liquidity))
        })
    }
    if (isCoin(swapAsset) || (!isCoin(swapAsset) && ((lcd.config.chainID === chainID.main && contract_addrOfToken(swapAsset) !== bLUNA) || (lcd.config.chainID !== chainID.main && contract_addrOfToken(swapAsset) !== test_bLUNA)))) {
        firstCollateralLiquidities = getSwapLiquidities(rawPairs, terraswapPairs, swapAsset, collateralAsset)
        if (firstCollateralLiquidities.length === 0) {
            return {count: 0, swapAmountUsd, depositAmount: '0', depositAmountUsd: '0', borrowAmount: '0', borrowAmountUsd: '0', liquidityError: true}
        }
        firstCollateralLiquidities.map((each: any) => {
            liquidityPoolDataQuery.push(getPoolDetailQuery(lcd, each.liquidity))
        })
    }
    borrowLiquidities = getSwapLiquidities(rawPairs, terraswapPairs, {native_token:{denom:UUSD}}, {native_token:{denom:ULUNA}}).concat(getSwapLiquidities(rawPairs, terraswapPairs, borrowAsset, collateralAsset))
    if (borrowLiquidities.length === 0) {
        return {count: 0, swapAmountUsd, depositAmount: '0', depositAmountUsd: '0', borrowAmount: '0', borrowAmountUsd: '0', liquidityError: true}
    }
    borrowLiquidities.map((each: any) => {
        liquidityPoolDataQuery.push(getPoolDetailQuery(lcd, each.liquidity))
    })

    const liquidityPoolData = await Promise.all(liquidityPoolDataQuery)
    let firstCollateralLiquiditiesData: any = [], borrowLiquiditiesData: any = [], collateralPriceLiquiditiesData: any = [], index = 0
    if (collateralPriceLiquidities.length) {
        collateralPriceLiquiditiesData = liquidityPoolData.slice(0, collateralPriceLiquidities.length)
        index = collateralPriceLiquidities.length
        swapAmountUsd = calculateExpectSwapAmount(collateralPriceLiquidities, collateralPriceLiquiditiesData, swapAmount, true)
    }
    if (firstCollateralLiquidities.length) {
        firstCollateralLiquiditiesData = liquidityPoolData.slice(index, firstCollateralLiquidities.length + index)
        index += firstCollateralLiquidities.length
    }
    if (borrowLiquidities.length) {
        borrowLiquiditiesData = liquidityPoolData.slice(index, borrowLiquidities.length + index)
        index += borrowLiquidities.length
    }

    let expectSwapAmount: string = '0'
    if (!isCoin(swapAsset) && contract_addrOfToken(swapAsset) === bLUNA) expectSwapAmount = swapAmount
    else {
        expectSwapAmount = swapAmount && Number(swapAmount) > 0 ? calculateExpectSwapAmount(firstCollateralLiquidities, firstCollateralLiquiditiesData, swapAmount) : '0'
    }

    let rate: number = 0
    if (lcd.config.chainID === chainID.main) {
        const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
        await lcd.wasm.contractQuery(ORACLE, {'price': {'base': bLUNA, 'quote': UUSD}})
        rate = Number(rateResponse.rate)
    } else {
        const rateResponse: {'rate': string, 'last_updated_base': string, 'last_updated_quote': string} = 
        await lcd.wasm.contractQuery(test_ORACLE, {'price': {'base': test_bLUNA, 'quote': UUSD}})
        rate = Number(rateResponse.rate)
    }
    let totalDepositAmountUsd = 0, totalAmountUsd = 0
    collaterals.map(c => {
        totalDepositAmountUsd += Number(c.amountUST)
        totalAmountUsd += Number(c.amountUST)
    })
    totalDepositAmountUsd = totalDepositAmountUsd * Math.pow(10, 6)
    let totalBorrowAmountUsd = Number(borrowData.borrow_amount) * Math.pow(10, 6)
    let totalBorrowLimit = Number(borrowData.borrow_limit) * Math.pow(10, 6)
    
    let depositAmount: string = '', borrowAmountUsd: string = '', count: number = 0, expectDepositAmount: string = expectSwapAmount, expectDepositAmountUsd: string, expectBorrowAmountUsd: string, borrowAmount: string = '', expectBorrowAmount: string
    let msgs: MsgExecuteContract[] = [], _getCollateralAssetsMsgs: {msgs: MsgExecuteContract[], expectMinimumAmount: number} | undefined
    let expectMinimumAmount = "0"
    for ( let i = 0; i < loopHole; i++) {
        if (i === 0) {
            if (!isCoin(swapAsset) && (contract_addrOfToken(swapAsset) === bLUNA || contract_addrOfToken(swapAsset) === test_bLUNA)) {
                expectMinimumAmount = swapAmount
            }
            else {
                expectMinimumAmount = addSwapMsg(lcd, chain, walletAddress, swapAsset, swapAmount, collateralAsset, firstCollateralLiquidities, firstCollateralLiquiditiesData, slippage, msgs)
            }
        }
        expectDepositAmountUsd = (Math.floor(Number(expectMinimumAmount) * rate)).toString()
        await addProvideMsg(lcd, chain, walletAddress, expectMinimumAmount, collateralAsset, msgs)
        if (i === loopHole - 1) break
        totalDepositAmountUsd = Number(totalDepositAmountUsd) + Number(expectDepositAmountUsd)
        if (totalAmountUsd > 0) totalBorrowLimit = totalBorrowLimit + Number(expectDepositAmountUsd) * Number(borrowData.borrow_limit) / Number(totalAmountUsd)
        else totalBorrowLimit = totalBorrowLimit + Math.floor(Number(expectDepositAmountUsd) * 0.8)
        expectBorrowAmountUsd = (Math.floor(Number(totalBorrowLimit) * Number(percent) / 100 - totalBorrowAmountUsd)).toString()
        depositAmount = (Math.floor(Number(depositAmount) + Number(expectDepositAmount))).toString()
        totalBorrowAmountUsd = totalBorrowAmountUsd + Number(expectBorrowAmountUsd)
        borrowAmountUsd = (Math.floor(Number(borrowAmountUsd) + Number(expectBorrowAmountUsd))).toString()
        // if (i === 0) {
            let _feeAmount = (Math.floor(Number(expectBorrowAmountUsd) * 0.001)).toString()
            // if (_feeAmount < 1) _feeAmount = 1
            expectBorrowAmountUsd = (Number(expectBorrowAmountUsd) - Number(_feeAmount)).toString()
            addBorrowMsg(lcd, chain, walletAddress,_feeAmount, msgs, treasuryWallet)
        // }
        addBorrowMsg(lcd, chain, walletAddress, expectBorrowAmountUsd, msgs)
        expectMinimumAmount = addSwapMsg(lcd, chain, walletAddress, {'native_token':{'denom': UUSD}}, expectBorrowAmountUsd, borrowAsset, borrowLiquidities, borrowLiquiditiesData, slippage, msgs)
        // console.log(_getCollateralAssetsMsgs)
        // borrowAmount = (Number(borrowAmount) + Number(expectBorrowAmount)).toFixed(3)
    }
    return msgs
}

export const configMsgs = (msgs: MsgExecuteContract[], details: any, lcd: LCDClient, walletAddress: string, slippage: number, collateralAsset: NativeInfo | AssetInfo) => {
    const collateralLiquidities = details.collateralLiquidities;
    const borrowLiquidities = details.borrowLiquidities;
    const config = details.config
    // collateral swap msgs
    Object.keys(collateralLiquidities).map(key => {
        const eachProtocol = collateralLiquidities[key];
        if (eachProtocol.directSwapAmount) {
            const liquidityAddress = eachProtocol.direct[0].liquidity;
            const swapAmount = eachProtocol.directSwapAmount;
            const swapAsset = eachProtocol.direct[0].asset1;
            const max_spread = (slippage / 100).toFixed(5)
            if (key === 'astroport' && isLunaBLunaPair(eachProtocol.direct[0])) {
                const belief_price = '1';
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset), Number(swapAmount).toFixed(0)))
                msgs.push(getSwapCoinMsg(walletAddress, liquidityAddress, max_spread, denomOfCoin(swapAsset), swapAmount.toFixed(0), belief_price, coins));
            } else {
                const belief_price = (Number(eachProtocol.direct[0].amount1) / Number(eachProtocol.direct[0].amount2)).toFixed(15);
                if (isCoin(swapAsset)) {
                    const coins = new Coins().add(new Coin(denomOfCoin(swapAsset), Number(swapAmount).toFixed(0)));
                    msgs.push(getSwapCoinMsg(walletAddress, liquidityAddress, max_spread, denomOfCoin(swapAsset), swapAmount.toFixed(0), belief_price, coins));
                } else {
                    msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset), max_spread, liquidityAddress, swapAmount, belief_price));
                }
            }
        } else if (eachProtocol.lunaSwapAmount) {
            const liquidity1Address = eachProtocol.luna[0].liquidity;
            const swapAmount1 = eachProtocol.lunaSwapAmount;
            const swapAsset1 = eachProtocol.luna[0].asset1;
            const baseImpact = Math.sqrt(1 + slippage / 100 + Math.pow((eachProtocol.lunaPriceImpact1 - eachProtocol.lunaPriceImpact2) / 2, 2)) - Math.pow((1 + (eachProtocol.lunaPriceImpact1 + eachProtocol.lunaPriceImpact2) / 2), 2)
            const max_spread1 = (baseImpact + eachProtocol.lunaPriceImpact1).toFixed(5);
            const belief_price1 = (Number(eachProtocol.luna[0].amount1) / Number(eachProtocol.luna[0].amount2)).toFixed(15);
            if (isCoin(swapAsset1)) {
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset1), Number(swapAmount1).toFixed(0)));
                msgs.push(getSwapCoinMsg(walletAddress, liquidity1Address, max_spread1, denomOfCoin(swapAsset1), swapAmount1.toFixed(0), belief_price1, coins));
            } else {
                msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset1), max_spread1, liquidity1Address, swapAmount1.toFixed(0), belief_price1));
            }
            const liquidity2Address = eachProtocol.luna[1].liquidity;
            const swapAmount2 = Number(eachProtocol.luna[0].amount2) * Number(swapAmount1) / Number(eachProtocol.luna[0].amount1) * (1 - max_spread1)
            const swapAsset2 = eachProtocol.luna[1].asset1;
            const max_spread2 = (baseImpact + eachProtocol.lunaPriceImpact2).toFixed(5);
            const belief_price2 = (Number(eachProtocol.luna[1].amount1) / Number(eachProtocol.luna[1].amount2)).toFixed(15);
            if (isCoin(swapAsset1)) {
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset2), Number(swapAmount2).toFixed(0)));
                msgs.push(getSwapCoinMsg(walletAddress, liquidity2Address, max_spread2, denomOfCoin(swapAsset2), swapAmount2.toFixed(0), belief_price2, coins));
            } else {
                msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset2), max_spread2, liquidity2Address, swapAmount2.toFixed(0), belief_price2));
            }
        } else if (eachProtocol.ustSwapAmount) {
            const liquidity1Address = eachProtocol.ust[0].liquidity;
            const swapAmount1 = eachProtocol.ustSwapAmount;
            const swapAsset1 = eachProtocol.ust[0].asset1;
            const baseImpact = Math.sqrt(1 + slippage / 100 + Math.pow((eachProtocol.ustPriceImpact1 - eachProtocol.ustPriceImpact2) / 2, 2)) - Math.pow((1 + (eachProtocol.ustPriceImpact1 + eachProtocol.ustPriceImpact2) / 2), 2)
            const max_spread1 = (baseImpact + eachProtocol.ustPriceImpact1).toFixed(5);
            const belief_price1 = (Number(eachProtocol.ust[0].amount1) / Number(eachProtocol.ust[0].amount2)).toFixed(15);
            if (isCoin(swapAsset1)) {
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset1), Number(swapAmount1).toFixed(0)));
                msgs.push(getSwapCoinMsg(walletAddress, liquidity1Address, max_spread1, denomOfCoin(swapAsset1), swapAmount1.toFixed(0), belief_price1, coins));
            } else {
                msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset1), max_spread1, liquidity1Address, swapAmount1.toFixed(0), belief_price1));
            }
            const liquidity2Address = eachProtocol.ust[1].liquidity;
            const swapAmount2 = Number(eachProtocol.ust[0].amount2) * Number(swapAmount1) / Number(eachProtocol.ust[0].amount1) * (1 - max_spread1)
            const swapAsset2 = eachProtocol.ust[1].asset1;
            const max_spread2 = (baseImpact + eachProtocol.ustPriceImpact2).toFixed(5);
            const belief_price2 = (Number(eachProtocol.ust[1].amount1) / Number(eachProtocol.ust[1].amount2)).toFixed(15);
            if (isCoin(swapAsset1)) {
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset2), Number(swapAmount2).toFixed(0)));
                msgs.push(getSwapCoinMsg(walletAddress, liquidity2Address, max_spread2, denomOfCoin(swapAsset2), swapAmount2.toFixed(0), belief_price2, coins));
            } else {
                msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset2), max_spread2, liquidity2Address, swapAmount2.toFixed(0), belief_price2));
            }
        }
    })
    if (config.collateralAmount && Number(config.collateralAmount) > 0) {
        // send fee msg
        msgs.push(getSwapTokenAstroportRouterMsg(walletAddress, contract_addrOfToken(collateralAsset), config.treasuryFee, undefined, undefined, treasuryWallet))
        // deposit collateral
        msgs = addProvideMsg(lcd, lcd.config.chainID, walletAddress, (Number(config.collateralAmount) * Math.pow(10, getDecimals(lcd.config.chainID, collateralAsset))).toFixed(0), collateralAsset, msgs);
    }
    if (config.borrowAmountUsd && Number(config.borrowAmountUsd) > 0) {
        addBorrowMsg(lcd, lcd.config.chainID, walletAddress, (Number(config.borrowAmountUsd) * Math.pow(10, 6)).toFixed(0), msgs);
    }
    // borrow swap msgs
    Object.keys(borrowLiquidities).map(key => {
        const eachProtocol = borrowLiquidities[key];
        if (eachProtocol.directSwapAmount) {
            const liquidityAddress = eachProtocol.direct[0].liquidity;
            const swapAmount = eachProtocol.directSwapAmount;
            const swapAsset = eachProtocol.direct[0].asset1;
            const max_spread = (slippage / 100).toFixed(5)
            if (key === 'astroport' && isLunaBLunaPair(eachProtocol.direct[0])) {
                const belief_price = '1';
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset), Number(swapAmount).toFixed(0)))
                msgs.push(getSwapCoinMsg(walletAddress, liquidityAddress, max_spread, denomOfCoin(swapAsset), swapAmount.toFixed(0), belief_price, coins));
            } else {
                const belief_price = (Number(eachProtocol.direct[0].amount1) / Number(eachProtocol.direct[0].amount2)).toFixed(15);
                if (isCoin(swapAsset)) {
                    const coins = new Coins().add(new Coin(denomOfCoin(swapAsset), Number(swapAmount).toFixed(0)));
                    msgs.push(getSwapCoinMsg(walletAddress, liquidityAddress, max_spread, denomOfCoin(swapAsset), swapAmount.toFixed(0), belief_price, coins));
                } else {
                    msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset), max_spread, liquidityAddress, swapAmount, belief_price));
                }
            }
        } else if (eachProtocol.lunaSwapAmount) {
            const liquidity1Address = eachProtocol.luna[0].liquidity;
            const swapAmount1 = eachProtocol.lunaSwapAmount;
            const swapAsset1 = eachProtocol.luna[0].asset1;
            const baseImpact = Math.sqrt(1 + slippage / 100 + Math.pow((eachProtocol.lunaPriceImpact1 - eachProtocol.lunaPriceImpact2) / 2, 2)) - Math.pow((1 + (eachProtocol.lunaPriceImpact1 + eachProtocol.lunaPriceImpact2) / 2), 2)
            const max_spread1 = (baseImpact + eachProtocol.lunaPriceImpact1).toFixed(5);
            const belief_price1 = (Number(eachProtocol.luna[0].amount1) / Number(eachProtocol.luna[0].amount2)).toFixed(15);
            if (isCoin(swapAsset1)) {
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset1), Number(swapAmount1).toFixed(0)));
                msgs.push(getSwapCoinMsg(walletAddress, liquidity1Address, max_spread1, denomOfCoin(swapAsset1), swapAmount1.toFixed(0), belief_price1, coins));
            } else {
                msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset1), max_spread1, liquidity1Address, swapAmount1.toFixed(0), belief_price1));
            }
            const liquidity2Address = eachProtocol.luna[1].liquidity;
            const swapAmount2 = Number(eachProtocol.luna[0].amount2) * Number(swapAmount1) / Number(eachProtocol.luna[0].amount1) * (1 - max_spread1)
            const swapAsset2 = eachProtocol.luna[1].asset1;
            const max_spread2 = (baseImpact + eachProtocol.lunaPriceImpact2).toFixed(5);
            const belief_price2 = (Number(eachProtocol.luna[1].amount1) / Number(eachProtocol.luna[1].amount2)).toFixed(15);
            if (isCoin(swapAsset1)) {
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset2), Number(swapAmount2).toFixed(0)));
                msgs.push(getSwapCoinMsg(walletAddress, liquidity2Address, max_spread2, denomOfCoin(swapAsset2), swapAmount2.toFixed(0), belief_price2, coins));
            } else {
                msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset2), max_spread2, liquidity2Address, swapAmount2.toFixed(0), belief_price2));
            }
        } else if (eachProtocol.ustSwapAmount) {
            const liquidity1Address = eachProtocol.ust[0].liquidity;
            const swapAmount1 = eachProtocol.ustSwapAmount;
            const swapAsset1 = eachProtocol.ust[0].asset1;
            const baseImpact = Math.sqrt(1 + slippage / 100 + Math.pow((eachProtocol.ustPriceImpact1 - eachProtocol.ustPriceImpact2) / 2, 2)) - Math.pow((1 + (eachProtocol.ustPriceImpact1 + eachProtocol.ustPriceImpact2) / 2), 2)
            const max_spread1 = (baseImpact + eachProtocol.ustPriceImpact1).toFixed(5);
            const belief_price1 = (Number(eachProtocol.ust[0].amount1) / Number(eachProtocol.ust[0].amount2)).toFixed(15);
            if (isCoin(swapAsset1)) {
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset1), Number(swapAmount1).toFixed(0)));
                msgs.push(getSwapCoinMsg(walletAddress, liquidity1Address, max_spread1, denomOfCoin(swapAsset1), swapAmount1.toFixed(0), belief_price1, coins));
            } else {
                msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset1), max_spread1, liquidity1Address, swapAmount1.toFixed(0), belief_price1));
            }
            const liquidity2Address = eachProtocol.ust[1].liquidity;
            const swapAmount2 = Number(eachProtocol.ust[0].amount2) * Number(swapAmount1) / Number(eachProtocol.ust[0].amount1) * (1 - max_spread1)
            const swapAsset2 = eachProtocol.ust[1].asset1;
            const max_spread2 = (baseImpact + eachProtocol.ustPriceImpact2).toFixed(5);
            const belief_price2 = (Number(eachProtocol.ust[1].amount1) / Number(eachProtocol.ust[1].amount2)).toFixed(15);
            if (isCoin(swapAsset1)) {
                const coins = new Coins().add(new Coin(denomOfCoin(swapAsset2), Number(swapAmount2).toFixed(0)));
                msgs.push(getSwapCoinMsg(walletAddress, liquidity2Address, max_spread2, denomOfCoin(swapAsset2), swapAmount2.toFixed(0), belief_price2, coins));
            } else {
                msgs.push(getSwapTokenMsg(walletAddress, contract_addrOfToken(swapAsset2), max_spread2, liquidity2Address, swapAmount2.toFixed(0), belief_price2));
            }
        }
    })
}

