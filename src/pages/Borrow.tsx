import React, { useState, useEffect } from 'react'
import { ConnectType, useConnectedWallet, useLCDClient } from '@terra-money/wallet-provider'
import { getCollateralAssetsDetails, getBorrowData, getSymbol, isCoin, denomOfCoin, contract_addrOfToken, getUSTSwapLiquidity } from 'utils/utils'
import { bLUNA, bETH, wasAVAX } from 'constant/constants'
import { CollateralDetail, BorrowDetail, Transaction } from 'constant/interface'
import Header from '../components/header/Header'
import BorrowContainer from 'components/BorrowContainer'
import AnchorPosition from 'components/anchorPosition/AnchorPosition'
import Loading from '../components/Loading'
import TransactionHistoryContainer from 'components/TransactionHistoryContainer'
import { useProtocol } from "../data/contract/protocol"
import { LOOP, UUSD } from "../constants"
import { useFetchTokens } from "../hooks"
import { useLocation } from "react-router-dom"
import { useFindTokenDetails } from "../data/form/select"
import PriceChart from "../containers/PriceChart"
import MyHoldingList from 'components/Holdings/MyHoldingList'
import { useNativeBalances, useRawPairs, useTokenBalances } from "../data/contract/normalize"
import { useInitAddress, useInitNetwork, useLocationKey, useInitSwapAsset } from "../layouts/init"
import {useListedPairAddrs} from "../data/stats/contracts"
import {usePoolingPriceInitialize} from "../data/app"
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
// import useLCDClient from 'graphql/useLCDClient'

export interface EXCHANGE_TOKEN {
    token?: string
    symbol?: string
}

