import React, { useState, useEffect } from 'react'
import { useConnectedWallet } from '@terra-money/wallet-provider'
import SearchInput from './SearchInput'
import { defaultTokens, defaultTestnetTokens, coinInfos, mainnet_tokenInfos, testnet_tokenInfos, TokenInfo, AssetInfo, NativeInfo } from '../constant/usePairs'
import { chainID } from 'constant/constants'

interface TokenModalProps {
    id: string,
    onBlur: Function,
    visible: Boolean,
    onTokenClick: Function,
    balances: Map<string, number>
}

export default function TokenModal({ id, onBlur, visible, onTokenClick, balances }: TokenModalProps) {

    const [isStopBlur, setIsStopBlur] = useState<Boolean>(false)
    const [filterInfo, setFilterInfo] = useState<string>('')
    const connectedWallet = useConnectedWallet()
    
    const _defaultCoinInfos: Map<string, TokenInfo> = new Map()
    const _defaultTokenInfos: Map<string, TokenInfo> = new Map()
    let filteredTokenInfos: Map<string, TokenInfo> = new Map()
    let tokenInfos: Map<string, TokenInfo> = new Map()
    if (connectedWallet && connectedWallet?.network?.chainID === chainID.test) {
        defaultTestnetTokens.map(t => {
            const coinInfo = coinInfos.get(t);
            if (coinInfo) _defaultCoinInfos.set(t, coinInfo)
        })
        defaultTestnetTokens.map(t => {
            const tokenInfo = testnet_tokenInfos.get(t);
            if (tokenInfo) _defaultTokenInfos.set(t, tokenInfo)
        })
        tokenInfos = testnet_tokenInfos
    } else {
        defaultTokens.map(t => {
            const coinInfo = coinInfos.get(t);
            if (coinInfo) _defaultCoinInfos.set(t, coinInfo)
        })
        defaultTokens.map(t => {
            const tokenInfo = mainnet_tokenInfos.get(t);
            if (tokenInfo) _defaultTokenInfos.set(t, tokenInfo)
        })
        tokenInfos = mainnet_tokenInfos
    }

    const filterToken = (filterInfo: string) => {
        let _tokenInfo: TokenInfo | undefined, _filteredTokenInfos: Map<string, TokenInfo> = new Map();
        [...coinInfos.keys()].map((k) => {
            _tokenInfo = coinInfos.get(k)
            if (_tokenInfo && _tokenInfo?.symbol.toLowerCase().indexOf(filterInfo) !== -1) _filteredTokenInfos.set(k, _tokenInfo)
        });
        [...tokenInfos.keys()].map((k) => {
            _tokenInfo = tokenInfos.get(k)
            if (_tokenInfo && _tokenInfo?.symbol.toLowerCase().indexOf(filterInfo) !== -1) _filteredTokenInfos.set(k, _tokenInfo)
        });
        return _filteredTokenInfos
    }

    if (filterInfo) {
        filteredTokenInfos = filterToken(filterInfo)
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
        if ([...coinInfos.keys()].indexOf(contract_addr) !== -1) {
            const newCoinInfo: NativeInfo = {
                native_token: { denom: contract_addr }
            }
            onTokenClick(newCoinInfo)
        } else {
            const newTokenInfo: AssetInfo = {
                token: { contract_addr: contract_addr }
            }
            onTokenClick(newTokenInfo)
        }
    }
    const getTokenBalance = (k: string) => {
        const balance = balances.get(k)
        let decimals
        if ([...coinInfos.keys()].indexOf(k) !== -1) {
            decimals = coinInfos.get(k)?.decimals
        } else {
            decimals = tokenInfos.get(k)?.decimals
        }
        if (balance && decimals) return (balance / Math.pow(10, decimals)).toFixed(2)
        return 0
    }

    useEffect(() => {
        if (visible) document.getElementById(`token_modal-${id}`)?.focus({preventScroll:true});
    }, [visible])

    // console.log(filterInfo, filteredTokenInfos)

    return(
        <div className={`token-modal ${visible ? '' : 'hidden'}`} tabIndex={0} onBlur={handleBlur} id={`token_modal-${id}`} onMouseDown = {stopBlurHandler}>
            <SearchInput onChange={setFilterInfo} />
            <div className='default-tokens-box mx-4'>
                {
                    [..._defaultCoinInfos.keys()].map((k, i) => (
                        <div key={`defaultCoin-${i}`} className='inline align-center content-center mr-6 pointer' onClick={() => tokenClickHandler(k)}>
                            <img src={_defaultCoinInfos.get(k)?.icon} width='20px' height='20px' className='mr-2' />
                            <p className='font-12 my-4'>{_defaultCoinInfos.get(k)?.symbol}</p>
                        </div>
                    ))
                }
                {
                    [..._defaultTokenInfos.keys()].map((k, i) => (
                        <div key={`defaultToken-${i}`} className='inline align-center content-center mr-6 pointer' onClick={() => tokenClickHandler(k)}>
                            <img src={_defaultTokenInfos.get(k)?.icon} width='20px' height='20px' className='mr-2' />
                            <p className='font-12 my-4'>{_defaultTokenInfos.get(k)?.symbol}</p>
                        </div>
                    ))
                }
            </div>
            <hr className='token-list-hr' />
            <div className='token-list'>
                {
                    filterInfo ? [...filteredTokenInfos.keys()].map((k, i) => (
                        <div key={`coin-${i}`} className='inline align-center space-between mb-4 pointer' onClick={() => tokenClickHandler(k)}>
                            <div className='inline align-center'>
                                {/* <object data="http://stackoverflow.com/does-not-exist.png" type="image/png"> */}
                                    <img src={filteredTokenInfos.get(k)?.icon} width='24px' height='24px' className='mr-6' />
                                {/* </object> */}
                                <p className='font-14 weight-500 my-4'>{filteredTokenInfos.get(k)?.symbol}</p>
                            </div>
                            {
                                Number(getTokenBalance(k)) ? <p className='font-14 sky-color my-4'>{getTokenBalance(k)}</p>
                                : <p className='font-14 my-4'>0</p>
                            }
                        </div>
                    )) : [...coinInfos.keys()].concat([...tokenInfos.keys()]).map((k, i) => (
                        <div key={`mainnet_token-${i}`} className='inline align-center space-between mb-4 pointer' onClick={() => tokenClickHandler(k)}>
                            <div className='inline align-center'>
                                <img src={coinInfos.get(k)?.icon || tokenInfos.get(k)?.icon} width='24px' height='24px' className='mr-6' />
                                <p className='font-14 weight-500 my-4'>{coinInfos.get(k)?.symbol || tokenInfos.get(k)?.symbol}</p>
                            </div>
                            {
                                Number(getTokenBalance(k)) ? <p className='font-14 sky-color my-4'>{getTokenBalance(k)}</p>
                                : <p className='font-14 my-4'>0</p>
                            }
                        </div>
                    ))
                }
            </div>
        </div>
    )
}