import React, { useState } from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useConnectedWallet } from '@terra-money/wallet-provider'
import TokenModalCollateral from './TokenModalCollateral'
import { AssetInfo, NativeInfo, coinInfos, mainnet_tokenInfos, testnet_tokenInfos } from 'constant/usePairs'
import { contract_addrOfToken } from 'utils/utils'
import { bLUNA, chainID, test_bLUNA } from 'constant/constants'
import CustomToolTip from './CustomToolTip';
import '../assets/css/button.css';
import arrow_down from 'assets/img/arrow_down.svg';

export type tokenProps = {
  name: string,
  symbol: string,
  decimals: number,
  address: string
}

type tokenInputProps = {
  title: string,
  id: string,
  onTokenChange: Function,
  asset: AssetInfo | NativeInfo,
  amount: string,
  amountUsd: string,
  balances: Map<string, number>,
  onlyLuna?: boolean,
  disabled?: boolean,
  tooltip?: string
}

enum token_percent {
  'PERCENT_25',
  'PERCENT_50',
  'PERCENT_75',
  'PERCENT_MAX'
}

export default function TokenInputCollateral({ title, id, onTokenChange, asset, amount, amountUsd, balances, onlyLuna, disabled, tooltip }: tokenInputProps) {
  const [isShowingTokenModal, setIsShowingTokenModal] = useState<Boolean>(false)
  const connectedWallet = useConnectedWallet()
  let _asset, balance: number = 0
  if (disabled) amount = '0', amountUsd = '0'
  if ("native_token" in asset) _asset = coinInfos.get(asset.native_token.denom)
  else if (connectedWallet?.network.chainID === chainID.test) _asset = testnet_tokenInfos.get(asset.token.contract_addr)
  else _asset = mainnet_tokenInfos.get(contract_addrOfToken(asset))
  if (!!onlyLuna) {
    if (connectedWallet?.network.chainID === chainID.test) onTokenChange(testnet_tokenInfos.get(test_bLUNA))
    else onTokenChange(mainnet_tokenInfos.get(bLUNA))
  }
  if (!!_asset?.contract_addr)  {
    balance = balances.get(_asset.contract_addr) || 0
    if (!!balance && !!_asset?.decimals) balance = balance / Math.pow(10, _asset.decimals)
  }

  const handleTokenButtonClick = (e: any) => {
    if (disabled) return
    if (!isShowingTokenModal) setIsShowingTokenModal(true)
  }

  const onBlurHandler = () => {
    if (disabled) return
    setTimeout(() => {
      setIsShowingTokenModal(false)
    }, 100);
  }

  const onTokenClick = (asset: AssetInfo | NativeInfo) => {
    if (disabled) return
    onTokenChange(asset)
    setIsShowingTokenModal(false)
  }

  return (
    <div className={`p-relative ${disabled && `opacity-10`}`}>
      <div className='inline align-center px-7 token-input-container-title'>
        <p className='gray-color font-10 line-height-12'>{title}</p>
        <CustomToolTip
            title={tooltip ? tooltip : title}
            height='8px'
            color='cyan-color'
        />
      </div>
      <div className='token-input-container'>
        <div className='inline align-center' style={{height: '50px'}}>
          <button className='select-token-button' onClick={(e)=>handleTokenButtonClick(e)}>
            <img src={_asset?.icon} width={30} />
            <p className='font-17 weight-700 font-up px-2'>{_asset?.symbol}</p>
            <img className={`arrow-down ${!!isShowingTokenModal ? 'rotate-180' : ''}`} src={arrow_down} width={15} />
          </button>
          <div className='token-amount-container'>
            <input type='text' className='token-amount-input' placeholder='0.00000' value={amount} disabled />
            <p className='token-amount-base'>~{amountUsd} UST</p>
          </div>
          {
            !onlyLuna && 
            <TokenModalCollateral onBlur={onBlurHandler} visible={isShowingTokenModal} onTokenClick={onTokenClick} id={id} balances={balances} />
          }
        </div>
      </div>
    </div>
  )
}