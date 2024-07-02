import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useRecoilValue, useRecoilState } from 'recoil'
import {  useWallet, ConnectType, Timeout, useConnectedWallet, useLCDClient, UserDenied, CreateTxFailed, TxFailed, TxUnspecifiedError } from '@terra-money/wallet-provider'
import { MsgExecuteContract, Coin, Coins, LCDClient, MsgSend } from '@terra-money/terra.js'
import Switch from '@mui/material/Switch'
import Slider from '@mui/material/Slider'
import { alpha, styled } from '@mui/material/styles';
import { pink } from '@mui/material/colors';
import Snackbar from '@mui/material/Snackbar';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';

import ConnectList from './header/ConnectList';
import TokenInput from './TokenInput'
import TokenInputCollateral from './TokenInputCollateral'
import TokenInputFullDegenMode from './TokenInputFullDegenMode'
import TokenInputBorrow from './TokenInputBorrow'
import CustomToolTip from './CustomToolTip'
import Loading from './Loading'
import { CollateralDetail, BorrowDetail, SwapLiquiditiesDetail, Transaction, PriceImpacts } from 'constant/interface'
import { chainID, UUSD, bLUNA, test_bLUNA, ULUNA, BORROWMAX, defaultSwapCoin, BORROWRATELIMIT, ORACLE, test_ORACLE, treasuryWallet, defaultPriceImpact } from 'constant/constants'
import { AssetInfo, NativeInfo, defaultSwapAssetInfo, defaultCollateralAssetInfo, defaultBorrowAssetInfo, TokenInfo } from 'constant/usePairs'
import { addSwapMsg, getBalancesOfWallet, getSwapLiquidities, isCoin, denomOfCoin, getDecimals, addProvideMsg, addSendMsg,
  addBorrowMsg, getExpectReverseSwapAmount, calculateExpectSwapAmount, calculateExpectReverseSwapAmount, getPoolDetailQuery, getDefaultAssets, contract_addrOfToken, calculateFullDegenData, borrowAssetAsFullDegenMode, getSymbolWithAddress, getPath,
  getSymbol, configMsgs,
  calculateNormalData} from 'utils/utils'
import { WALLET_NOT_CONNECTED } from 'constant/constants'
import vector from 'assets/img/vector.svg'
import save_money from 'assets/img/save_money_dark.svg'
import 'assets/css/button.css'
import { swapAssetState } from 'data/swapAsset'
import { rawPairsQuery } from 'data/contract/contract';
import Wait from './Wait/Wait';
import { collateralAssetState } from 'data/collateralAsset';
import { borrowAssetState } from 'data/borrowAsset';
import { fulldegenModeResponseState } from 'data/fulldegenModeResponse'
import { normalModeResponseState } from 'data/normalModeResponse'
import { repayResponseState } from 'data/repayResponse'
import {terraSwapPairsQuery} from "../data/contract/normalize"
// import useLCDClient from 'graphql/useLCDClient'

interface Response_DefaultAssets {
  swapAsset: AssetInfo | NativeInfo,
  collateralAsset: AssetInfo | NativeInfo,
  borrowAsset: AssetInfo | NativeInfo
}

interface propInterface {
  collaterals: CollateralDetail[],
  borrowData: BorrowDetail,
  isFetched: boolean,
  onChangeCollateralAmountUsd: Function,
  onChangeBorrowAmountUsd: Function,
  onReload: Function,
  onAddTransaction: Function,
  transactions: Transaction[],
  onChangeBorrowAsset: Function,
  onChangeFullDegenMode: Function
}

interface sliderResponseInferface {
  count: number,
  swapAmountUsd: string,
  depositAmount: string,
  depositAmountUsd: string,
  borrowAmount: string,
  borrowAmountUsd: string,
  expectSlippage?: number,
  priceImpact: SlippagePriceImpact
}

const CustomSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase, & .MuiButtonBase-root': {
    position: 'absolute !important',
    top: '9px',
    left : '9px',
    color: '#888',
    padding: '0px'
  },
  '& .MuiSwitch-track': {
    backgroundColor: '#fff',
    opacity: 0.9
  },
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#FF9AD7',
    '&:hover': {
      backgroundColor: alpha('#FF9AD7', theme.palette.action.hoverOpacity),
    },
  },
  '& .Mui-checked + .MuiSwitch-track': {
    backgroundColor: '#C83E93 !important',
    opacity: 1
  }
}));

const CancelButton = styled(Button)(({ theme }) => ({
  '&': {
    backgroundColor: '#C83E93 !important'
  }
}))

const ConfirmButton = styled(Button)(({ theme }) => ({
  '&': {
    backgroundColor: '#32FE9AA0 !important'
  },
  '&.Mui-disabled': {
    backgroundColor: '#32FE9A20 !important',
    color: '#ffffff20 !important'
  }
}))

const marks = [
  {
    value: 75,
    label: 'Max Limit',
  }
];

const IOSSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#3880ff' : '#3880ff',
  height: 2,
  padding: '15px 0',
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#333',
    '&:focus, &:hover, &.Mui-active': {
      opacity: 0.3
    },
  },
  '& .MuiSlider-valueLabel': {
    fontSize: 10,
    fontWeight: '500',
    top: -6,
    margin: 0,
    backgroundColor: '#32fe9a',
    color: theme.palette.text.primary,
    '&:before': {
      backgroundColor: '#32fe9a'
    },
    '& *': {
      background: 'transparent',
      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
    },
  },
  '& .MuiSlider-track': {
    border: 'none',
    height: '6px',
    backgroundColor: '#32fe9a'
  },
  '& .MuiSlider-rail': {
    opacity: 0.5,
    height: '6px',
    backgroundColor: '#262525',
  },
  '& .MuiSlider-mark': {
    backgroundColor: '#bfbfbf',
    height: 8,
    width: 1,
    '&.MuiSlider-markActive': {
      opacity: 1,
      backgroundColor: 'currentColor',
    },
  },
  '& .MuiSlider-markLabel': {
    color: '#919191'
  }
}));