export default function Borrow () {
    const { getToken, whitelist } = useProtocol()
    // const lcd = useLCDClient()?.terra
    const lcd = useLCDClient()
    const connectedWallet = useConnectedWallet()
    const [collaterals, setCollaterals] = useState<CollateralDetail[]>([])
    const [borrowData, setBorrowData] = useState<BorrowDetail>({borrow_amount: '0', borrow_limit: '0'})
    const [isFetched, setIsFetched] = useState<boolean>(false)
    const [collateralAmountUsd, setCollateralAmountUsd] = useState<string>('')
    const [borrowAmountUsd, setBorrowAmountUsd] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [fullDegenMode, setFullDegenMode] = useState<number>(0)
    const [alertPopup, setAlertPopup] = useState<boolean>(true)

    const _alertPopupClose = () => {
        setAlertPopup(false)
    }

    usePoolingPriceInitialize()
    // usePollingPrices()
    useLocationKey()
    useInitAddress()
    useInitNetwork()
    useListedPairAddrs()
    useRawPairs()
    useTokenBalances()
    useNativeBalances()

    const { state } = useLocation<{ token1?: string; token2?: string }>()
    const { getTokenOrDenom } = useFetchTokens(
        undefined,
        state
    )
    // LOOP ust pair
    // const { pair } = whitelist[getToken(LOOP)] ?? {}
    const [token1, setToken1] = useState<EXCHANGE_TOKEN | undefined>({
        token: UUSD,
        symbol: "UST",
    })
    const [token2, setToken2] = useState<EXCHANGE_TOKEN | undefined>({
        token: getToken(LOOP) ?? "",
        symbol: LOOP,
    })
    const [pool, setPool] = useState<string | undefined>('terra106a00unep7pvwvcck4wylt4fffjhgkf9a0u6eu')
    /* result */
    const findTokenDetailFn = useFindTokenDetails()
    const token1Symbol = findTokenDetailFn(token1?.token)
    const token2Symbol = findTokenDetailFn(token2?.token)

    useEffect(() => {
        if (isFetched) setIsFetched(false)
        let timer1: any
        if (!connectedWallet && lcd) {
            timer1 = setTimeout(() => {
                setLoading(false)
            }, 1000)
            setIsFetched(true)
            return () => clearTimeout(timer1)
        }
        if (connectedWallet) {
            if(!loading) setLoading(true);
            (async () => {
                await getCollateralAssetsDetails(lcd, connectedWallet?.network.chainID, connectedWallet?.walletAddress)
                .then((_collaterals: CollateralDetail[]) => {
                    setCollaterals(_collaterals)
                    setIsFetched(true)
                })
                await getBorrowData(lcd, connectedWallet?.network.chainID, connectedWallet?.walletAddress)
                .then((_borrowData: BorrowDetail) => {
                    setBorrowData(_borrowData)
                })
                setLoading(false);
            })();
            const timer = setInterval(() => {
                // console.log(connectedWallet?.network.chainID, connectedWallet?.walletAddress)
                getCollateralAssetsDetails(lcd, connectedWallet?.network.chainID, connectedWallet?.walletAddress)
                .then((_collaterals: CollateralDetail[]) => {
                    setCollaterals(_collaterals)
                    if (!isFetched) setIsFetched(true)
                })
                getBorrowData(lcd, connectedWallet?.network.chainID, connectedWallet?.walletAddress)
                .then((_borrowData: BorrowDetail) => {
                    setBorrowData(_borrowData)
                })
            }, 30000)
            return () => clearInterval(timer)
        }
    }, [lcd, connectedWallet])

    useEffect(() => {
        setCollaterals([ 
            {address: bLUNA, symbol: 'BLUNA', decimals: 6, price: '0', amount: '0', amountUST: '0'},
            {address: bETH, symbol: 'BETH', decimals: 6, price: '0', amount: '0', amountUST: '0'},
            {address: wasAVAX, symbol: 'wasAVAX', decimals: 6, price: '0', amount: '0', amountUST: '0'},
        ])
    }, [])

    const onChangeBorrowAsset = async (_borrowAsset: AssetInfo | NativeInfo) => {
        const _token = isCoin(_borrowAsset) ? denomOfCoin(_borrowAsset) : contract_addrOfToken(_borrowAsset)
        const symbol = getSymbol(lcd.config.chainID, _borrowAsset)
        const pool = await getUSTSwapLiquidity(lcd, lcd.config.chainID, _borrowAsset)
        setPool(pool)
        setToken2({
            token: _token,
            symbol: symbol
        })
    }

    const reloadData = () => {
        if (!connectedWallet) return
        (async () => {
            await getCollateralAssetsDetails(lcd, lcd.config.chainID, connectedWallet?.walletAddress)
            .then((_collaterals: CollateralDetail[]) => {
                setCollaterals(_collaterals)
                setIsFetched(true)
            })
            await getBorrowData(lcd, lcd.config.chainID, connectedWallet?.walletAddress)
            .then((_borrowData: BorrowDetail) => {
                setBorrowData(_borrowData)
            })
        })();
    }

    const addTransaction = (_transaction: Transaction) => {
        let _newTransactions = [...transactions, _transaction]
        setTransactions(_newTransactions)
    }

    return(
        <div className='borrow-page'>
            <Header />
            <div className='isDesktop borrow-main'>
                <div style={{height: "100px"}}></div>
                <Loading state={loading} />
                {!loading && <>
                    <div className="inline">
                        <BorrowContainer
                            collaterals={collaterals}
                            borrowData={borrowData}
                            isFetched={isFetched}
                            onChangeCollateralAmountUsd={setCollateralAmountUsd}
                            onChangeBorrowAmountUsd={setBorrowAmountUsd}
                            onReload={reloadData}
                            onAddTransaction={addTransaction}
                            transactions={transactions}
                            onChangeBorrowAsset={onChangeBorrowAsset}
                            onChangeFullDegenMode={(state: number) => setFullDegenMode(state)}
                        />
                        <div className='borrow-right-container ml-20'>
                            <AnchorPosition
                                collaterals={collaterals}
                                borrowData={borrowData}
                                collateralAmountUsd={collateralAmountUsd}
                                borrowAmountUsd={borrowAmountUsd}
                                isFetched={isFetched}
                                onAddTransaction={addTransaction}
                                onReload={reloadData}
                            />
                            <PriceChart
                                token2={{
                                    token:
                                    token1 && token1.symbol?.startsWith("u")
                                        ? token1.symbol
                                        : getTokenOrDenom(token1?.token),
                                    symbol: token1Symbol?.tokenSymbol ?? "",
                                }}
                                token1={{
                                    token:
                                    token2 && token2.symbol?.startsWith("u")
                                        ? token2.symbol
                                        : getTokenOrDenom(token2?.token),
                                    symbol: token2Symbol?.tokenSymbol ?? "",
                                }}
                                pool={pool}
                                mode={fullDegenMode}
                                onChangeMode={(state: number) => setFullDegenMode(state)}
                            />
                        </div>
                    </div>
                    <div className="mt-15">
                        <MyHoldingList />
                    </div>
                    <div className="mt-15">
                        <TransactionHistoryContainer transactions={transactions} />
                    </div>
                </>}
            </div>
            <div className='borrow-main-mobile isMobile'>
                <div style={{height: "70px"}}></div>
                <AnchorPosition
                    collaterals={collaterals}
                    borrowData={borrowData}
                    collateralAmountUsd={collateralAmountUsd}
                    borrowAmountUsd={borrowAmountUsd}
                    isFetched={isFetched}
                    onAddTransaction={addTransaction}
                    onReload={reloadData}
                />
                <div className='inline content-center'>
                    <div style={{width: '360px'}}>
                        <BorrowContainer
                            collaterals={collaterals}
                            borrowData={borrowData}
                            isFetched={isFetched}
                            onChangeCollateralAmountUsd={setCollateralAmountUsd}
                            onChangeBorrowAmountUsd={setBorrowAmountUsd}
                            onReload={reloadData}
                            onAddTransaction={addTransaction}
                            transactions={transactions}
                            onChangeBorrowAsset={onChangeBorrowAsset}
                            onChangeFullDegenMode={(state: number) => setFullDegenMode(state)}
                        />
                    </div>
                </div>
                <div className="mt-15">
                    <PriceChart
                        token2={{
                            token:
                            token1 && token1.symbol?.startsWith("u")
                                ? token1.symbol
                                : getTokenOrDenom(token1?.token),
                            symbol: token1Symbol?.tokenSymbol ?? "",
                        }}
                        token1={{
                            token:
                            token2 && token2.symbol?.startsWith("u")
                                ? token2.symbol
                                : getTokenOrDenom(token2?.token),
                            symbol: token2Symbol?.tokenSymbol ?? "",
                        }}
                        pool={pool}
                        mode={fullDegenMode}
                        onChangeMode={(state: number) => setFullDegenMode(state)}
                    />
                </div>
                <div className="mt-15">
                    <MyHoldingList />
                </div>
                <div className="mt-15">
                    <TransactionHistoryContainer transactions={transactions} />
                </div>
            </div>
            <Modal
                open={alertPopup}
                onClose={_alertPopupClose}
                >
                <Box className='alert-modal'>
                    <h5 className='font-19 fw-700 mb-20'>Loop - Anchor Borrow</h5>
                    <p>This product is still in public beta. Please use at your own risk.</p><p>Please also educate yourself about how liquidations work when borrowing on Anchor before taking any large, risky positions. It is highly recommended to use a second wallet address for leveraged positions to limit any losses that you may incur.</p>
                    <br />
                    <br />
                    <p>
                        There are a few known UI bugs that we're working on. Please refresh the page if it gets stuck at any point.
                    </p>
                    <br />
                    <br />
                    <Button onClick={_alertPopupClose} className="alert-modal-close">OK, let me Degen</Button>
                </Box>
            </Modal>
        </div>
    )
}