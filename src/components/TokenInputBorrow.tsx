import React, { useState } from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useConnectedWallet } from '@terra-money/wallet-provider'
import TokenModal from './TokenModal'
import { AssetInfo, NativeInfo, coinInfos, mainnet_tokenInfos, testnet_tokenInfos } from 'constant/usePairs'
import { chainID } from 'constant/constants'
import { getDecimals, contract_addrOfToken} from 'utils/utils'
import CustomToolTip from './CustomToolTip';
import '../assets/css/button.css';
import arrow_down from 'assets/img/arrow_down.svg';

type tokenInputProps = {
    title: string,
    id: string,
    onTokenChange: Function,
    onAmountChange: Function,
    asset: AssetInfo | NativeInfo,
    amount: string,
    amountUsd: string,
    balances: Map<string, number>,
    fullDegenMode: boolean
}

enum token_percent {
  'PERCENT_25',
  'PERCENT_50',
  'PERCENT_75',
  'PERCENT_MAX'
}

export default function TokenInputBorrow({ title, onTokenChange, onAmountChange, id, asset, amount, amountUsd, balances, fullDegenMode }: tokenInputProps) {

  const [isShowingTokenModal, setIsShowingTokenModal] = useState<Boolean>(false)
  const connectedWallet = useConnectedWallet()
  let _asset, balance: number = 0, decimals = 6
  if (connectedWallet) decimals = getDecimals(connectedWallet.network.chainID, asset)
  if ("native_token" in asset) _asset = coinInfos.get(asset.native_token.denom)
  else {
    _asset = mainnet_tokenInfos.get(contract_addrOfToken(asset))
    if (connectedWallet?.network.chainID === chainID.test) _asset = testnet_tokenInfos.get(contract_addrOfToken(asset))
  }
  
  if (!!_asset?.contract_addr)  {
    balance = balances.get(_asset.contract_addr) || 0
    balance = balance / Math.pow(10, decimals)
  }
  
  const handleTokenButtonClick = (e: any) => {
    if (!isShowingTokenModal && !fullDegenMode) setIsShowingTokenModal(true)
  }
  
  const onBlurHandler = () => {
    setTimeout(() => {
      setIsShowingTokenModal(false)
    }, 100);
  }
  
  const onTokenClick = (asset: AssetInfo | NativeInfo) => {
    onTokenChange(asset)
    setIsShowingTokenModal(false)
  }
  
  const handleTokenAmountChange = (type: string, _amount: string) => {
    if (type === 'input') {
      for( let c of _amount ) {
        if ((c < '0' || c > '9') && c != '.') return 
      }
      if (_amount.split('.').length > 2) return
      if (_amount.length > 1 && _amount[0] == '0' && _amount[1] !== '.') _amount = _amount.slice(1)
      const fractionalPartLength =  _amount.indexOf('.') === -1 ? 0 : _amount.length - _amount.indexOf('.') - 1
      if (fractionalPartLength > decimals) _amount = _amount.slice(0, _amount.length - (fractionalPartLength - decimals))
      if (_amount === '.') _amount = '0.'
      onAmountChange(_amount)
    }
    if (type === 'percent') {
      let amount = (Number(balance) * Number(_amount) / 100).toFixed(decimals)
      while(true) {
        if (amount[amount.length - 1] === '0') amount = amount.substring(0, amount.length - 1)
        else break
      }
      onAmountChange(amount)
    }
  }

  return (
    <div className='p-relative mt-15'>
      <div className='inline align-center px-7 token-input-container-title'>
        <p className='gray-color font-12 line-height-12'>{title}</p>
        <CustomToolTip
            title={title}
            height='8px'
            color='cyan-color'
        />
      </div>
      <div className='token-input-container'>
        <div className='inline align-center' style={{height: '50px'}}>
          <button className='select-token-button' onClick={(e)=>handleTokenButtonClick(e)}>
            <img src={_asset?.icon} width={30} />
            <p className='font-17 weight-700 font-up px-2'>{_asset?.symbol}</p>
            <img className={`arrow-down ${!fullDegenMode && !!isShowingTokenModal ? 'rotate-180' : ''}`} src={arrow_down} width={15} />
          </button>
          <div className='token-balance-container'>
            {/* <div className='percent-container'>
              <button className='percent-button' onClick={() => handleTokenAmountChange('percent', '25')}>25%</button>
              <button className='percent-button' onClick={() => handleTokenAmountChange('percent', '50')}>50%</button>
              <button className='percent-button' onClick={() => handleTokenAmountChange('percent', '75')}>75%</button>
              <button className='percent-button font-up' onClick={() => handleTokenAmountChange('percent', '100')}>Max</button>
            </div> */}
            <p className='balance-amount-title'>New Balance</p>
            <p className='balance-amount'>{(Number(amount) + balance).toFixed(2) || 0}</p>
          </div>
            <TokenModal onBlur={onBlurHandler} visible={isShowingTokenModal} onTokenClick={onTokenClick} id={id} balances={balances} />
        </div>
        <div className='token-amount-container'>
          <input type='text' className='token-amount-input' placeholder='0.00000' value={amount} onChange={(e: any) => handleTokenAmountChange('input', e.target.value)} />
          <p className='token-amount-base'>~{amountUsd} UST</p>
        </div>
      </div>
    </div>
  )
}