export type PostError =
| UserDenied
| CreateTxFailed
| TxFailed
| TxUnspecifiedError

type SlippagePriceImpact = {
  collateral: {
    path: string
    impact: number | undefined
  }
  borrow: {
    path: string
    impact: number | undefined
  }
}

export default function BorrowContainer({collaterals, borrowData, isFetched, onChangeCollateralAmountUsd, 
  onChangeBorrowAmountUsd, onReload, onAddTransaction, transactions, onChangeBorrowAsset, onChangeFullDegenMode}: propInterface) {

  const { status } = useWallet()
  if (!window.localStorage['terra']) window.localStorage['terra'] = '{}'
  const initSlippage = 5

  const lcd = useLCDClient()
  // const lcd = useLCDClient()?.terra
  const connectedWallet = useConnectedWallet()
  const [swapAsset, setSwapAsset] = useRecoilState<AssetInfo | NativeInfo>(swapAssetState);
  const [slippage, setSlippage] = useState<number>(initSlippage)
  const [swapAmount, setSwapAmount] = useState<string>('')
  const [swapAmountUsd, setSwapAmountUsd] = useState<string>('')
  const [collateralAsset, setCollateralAsset] = useRecoilState<AssetInfo | NativeInfo>(collateralAssetState)
  const [borrowAsset, setBorrowAsset] = useRecoilState<AssetInfo | NativeInfo>(borrowAssetState)
  const [collateralAmount, setCollateralAmount] = useState<string>('')
  const [collateralAmountUsd, setCollateralAmountUsd] = useState<string>('')
  const [borrowAmount, setBorrowAmount] = useState<string>('')
  const [borrowAmountUsd, setBorrowAmountUsd] = useState<string>('')
  const [fullDegenMode, setFullDegenMode] = useState<boolean>(false)
  const [percent, setPercent] = useState<number>(0)
  const [sliderTimer, setSliderTimer] = useState<any>()
  const [borrowAmountTimer, setBorrowAmountTimer] = useState<any>()
  const [loopHole, setLoopHole] = useState<number>(0)
  const [insufficient, setInsufficient] = useState<boolean>(false)
  const [insufficientPercent, setInsufficientPercent] = useState<boolean>(false)
  const [liquidityError, setLiquidityError] = useState<string>("")
  const [priceExpectError, setPriceExpectError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [toastOpen, setToastOpen] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [fdmPopup, setFDMPopup] = useState<boolean>(false)
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false)
  const [priceImpact, setPriceImpact] = useState<SlippagePriceImpact>(defaultPriceImpact)
  const [collateralPriceImpacts, setCollateralPriceImpacts] = useState<PriceImpacts>()
  const [borrowPriceImpacts, setBorrowPriceImpacts] = useState<PriceImpacts>()
  const [swapLimitError, setSwapLimitError] = useState<string[]>()
  const [borrowLimitError, setBorrowLimitError] = useState<string[]>()
  const [fullDegenLowAmountAlert, setFullDegenLowAmountAlert] = useState(false)
  const [normalModeResponse, setNormalModeResponse] = useRecoilState<any>(normalModeResponseState);
  const [normalModeError, setNormalModeError] = useState<PostError>()
  const [fullDegenModeResponse, setFullDegenModeResponse] = useRecoilState<any>(fulldegenModeResponseState);
  const [fullDegenModeError, setFullDegenModeError] = useState<PostError>()
  const [details, setDetails] = useState<any>()
  const repayResponse = useRecoilValue(repayResponseState)
  const terraswapPairs = useRecoilValue(terraSwapPairsQuery)

  const terraswapPairsInChain = lcd.config.chainID === chainID.main ? terraswapPairs?.mainnet : terraswapPairs?.testnet

  const rawPairs = useRecoilValue(rawPairsQuery);

  let totalAmountUsd = 0
  let currentCollateralAmount = 0
  collaterals.map(c => {
      if (c.address === contract_addrOfToken(collateralAsset)) currentCollateralAmount = Number(c.amount)
      totalAmountUsd += Number(c.amountUST)
  })

  // calculate percent
  const calculatePercent = (_collateralAmountUsd, _borrowAmountUsd) => {
    if (_collateralAmountUsd === '-' || _borrowAmountUsd === '-') {
      _collateralAmountUsd = 0;
      _borrowAmountUsd = 0;
    }
    if (totalAmountUsd) return Number(((Number(borrowData.borrow_amount) + Number(_borrowAmountUsd)) / (Number(borrowData.borrow_limit) + Number(_collateralAmountUsd) * BORROWRATELIMIT) * 100).toFixed(2))
    else if (Number(_collateralAmountUsd) > 0) return Number((Number(_borrowAmountUsd) / (Number(_collateralAmountUsd) * BORROWRATELIMIT) * 100).toFixed(2))
    else return 0
  }

  useEffect(() => {
    if (!lcd || !borrowData || !Number(borrowData.borrow_amount) || !Number(totalAmountUsd)) return
    if (loading) return
    else {
      setPercent(calculatePercent(collateralAmountUsd, borrowAmountUsd))
    }
  }, [lcd, totalAmountUsd, borrowData])

  const { data: balancesData } = useQuery(
    ['balances', connectedWallet, fullDegenModeResponse, normalModeResponse, repayResponse],
    () => {
      if (connectedWallet) return getBalancesOfWallet(lcd, connectedWallet.network.chainID, connectedWallet.walletAddress)
      else return undefined
    },
    {refetchInterval: 30000}
  )

  let balances = balancesData || new Map()
    
  useEffect(() => {
    if (connectedWallet) {
      const defaultAssets: Response_DefaultAssets = getDefaultAssets(connectedWallet.network.chainID)
      setSwapAsset(defaultAssets.swapAsset)
      setCollateralAsset(defaultAssets.collateralAsset)
      setBorrowAsset(defaultAssets.borrowAsset)
    } else {
      setCollateralAsset(defaultCollateralAssetInfo)
      setBorrowAsset(defaultBorrowAssetInfo)
      setSwapAsset(defaultSwapAssetInfo)
    }
  }, [connectedWallet, lcd])

  useEffect(() => {
    checkBalance(swapAsset, swapAmount)
    if (fullDegenMode) {
      fullDegenModeFunc(swapAsset, swapAmount, collateralAsset, borrowAsset, percent)
      return
    }
    if (Number(swapAmount) === 0) {
      setSwapAmountUsd('0')
      return
    }
    setTimeout(() => {
      setLoading(true);
      (async () => {
        await normalModeFunc(swapAsset, swapAmount, collateralAsset, borrowAsset, percent, undefined)
        setLoading(false)
      })()
    }, 0)
  }, [lcd, swapAsset, collateralAsset])

  useEffect(() => {
    if (Number(percent) > BORROWMAX) {
      if (!insufficientPercent) setInsufficientPercent(true)
    } else {
      if (insufficientPercent) setInsufficientPercent(false)
    }
  }, [percent])

  const handleSlippage= (_slippage: number) => {
    if (!_slippage) return setSlippage(0)
    if (_slippage >= 50) _slippage = 49
    setSlippage(_slippage)
  }

  const handleAssetToken = (asset: AssetInfo | NativeInfo) => {
    setSwapAsset(asset)
  }

  const handleBorrowToken = (asset: AssetInfo | NativeInfo) => {
    onChangeBorrowAsset(asset)
    setBorrowAsset(asset)
    if (Number(borrowAmountUsd) === 0) {
      setLoading(false)
      return
    }
    if(fullDegenMode) {
      fullDegenModeFunc(swapAsset, swapAmount, collateralAsset, asset, percent)
    } else {
      setLoading(true);
      (async () => {
        await normalModeFunc(swapAsset, swapAmount, collateralAsset, asset, percent, undefined)
        setLoading(false)
      })()
    }
  }

  const fullDegenModeFunc = async (swapAsset: AssetInfo | NativeInfo, swapAmount: string, collateralAsset: AssetInfo | NativeInfo, borrowAsset:  AssetInfo | NativeInfo, percent: number) => {
    const timer = setTimeout(() => {
      setLoading(true);
      calculateFullDegenData(rawPairs, terraswapPairsInChain, lcd, lcd.config.chainID, swapAsset, (Number(swapAmount) * Math.pow(10, getDecimals(lcd.config.chainID, swapAsset))).toFixed(0), percent.toFixed(6), slippage, collaterals, borrowData).then((res: sliderResponseInferface) => {
        // console.log(res)
        // console.log(res.depositAmountUsd, res.borrowAmountUsd)
        // console.log(percent)
        if (res.count === 1) setFullDegenLowAmountAlert(true)
        setPriceImpact(res.priceImpact)
        setPercent(percent)
        setLoopHole(res.count)
        setSwapAmountUsd((Number(res.swapAmountUsd) / Math.pow(10, 6)).toFixed(6))
        setBorrowAmount((Number(res.borrowAmount) / Math.pow(10, 6)).toFixed(6))
        setBorrowAmountUsd((Number(res.borrowAmountUsd) / Math.pow(10, 6)).toFixed(6))
        onChangeBorrowAmountUsd((Number(res.borrowAmountUsd) / Math.pow(10, 6)).toFixed(6))
        setCollateralAmount((Number(res.depositAmount) / Math.pow(10, 6)).toFixed(6))
        setCollateralAmountUsd((Number(res.depositAmountUsd) / Math.pow(10, 6)).toFixed(6))
        onChangeCollateralAmountUsd((Number(res.depositAmountUsd) / Math.pow(10, 6)).toFixed(6))
        if (totalAmountUsd) setPercent(Number(((Number(borrowData.borrow_amount) + Number(res.borrowAmountUsd) / Math.pow(10, 6)) / (Number(borrowData.borrow_limit) + Number(res.depositAmountUsd) / Math.pow(10, 6) * Number(borrowData.borrow_limit) / Number(totalAmountUsd)) * 100).toFixed(2)))
        else setPercent(Number((Number(res.borrowAmountUsd) / (Number(res.depositAmountUsd) * 0.8) * 100).toFixed(2)))
        setLoading(false)
      })
    }, 700)
    setSliderTimer(timer)
  }

  const normalModeFunc = async (swapAsset: AssetInfo | NativeInfo, swapAmount: string, collateralAsset: AssetInfo | NativeInfo, borrowAsset: AssetInfo | NativeInfo, percent?: number, borrowAmount?: string) => {
    const _percent = percent === undefined ? undefined : percent || BORROWMAX
    const _swapAmount = (Math.floor(Number(swapAmount) * Math.pow(10, getDecimals(lcd.config.chainID, swapAsset)))).toString()
    const _borrowAmount = borrowAmount ? (Math.floor(Number(borrowAmount) * Math.pow(10, getDecimals(lcd.config.chainID, borrowAsset)))).toString() : ''
    const res = await calculateNormalData(rawPairs, terraswapPairsInChain, lcd, lcd.config.chainID, swapAsset, _swapAmount, _percent, slippage, collateralAsset, borrowAsset, _borrowAmount, collaterals, borrowData)
    console.log(res)
    setDetails(res)
    const config = res.config;
    setSwapAmountUsd(config.swapAmountUsd);
    setCollateralAmount(config.collateralAmount);
    if (!config.swapError && !config.borrowError) {
      onChangeCollateralAmountUsd(config.collateralAmountUsd);
      onChangeBorrowAmountUsd(config.borrowAmountUsd);
      setPercent(config.percent);
    } else {
      onChangeCollateralAmountUsd('0');
      onChangeBorrowAmountUsd('0');
      setPercent(calculatePercent(0,0));
    }
    setCollateralAmountUsd(config.collateralAmountUsd);
    setBorrowAmount(config.borrowAmount);
    setBorrowAmountUsd(config.borrowAmountUsd);
    setCollateralPriceImpacts(config.collateralPriceImpact);
    setBorrowPriceImpacts(config.borrowPriceImpact);
    if (config.swapError) {
      switch (config.swapError.type) {
        case "overflow":
          setSwapLimitError(['Liquidities Swap limit', config.swapError.data]);
      }
    } else {
      setSwapLimitError(undefined);
    }
    if (config.borrowError) {
      switch (config.borrowError.type) {
        case "overflow":
          setBorrowLimitError(['Liquidities Swap limit', config.borrowError.data]);
      }
    } else {
      setBorrowLimitError(undefined);
    }
  }

  const handleCollateralToken = (asset: AssetInfo | NativeInfo) => {
    setCollateralAsset(asset)
  }

  const checkBalance = (swapAsset: AssetInfo | NativeInfo, amount: string)  => {
    const currentSwapAsset = isCoin(swapAsset) ? denomOfCoin(swapAsset) : contract_addrOfToken(swapAsset)
    const currentBalance = balances.get(currentSwapAsset) || 0
    if (Number(amount) * Math.pow(10, getDecimals(lcd.config.chainID, swapAsset)) > currentBalance) {
      if (!insufficient) setInsufficient(true)
    }
    else {
      if (insufficient) setInsufficient(false)
    }
  }

  const handleAssetAmount = (amount: string) => {
    if (loading) return;
    clearTimeout(sliderTimer);
    if (Number(amount) === 0) {
      setSwapAmount(amount);
      setBorrowAmount("0");
      setCollateralAmount("0");
      setSwapAmountUsd("0");
      setCollateralAmountUsd("0");
      setBorrowAmountUsd("0");
      onChangeBorrowAmountUsd("0");
      onChangeCollateralAmountUsd("0");
      setLoopHole(0)
      setPriceImpact(defaultPriceImpact)
      setCollateralPriceImpacts(undefined)
      setBorrowPriceImpacts(undefined)
      setSwapLimitError(undefined);
      setBorrowLimitError(undefined);
      if (borrowData && Number(borrowData.borrow_limit) > 0) setPercent(Number((Number(borrowData.borrow_amount) / Number(borrowData.borrow_limit) * 100).toFixed(2)))
      else setPercent(0)
      return
    }
    setSwapAmount(amount)
    let _percent = BORROWMAX
    checkBalance(swapAsset, amount)
    if (sliderTimer) clearTimeout(sliderTimer)
    if (fullDegenMode) {
        fullDegenModeFunc(swapAsset, amount, collateralAsset, borrowAsset, _percent)
    }
    else {
      const _timer = setTimeout(() => {
        setLoading(true);
        if (Number(amount) > 0) setLoopHole(1);
        else setLoopHole(0);
        (async () => {
          await normalModeFunc(swapAsset, amount, collateralAsset, borrowAsset, _percent, '')
          setLoading(false)
        })()
      }, 1000)
      setSliderTimer(_timer)
    }
  }

  const handleBorrowAmount = (amount: string) => {
    if (fullDegenMode) return;
    setBorrowAmount(amount)
    if (borrowAmountTimer) clearTimeout(borrowAmountTimer)
    if (amount === '' || Number(amount) === 0) {
      setBorrowAmountTimer(undefined)
      setBorrowAmountUsd('0')
      if (fullDegenMode) {
        if (totalAmountUsd) setPercent(Number((Number(borrowData.borrow_amount) / (Number(borrowData.borrow_limit) + Number(collateralAmountUsd) * Number(borrowData.borrow_limit) / Number(totalAmountUsd)) * 100).toFixed(2)))
        else setPercent(0)
      } else {
        if (totalAmountUsd) setPercent(Number((Number(borrowData.borrow_amount) / (Number(borrowData.borrow_limit) + Number(swapAmountUsd) * Number(borrowData.borrow_limit) / Number(totalAmountUsd)) * 100).toFixed(2)))
        else setPercent(0)
      }
      onChangeBorrowAmountUsd('0')
      setBorrowPriceImpacts(undefined);
      setBorrowLimitError(undefined);
      return
    }
    const _timer = setTimeout(() => {
      setLoading(true);
      (async () => {
        await normalModeFunc(swapAsset, swapAmount, collateralAsset, borrowAsset, undefined, amount)
        setLoading(false);
      })()
    }, 1000);
    setBorrowAmountTimer(_timer)
  }

  const handleBorrow = async () => {
    if (connectedWallet && !fullDegenMode) {
      setLoading(true);
      (async () => {
        let msgs: any = [];
        configMsgs(msgs, details, lcd, connectedWallet.walletAddress, slippage, collateralAsset);

        if (msgs.length) {
          try {
            const response = await connectedWallet.post({
              msgs: msgs
            })
            setNormalModeResponse(response);
            setSwapAmount("0.00");
            setSwapAmountUsd("0.00");
            setCollateralAmount("0.00");
            setCollateralAmountUsd("0.00");
            setBorrowAmount("0.00");
            setBorrowAmountUsd("0.00");
            onChangeCollateralAmountUsd("0.00");
            onChangeBorrowAmountUsd("0.00");
            setCollateralPriceImpacts(undefined);
            setBorrowPriceImpacts(undefined);
          } catch (error) {
            setNormalModeError(error as Error);
          }
        }
        setLoading(false);
      })();
    }
    if (connectedWallet && fullDegenMode) {
      setLoading(true);
      (async () => {
        await borrowAssetAsFullDegenMode(rawPairs, terraswapPairsInChain, lcd, connectedWallet.network.chainID, connectedWallet.walletAddress, (Math.floor(Number(swapAmount) * Math.pow(10, 6))).toString(), swapAsset, percent.toString(), loopHole, slippage, collaterals, borrowData)
        .then(async (msgs: MsgExecuteContract[]) => {
          try {
            const response = await connectedWallet.post({
              msgs: msgs
            })
            console.log(response)
            setFullDegenModeResponse(response);
            setSwapAmount("0.00");
            setSwapAmountUsd("0.00");
            setBorrowAmount("0.00");
            setBorrowAmountUsd("0.00");
            setCollateralAmount("0.00");
            setCollateralAmountUsd("0.00");
            onChangeBorrowAmountUsd("0.00");
            onChangeCollateralAmountUsd("0.00");
          } catch (error) {
            setFullDegenModeError(error as Error);
          }
          setLoading(false);
        })
      })();
    }
  }

  const handleFullDegenMode = (e: any) => {
    if (fullDegenMode) {
      setFullDegenMode(!fullDegenMode)
      onChangeFullDegenMode(0)
      setLoading(true);
      onChangeBorrowAsset(borrowAsset);
      if (!Number(swapAmount)) {
        setLoading(false)
        setLoopHole(0);
        setCollateralAmount("0.00");
        setCollateralAmountUsd("0.00");
        setBorrowAmount("0.00");
        setBorrowAmountUsd("0.00");
        setPercent(calculatePercent(0,0));
        onChangeCollateralAmountUsd("0.00");
        onChangeBorrowAmountUsd("0.00");
        setBorrowPriceImpacts(undefined);
        setCollateralPriceImpacts(undefined);
        setBorrowLimitError(undefined);
        setSwapLimitError(undefined);
        return
      }
      (async () => {
        setLoopHole(1);
        await normalModeFunc(swapAsset, swapAmount, collateralAsset, borrowAsset, percent, undefined)
        setLoading(false)
      })()
    } else {
      setFDMPopup(true)
    }
  }

  const acceptFullDegenMode = () => {
    setFDMPopup(false)
    setFullDegenMode(!fullDegenMode)
    onChangeFullDegenMode(1)
    setAcceptTerms(false)
    setLoading(true);
    onChangeBorrowAsset({token: {contract_addr: bLUNA}})
    let _newPercent = BORROWMAX;
    setPercent(_newPercent);
    setPriceImpact(defaultPriceImpact);
    (async () => {
      await calculateFullDegenData(rawPairs, terraswapPairs, lcd, lcd.config.chainID, swapAsset, (Number(swapAmount) * Math.pow(10, 6)).toFixed(0), _newPercent.toString(), slippage, collaterals, borrowData).then((res: sliderResponseInferface) => {
        // console.log(res, swapAmountUsd)
        if (res.count === 1) setFullDegenLowAmountAlert(true)
        setPriceImpact(res.priceImpact)
        setLoopHole(res.count)
        setBorrowAmount((Number(res.borrowAmount) / Math.pow(10, 6)).toFixed(6))
        setBorrowAmountUsd((Number(res.borrowAmountUsd) / Math.pow(10, 6)).toFixed(6))
        setCollateralAmount((Number(res.depositAmount) / Math.pow(10, 6)).toFixed(6))
        setCollateralAmountUsd((Number(res.depositAmountUsd) / Math.pow(10, 6)).toFixed(6))
        onChangeCollateralAmountUsd((Number(res.depositAmountUsd) / Math.pow(10, 6)).toFixed(6))
        onChangeBorrowAmountUsd((Number(res.borrowAmountUsd) / Math.pow(10, 6)).toFixed(6))
        if(totalAmountUsd) setPercent(Number(((Number(borrowData.borrow_amount) + Number(res.borrowAmountUsd) / Math.pow(10, 6)) / (Number(borrowData.borrow_limit) + Number(res.depositAmountUsd) / Math.pow(10, 6) * Number(borrowData.borrow_limit) / Number(totalAmountUsd)) * 100).toFixed(2)))
        else if (Number(res.depositAmountUsd) > 0) {
          setPercent(Number((Number(res.borrowAmountUsd) / (Number(res.depositAmountUsd) * 0.8) * 100).toFixed(2)))
        } else (setPercent(_newPercent))
      })
      setLoading(false)
    })()
  }

  const handleAcceptTerms = () => {
    setAcceptTerms(!acceptTerms);
  }

  const _fdmPopupClose = () => {
    setFDMPopup(false)
    setAcceptTerms(false)
    // onChangeBorrowAsset()
  }

  const handleSlider = async (_newPercent: number) => {
    // if (!borrowLiquidities.length) return
    let _borrowAmountUsd: string
    if (Number(_newPercent) > BORROWMAX) _newPercent = BORROWMAX
    let percentMinFullDegenMode = 0
    let percentMinNormalMode = 0
    if (totalAmountUsd) {
      percentMinFullDegenMode = Number((Number(borrowData.borrow_amount) * 100 / (Number(borrowData.borrow_limit) + Number(swapAmountUsd) * Number(borrowData.borrow_limit) / Number(totalAmountUsd))).toFixed(2)) || 0
      percentMinNormalMode = Number((Number(borrowData.borrow_amount) * 100 / (Number(borrowData.borrow_limit) + Number(swapAmountUsd) * Number(borrowData.borrow_limit) / Number(totalAmountUsd))).toFixed(2)) || 0
    }
    // console.log(percentMinNormalMode)
    if (fullDegenMode && _newPercent <= percentMinFullDegenMode) {
      setPercent(percentMinFullDegenMode)
      onChangeBorrowAmountUsd('0')
    }
    else if (!fullDegenMode && _newPercent <= percentMinNormalMode) {
      setPercent(percentMinNormalMode)
      setBorrowAmount('0')
      setBorrowAmountUsd('0')
      onChangeBorrowAmountUsd('0')
      setBorrowPriceImpacts(undefined);
      setLoopHole(0)
      clearTimeout(sliderTimer)
      return
    }
    else {
      setPercent(_newPercent)
    }
    if (sliderTimer) clearTimeout(sliderTimer)
    if (!fullDegenMode) {
      const timer2 = setTimeout(() => {
        setLoading(true);
        (async () => {
          await normalModeFunc(swapAsset, swapAmount, collateralAsset, borrowAsset, _newPercent, '')
          setLoading(false)
        })()
      }, 700)
      setSliderTimer(timer2)
    } else {
      const timer2 = setTimeout(() => {
        setLoading(true);
        (async () => {
          await calculateFullDegenData(rawPairs, terraswapPairs, lcd, lcd.config.chainID, swapAsset, (Number(swapAmount) * Math.pow(10, 6)).toFixed(6), _newPercent.toFixed(6), slippage, collaterals, borrowData).then((res: sliderResponseInferface) => {
            // console.log(res, swapAmountUsd)
            if (res.count === 1) setFullDegenLowAmountAlert(true)
            setPriceImpact(res.priceImpact)
            setLoopHole(res.count)
            setBorrowAmount((Number(res.borrowAmount) / Math.pow(10, 6)).toFixed(6))
            setBorrowAmountUsd((Number(res.borrowAmountUsd) / Math.pow(10, 6)).toFixed(6))
            setCollateralAmount((Number(res.depositAmount) / Math.pow(10, 6)).toFixed(6))
            setCollateralAmountUsd((Number(res.depositAmountUsd) / Math.pow(10, 6)).toFixed(6))
            onChangeCollateralAmountUsd((Number(res.depositAmountUsd) / Math.pow(10, 6)).toFixed(6))
            onChangeBorrowAmountUsd((Number(res.borrowAmountUsd) / Math.pow(10, 6)).toFixed(6))
            if (totalAmountUsd) setPercent(Number(((Number(borrowData.borrow_amount) + Number(res.borrowAmountUsd) / Math.pow(10, 6)) / (Number(borrowData.borrow_limit) + Number(res.depositAmountUsd) / Math.pow(10, 6) * 0.8) * 100).toFixed(2)))
            else if (Number(res.depositAmountUsd) > 0) {setPercent(Number((Number(res.borrowAmountUsd) / (Number(res.depositAmountUsd) * 0.8) * 100).toFixed(2))) }
            else {
              setPercent(_newPercent)
            }
          })
          setLoading(false)
        })()
      }, 700)
      setSliderTimer(timer2)
    }
  }

  const handleToastClose = () => {
      setToastOpen(false)
  }

  const openModal = () => {
    setIsOpen(true)
  }

  function _handleClose () {
    setIsOpen(false)
  }

  const renderButton = () => {
    if (status === WALLET_NOT_CONNECTED) {
      return (
        <button className='swap-button' onClick={openModal}>
          <span className='font-14'>CONNECT WALLET</span>
        </button>
      )
    } else if (insufficient) {
      return (
        <button className='swap-button' onClick={handleBorrow} disabled>
          <img className='save-money-img' src={save_money} />
          <span className='font-14'>NOT ENOUGH {getSymbol(lcd.config.chainID, swapAsset)}</span>
        </button>
      )
    } else if (insufficientPercent) {
      return (
        <button className='swap-button' onClick={handleBorrow} disabled>
          <img className='save-money-img' src={save_money} />
          <span className='font-14'>INVALID PERCENT</span>
        </button>
      )
    } else if (swapLimitError || borrowLimitError) {
      return (
        <button className='swap-button' onClick={handleBorrow} disabled>
          <img className='save-money-img' src={save_money} />
          <span className='font-14'>NOT ENOUGH LIQUIDITY</span>
        </button>
      )
    } else {
      return (
        <button className='swap-button' onClick={handleBorrow}>
          <img className='save-money-img' src={save_money} />
          <span>SWAP</span>
        </button>
      )
    }
  }

  const closeNormalModeResponse = () => {
    if (lcd.config.chainID === chainID.main) {
      let _time = new Date()
      const transaction = {
        mode: 'normal',
        time: `${_time.getHours()}:${_time.getMinutes()}:${_time.getSeconds()}`,
        txhash: normalModeResponse.result.txhash,
        link: `https://finder.terra.money/tx/${normalModeResponse.result.txhash}`
      }
      onAddTransaction(transaction)
      let transactions: any = localStorage.getItem('terra_borrow_transactions')
      if (transactions) transactions = JSON.parse(transactions)
      else transactions = {
        'mainnet': [],
        'testnet': []
      }
      transactions.mainnet.push(transaction)
      localStorage.setItem('terra_borrow_transactions', JSON.stringify(transactions));
    } else {
      let _time = new Date()
      const transaction = {
        mode: 'normal',
        time: `${_time.getHours()}:${_time.getMinutes()}:${_time.getSeconds()}`,
        txhash: normalModeResponse.result.txhash,
        link: `https://finder.terra.money/testnet/tx/${normalModeResponse.result.txhash}`
      }
      onAddTransaction(transaction)
      let transactions: any = localStorage.getItem('terra_borrow_transactions')
      if (transactions) transactions = JSON.parse(transactions)
      else transactions = {
        'mainnet': [],
        'testnet': []
      }
      transactions.testnet.push(transaction)
      localStorage.setItem('terra_borrow_transactions', JSON.stringify(transactions));
    }
    // getBalancesOfWallet(lcd, connectedWallet.network.chainID, connectedWallet.walletAddress)
    // .then((res: Map<string, number>) => {
    //   setBalances(res)
    // })
    onReload()
    setNormalModeError(undefined)
    setNormalModeResponse(undefined)
  }

  const closeFullDegenModeResponse = () => {
    if (lcd.config.chainID === chainID.main) {
      let _time = new Date()
      const transaction = {
        mode: 'fullDegen',
        time: `${_time.getHours()}:${_time.getMinutes()}:${_time.getSeconds()}`,
        txhash: fullDegenModeResponse.result.txhash,
        link: `https://finder.terra.money/tx/${fullDegenModeResponse.result.txhash}`
      }
      onAddTransaction(transaction)
      let transactions: any = localStorage.getItem('terra_borrow_transactions')
      if (transactions) transactions = JSON.parse(transactions)
      else transactions = {
        'mainnet': [],
        'testnet': []
      }
      transactions.mainnet.push(transaction)
      localStorage.setItem('terra_borrow_transactions', JSON.stringify(transactions));
    } else {
      let _time = new Date()
      const transaction = {
        mode: 'fullDegen',
        time: `${_time.getHours()}:${_time.getMinutes()}:${_time.getSeconds()}`,
        txhash: fullDegenModeResponse.result.txhash,
        link: `https://finder.terra.money/testnet/tx/${fullDegenModeResponse.result.txhash}`
      }
      onAddTransaction(transaction)
      let transactions: any = localStorage.getItem('terra_borrow_transactions')
      if (transactions) transactions = JSON.parse(transactions)
      else transactions = {
        'mainnet': [],
        'testnet': []
      }
      transactions.testnet.push(transaction)
      localStorage.setItem('terra_borrow_transactions', JSON.stringify(transactions));
    }
    // getBalancesOfWallet(lcd, connectedWallet.network.chainID, connectedWallet.walletAddress)
    // .then((res: Map<string, number>) => {
    //   setBalances(res)
    // })
    onReload()
    setFullDegenModeError(undefined)
    setFullDegenModeResponse(undefined)
  }

  const normalModeTryAgain = () => {
    setNormalModeError(undefined)
    setNormalModeResponse(undefined)
  }

  const fullDegenModeTryAgain = () => {
    setFullDegenModeError(undefined)
    setFullDegenModeResponse(undefined)
  }

  return (
    <div className='container exchange-container sm-margin'>
      {
        (normalModeResponse || normalModeError) && (
          <Wait mode='normal' response={normalModeResponse} error={normalModeError} onConfirm={closeNormalModeResponse} onTryAgain={normalModeTryAgain} chain={lcd.config.chainID} />
        )
      }
      {
        (fullDegenModeResponse || fullDegenModeError) && (
          <Wait mode='fullDegen' response={fullDegenModeResponse} error={fullDegenModeError} onConfirm={closeFullDegenModeResponse} onTryAgain={fullDegenModeTryAgain} chain={lcd.config.chainID} />
        )
      }
        <div className='inline space-between align-center mb-25'>
            <p className='title m-7'>Borrow</p>
            <div className='inline align-center p-relative'>
                <p className='blue-color font-14 m-0 px-2'>Slippage</p>
                <input type='text' className='slippage-input' value={slippage} onChange={(e) => handleSlippage(Number.parseInt(e.target.value))} />
                <p className='p-absolute r-4'>%</p>
            </div>
        </div>
        <Loading state={loading} />
        <TokenInput
          title="Swap Asset"
          id="swap"
          onTokenChange={handleAssetToken}
          onAmountChange={handleAssetAmount}
          asset={swapAsset}
          amount={swapAmount}
          amountUsd={swapAmountUsd}
          balances = {balances}
        />
        <div className='vector'>
          <img className='vector-img' src={vector} />
        </div>
        <TokenInputCollateral
          title="To Collateral"
          id="collateral"
          onTokenChange={handleCollateralToken}
          asset={collateralAsset}
          amount={collateralAmount}
          amountUsd={collateralAmountUsd}
          balances={balances}
          disabled={fullDegenMode}
        />
        <div className='vector'>
          <img className='vector-img' src={vector} />
        </div>
        <div className="inline space-between align-center mb-30">
          <p className='font-10 gray-color m-0'>Total Borrow Usage</p>
          <div>
            <button className='percent-button' onClick={() => {handleSlider(25)}}>25%</button>
            <button className='percent-button' onClick={() => {handleSlider(50)}}>50%</button>
            <button className='percent-button' onClick={() => {handleSlider(75)}}>75%</button>
          </div>
        </div>
        <IOSSlider
          aria-label="Custom marks"
          step={0.01}
          value={Number(percent)}
          onChange={(e: any) => handleSlider(Number(e.target.value))}
          valueLabelDisplay="on"
          marks={marks}
        />
        {
          fullDegenMode ?
          <TokenInputFullDegenMode
            title="Total purchased and used as collateral"
            tooltip="The total amount that is purchased with borrowed funds, then used as further collateral. View your new collateral position on the right."
            id="borrow"
            onTokenChange={handleBorrowToken}
            onAmountChange={handleBorrowAmount}
            asset={collateralAsset}
            amount={collateralAmount}
            totalAmount={(Number(collateralAmount) + currentCollateralAmount).toFixed(2)}
            amountUsd={collateralAmountUsd}
            balances={balances}
          /> : 
          <TokenInputBorrow
            title="Borrow"
            onTokenChange={handleBorrowToken}
            onAmountChange={handleBorrowAmount}
            id="borrow"
            asset={borrowAsset}
            amount={borrowAmount}
            amountUsd={borrowAmountUsd}
            fullDegenMode={fullDegenMode}
            balances = {balances}
          />
        }
        <div className='design-mode-selector'>
          <div className='inline space-between align-center'>
            <p className={`font-12 line-height-15 m-0 mr-2 white`}>Full Degen Mode</p>
            <CustomToolTip
              // title='When Full Degen Mode is enabled, your borrowed bLUNA will then be used as collateral to borrow more bLUNA... until you are fully leveraged and long bLUNA.'
              title='When Full Degen Mode Is enabled, your borrowed bLUNA will be used as collateral to borrow more bLUNA until you are fully leveraged. Your collateral will be liquidated automatically your borrow amount reaches 100% loan-to-value maximum limit'
              height='11px'
              color='white'
            />
          </div>
          <div className="custom-switch-div">
            <CustomSwitch checked={fullDegenMode} onChange={handleFullDegenMode} />
          </div>
        </div>
        <div className='design-mode-selector'>
          <div className='inline space-between align-center'>
            <p className={`font-12 line-height-15 m-0 mr-2 white`}>Loophole Factor</p>
            <CustomToolTip
              title='The number of times your collateral has been used to purchase more collateral'
              height='11px'
              color='white'
            />
          </div>
          <p className={`font-12 line-height-15 m-0 mr-2 white`}>{loopHole}</p>
        </div>
        <div className='design-mode-selector'>
          <div className='inline space-between align-center'>
            <p className={`font-12 line-height-15 m-0 mr-2 white`}>Fee</p>
            <CustomToolTip
              title='0.1% of the Borrowed asset is paid as a fee'
              height='11px'
              color='white'
            />
          </div>
          <p className={`font-12 line-height-15 m-0 mr-2 white`}> 0.1%</p>
        </div>
        <div className={`${(!collateralPriceImpacts && !borrowPriceImpacts && !swapLimitError && !borrowLimitError) ? 'hidden' : ''}`}>
          <div className='inline align-center'>
            <p className={`font-12 line-height-15 m-0 mr-2 white`}>Price Impact</p>
            <CustomToolTip
              title='Swap price is calculated based on the pool price and spread'
              height='11px'
              color='white'
            />
          </div>
          {
            collateralPriceImpacts || swapLimitError ? <>
              <div className='design-mode-selector'>
                <p className={`font-12 line-height-15 m-0 mr-2 white`}>Swap 1</p>
              </div>
              {
                collateralPriceImpacts ? Object.keys(collateralPriceImpacts).map(key => (
                  collateralPriceImpacts[key].map((each, index) => (
                    <div className='design-mode-selector' key={`${key}-${index}`}>
                      <p className={`font-12 line-height-15 m-0 mr-2 white`}>{`${each.path} (${key.toUpperCase()})`}</p>
                      <p className={`font-12 line-height-15 m-0 mr-2 white`}>{each.impact}</p>
                    </div>
                  ))
                )) : <div className='design-mode-selector'>
                  <p className={`font-12 line-height-15 m-0 mr-2 magenta-color`}>{swapLimitError[0]}</p>
                  <p className={`font-12 line-height-15 m-0 mr-2 magenta-color`}>{swapLimitError[1]}</p>
                </div>
              }
            </> : <></>
          }
          {
            borrowPriceImpacts || borrowLimitError ? <>
              <div className='design-mode-selector'>
                <p className={`font-12 line-height-15 m-0 mr-2 white`}>Swap 2</p>
              </div>
              {
                borrowPriceImpacts ? Object.keys(borrowPriceImpacts).map(key => (
                  borrowPriceImpacts[key].map((each, index) => (
                    <div className='design-mode-selector' key={`${key}-${index}`}>
                      <p className={`font-12 line-height-15 m-0 mr-2 white`}>{`${each.path} (${key.toUpperCase()})`}</p>
                      <p className={`font-12 line-height-15 m-0 mr-2 white`}>{each.impact}</p>
                    </div>
                  ))
                )) : <div className='design-mode-selector'>
                  <p className={`font-12 line-height-15 m-0 mr-2 magenta-color`}>{borrowLimitError[0]}</p>
                  <p className={`font-12 line-height-15 m-0 mr-2 magenta-color`}>{borrowLimitError[1]}</p>
                </div>
              }
            </> : <></>
          }
        </div>
        {
          renderButton()
        }
        <Snackbar
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={toastOpen}
            onClose={handleToastClose}
            message={toastMessage}
        />
        <Modal
          open={isOpen}
          onClose={_handleClose}
        >
          <Box className='connect-wallet-modal'>
            <ConnectList onClick={_handleClose} />
          </Box>
        </Modal>
        <Modal
          open={fdmPopup}
          onClose={_fdmPopupClose}
        >
          <Box className='accept-terms-modal'>
            <p>When Full Degen Mode is enabled, your borrowed BLUNA will be used as collateral to borrow more BLUNA until you are fully leveraged.
Your collateral will be liquidated automatically when your borrow amount reaches 100% loan-to-value maximum limit. Full Degen Mode is only available for BLUNA and BETH loans.</p>
            <div className={`inline align-center content-start width-100 ${!acceptTerms && 'opacity-30'} m-14`}><Checkbox color='info' checked={acceptTerms} onClick={handleAcceptTerms} /><p className="ml-7 pointer" onClick={handleAcceptTerms}>Understood, let's do this!</p></div>
            <div className={`inline align-center space-around width-100`}>
              <CancelButton variant='contained' onClick={_fdmPopupClose}>Cancel</CancelButton>
              <ConfirmButton variant='contained' onClick={acceptFullDegenMode} disabled={!acceptTerms}>Continue</ConfirmButton>
            </div>
          </Box>
        </Modal>
        <Modal
          open={fullDegenLowAmountAlert}
          onClose={()=>setFullDegenLowAmountAlert(false)}
        >
          <Box className='accept-terms-modal'>
            <p>For Full Degen Mode to work properly, you need to add more than $5 in collateral.</p>
            <div className={`inline align-center space-around width-100`}>
              <ConfirmButton variant='contained' onClick={() => setFullDegenLowAmountAlert(false)}>Confirm</ConfirmButton>
            </div>
          </Box>
        </Modal>
    </div>
  )
}
