import React, { useState, useEffect } from 'react'
import { useConnectedWallet } from '@terra-money/wallet-provider'
import SearchInput from './SearchInput'
import { collateralTokens, test_collateralTokens, coinInfos, mainnet_tokenInfos, testnet_tokenInfos, TokenInfo, AssetInfo, NativeInfo } from '../constant/usePairs'
import { chainID, wasAVAX } from 'constant/constants'

interface TokenModalProps {
    id: string,
    onBlur: Function,
    visible: Boolean,
    onTokenClick: Function,
    balances: Map<string, number>
}

export default function TokenModalCollateral({ id, onBlur, visible, onTokenClick, balances }: TokenModalProps) {

    const [isStopBlur, setIsStopBlur] = useState<Boolean>(false)
    const connectedWallet = useConnectedWallet()

    const _defaultCoinInfos: Map<string, TokenInfo> = new Map()
    const _defaultTokenInfos: Map<string, TokenInfo> = new Map()
    let tokenInfos: Map<string, TokenInfo> = new Map()
    if (connectedWallet && connectedWallet?.network?.chainID === chainID.test) {
        test_collateralTokens.map(t => {
            const coinInfo = coinInfos.get(t);
            if (coinInfo) _defaultCoinInfos.set(t, coinInfo)
        })
        test_collateralTokens.map(t => {
            const tokenInfo = testnet_tokenInfos.get(t);
            if (tokenInfo) _defaultTokenInfos.set(t, tokenInfo)
        })
    } else {
        collateralTokens.map(t => {
            const coinInfo = coinInfos.get(t);
            if (coinInfo) _defaultCoinInfos.set(t, coinInfo)
        })
        collateralTokens.map(t => {
            if (t === wasAVAX) return
            const tokenInfo = mainnet_tokenInfos.get(t);
            if (tokenInfo) _defaultTokenInfos.set(t, tokenInfo)
        })
    }

    const handleBlur = () => {
        if (isStopBlur) setIsStopBlur(false)
        else onBlur();
    }

    const stopBlurHandler = () => {
        setIsStopBlur(true)
        setTimeout(() => {
            setIsStopBlur(false)
        }, 500);
    }

    const tokenClickHandler = (contract_addr: string) => {
        const newTokenInfo: AssetInfo = {
            token: { contract_addr: contract_addr }
        }
        onTokenClick(newTokenInfo)
    }
    const coinClickHandler = (contract_addr: string) => {
        const newCoinInfo: NativeInfo = {
            native_token: { denom: contract_addr }
        }
        onTokenClick(newCoinInfo)
    }
    const getTokenBalance = (type: string, k: string) => {
        const balance = balances.get(k)
        let decimals
        if (type === 'coin') decimals = coinInfos.get(k)?.decimals
        else if (type === 'token') decimals = tokenInfos.get(k)?.decimals
        
        if (balance && decimals) return (balance / Math.pow(10, decimals)).toFixed(2)
        return 0
    }

    useEffect(() => {
        if (visible) document.getElementById(`token_modal-${id}`)?.focus({preventScroll:true});
    }, [visible])

    return(
        <div className={`token-modal ${visible ? '' : 'hidden'}`} tabIndex={0} onBlur={handleBlur} id={`token_modal-${id}`} onMouseDown = {stopBlurHandler}>
            <div className='token-list'>
                {
                    [..._defaultCoinInfos.keys()].map((k, i) => (
                        <div key={`coin-${i}`} className='inline align-center space-between mb-4 pointer' onClick={() => coinClickHandler(k)}>
                            <div className='inline align-center'>
                                <img src={_defaultCoinInfos.get(k)?.icon} width='24px' height='24px' className='mr-6' />
                                <p className='font-14 weight-500 my-4'>{_defaultCoinInfos.get(k)?.symbol}</p>
                            </div>
                            {
                                Number(getTokenBalance('coin', k)) ? <p className='font-14 sky-color my-4'>{getTokenBalance('coin', k)}</p>
                                : <p className='font-14 my-4'>0</p>
                            }
                        </div>
                    ))
                }
                {
                    [..._defaultTokenInfos.keys()].map((k, i) => (
                        <div key={`mainnet_token-${i}`} className='inline align-center space-between mb-4 pointer' onClick={() => tokenClickHandler(k)}>
                            <div className='inline align-center'>
                                <img src={_defaultTokenInfos.get(k)?.icon} width='24px' height='24px' className='mr-6' />
                                <p className='font-14 my-4'>{_defaultTokenInfos.get(k)?.symbol}</p>
                            </div>
                            {
                                Number(getTokenBalance('token', k)) ? <p className='font-14 sky-color my-4'>{getTokenBalance('token', k)}</p>
                                : <p className='font-14 my-4'>0</p>
                            }
                        </div>
                    ))
                }
            </div>
        </div>
    )
}