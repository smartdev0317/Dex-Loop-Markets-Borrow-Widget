import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useConnectedWallet, useLCDClient } from '@terra-money/wallet-provider'
import Grid from '@mui/material/Grid';
import { CollateralDetail, BorrowDetail } from 'constant/interface'
import { contract_addrOfToken, denomOfCoin, getBorrowDistributionRate, getSymbol, getSymbolWithAddress, isCoin } from 'utils/utils'
import AnchorBorrowSlider from './BorrowSlider'
import AnchorRepayModal from './AnchorRepayModal'
import CustomToolTip from 'components/CustomToolTip'
import ANC_logo from 'assets/img/ANC_logo.svg'
import BLUNA_logo from 'assets/img/tokens/bLUNA.png'
import BETH_logo from 'assets/img/tokens/bETH.png'
import wasAVAX_logo from 'assets/img/tokens/wasAVAX.svg'
import arrow_forward from 'assets/img/arrow_forward.svg'
import repay from 'assets/img/repay.svg'
import saveMoney from 'assets/img/save_money.svg'
import dolor from 'assets/img/dolor.svg'
import { bETH, bLUNA, BORROWRATELIMIT, wasAVAX } from 'constant/constants';
import styles from '../../containers/PriceChart.module.scss'
import { useRecoilValue } from 'recoil';
import { collateralAssetState } from 'data/collateralAsset';
// import useLCDClient from 'graphql/useLCDClient'

interface AnchorPositionInterface {
    collaterals: CollateralDetail[],
    borrowData: BorrowDetail,
    isFetched: boolean,
    collateralAmountUsd: string,
    borrowAmountUsd: string,
    onAddTransaction: Function
    onReload: Function
}

interface rateInterface {
    borrowRate: number,
    distributionRate: number
}

export default function AnchorPosition ({collaterals, borrowData, isFetched, collateralAmountUsd, borrowAmountUsd, onAddTransaction, onReload}: AnchorPositionInterface) {
    const lcd = useLCDClient()
    // const lcd = useLCDClient()?.terra
    const connectedWallet = useConnectedWallet()
    const activeCollateral = useRecoilValue(collateralAssetState)
    const activeCollateralAddress = isCoin(activeCollateral) ? denomOfCoin(activeCollateral) : contract_addrOfToken(activeCollateral)

    const [repayModalOpen, setRepayModalOpen] = useState<boolean>(false)
    const [borrowRate, setBorrowRate] = useState<number>(0)
    const [distributionRate, setDistributionRate] = useState<number>(0)
    const [_percent, setPercent] = useState<number>(0)

    useEffect(() => {
        getBorrowDistributionRate(lcd).then((res: rateInterface) => {
            // console.log(res)
            setBorrowRate(res.borrowRate)
            setDistributionRate(res.distributionRate)
        })
        const rateTimer = setInterval(() => {
            getBorrowDistributionRate(lcd).then((res: rateInterface) => {
                // console.log(res)
                setBorrowRate(res.borrowRate)
                setDistributionRate(res.distributionRate)
            })
        }, 60000)
        return () => clearInterval(rateTimer)
    }, [connectedWallet, lcd])

    let totalAmountUsd = 0
    collaterals.map(c => {
        totalAmountUsd += Number(c.amountUST)
    })
    const _borrowAmountUsd = Number(borrowData.borrow_amount)
    const borrowLimitUsd = Number(borrowData.borrow_limit)
    const _initPercent = Number(borrowLimitUsd) > 0 ? Number((Number(_borrowAmountUsd) / Number(borrowLimitUsd) * 100).toFixed(2)) : 0
    
    useEffect(() => {
        setPercent(borrowAmountUsd === '-' ? 100 : ( _borrowAmountUsd > 0 || totalAmountUsd > 0 ? Number(((_borrowAmountUsd + Number(borrowAmountUsd)) / (Number(borrowData.borrow_limit) + Number(collateralAmountUsd) * Number(borrowData.borrow_limit) / Number(totalAmountUsd)) * 100).toFixed(2)) : Number((Number(borrowAmountUsd) / (Number(collateralAmountUsd) * 0.8) * 100).toFixed(2))))
        if (borrowAmountUsd !== '-' && _percent > 100) setPercent(100)
    }, [collateralAmountUsd, borrowAmountUsd, _initPercent])
    const openRepayModal = () => {
        setRepayModalOpen(true)
    }
    const closeRepayModal = () => {
        setRepayModalOpen(false)
    }
    const getImage = (address) => {
        switch (address) {
            case bLUNA: return BLUNA_logo;
            case bETH: return BETH_logo;
            case wasAVAX: return wasAVAX_logo;
            default: return ''
        }
    }

    const numberToCommaStyledString = (number: number, fixed: number) => {
        return Number(number.toFixed(2)).toLocaleString('en', {
            minimumFractionDigits: 2
        })
    }
    return (
        <div className='container mobile-margin anchor-position'>
            <div className="inline space-between align-center anchor-position-header">
                <div className='anchor-position-title'>
                    <img src={ANC_logo} />
                    <p className='title mx-8 my-4'>Your Current Anchor Position</p>
                </div>
                <a className='open-anchor' href='https://app.anchorprotocol.com/borrow' target='_blank'>
                    <img src={ANC_logo} width='14' height='14' className='mr-5' />
                    <span className={`${styles.onlyCustomDesktop} font-12 fw-500 only`}>Open Anchor</span>
                    <span className={`${styles.onlyCustomMobile} font-10 fw-500 only`}>Open Anchor</span>
                </a>
            </div>
            <AnchorBorrowSlider initPercent={_initPercent} percent={_percent} borrowLimit={borrowLimitUsd + Number(collateralAmountUsd) * BORROWRATELIMIT} isFetched={isFetched} margin='5px 30px' />
            <Grid container>
                <Grid item xs={12} sm={12} md={4}>
                    <div className='anchor-position-sub-container m-14'>
                        <div className='height-75 px-15 py-12 box-border'>
                            <div className='inline align-center mb-6'>
                                <p className='font-12 blue-color m-0'>Collateral Value</p>
                                <CustomToolTip
                                    title='Collateral Value'
                                    height='11px'
                                    color='blue-color'
                                />
                            </div>
                            {activeCollateral && Number(collateralAmountUsd) ? 
                                <p className={`font-19 fw-700 m-0`}><span className="text-crossline green-color">{`$${numberToCommaStyledString(totalAmountUsd, 2)}`}</span><span className="mx-8 magenta-color">{`$${numberToCommaStyledString(totalAmountUsd + Number(collateralAmountUsd), 2)}`}</span></p> : 
                                <p className={`font-19 fw-700 m-0 green-color`}>{`$${numberToCommaStyledString(totalAmountUsd, 2)}`}</p>
                            }
                        </div>
                        <table className='collateral-assets-table'>
                            {/* <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Amount</th>
                                    <th className='right'>Provided</th>
                                </tr>
                            </thead> */}
                            <tbody>
                                {
                                    collaterals.map((c, i) => (
                                        <tr key={`collateral-${i}`}>
                                            <td>
                                                <div className='inline align-center'>
                                                    <img src={getImage(c.address)} width="12" height="12" className='mr-4' />
                                                    {c.symbol}
                                                </div>
                                            </td>
                                            <td>{c.price} UST</td>
                                            {/* <td>{c.amount}</td> */}
                                            {
                                                Number(collateralAmountUsd) && getSymbolWithAddress(lcd.config.chainID, activeCollateralAddress) === c.symbol ?
                                                <td className='right magenta-color'>{(Number(c.amountUST) + Number(collateralAmountUsd)).toFixed(6)} <span className="white">UST</span></td> :
                                                <td className='right white'>{c.amountUST} <span className="white">UST</span></td>

                                            }
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={3}>
                    <div className='anchor-position-sub-container m-14'>
                        <div className='height-75 px-15 py-12 box-border'>
                            <div className='inline align-center mb-6'>
                                <p className='font-12 blue-color m-0'>Borrow Value</p>
                                <CustomToolTip
                                    title='Borrow Value'
                                    height='11px'
                                    color='blue-color'
                                />
                            </div>
                            {activeCollateral && Number(collateralAmountUsd)  ? 
                                <p className={`font-19 fw-700 m-0`}><span className="text-crossline green-color">{`$${numberToCommaStyledString(_borrowAmountUsd, 2)}`}</span><span className="mx-8 magenta-color">{`$${borrowAmountUsd === '-' ? '-' : numberToCommaStyledString(_borrowAmountUsd + Number(borrowAmountUsd), 2)}`}</span></p> : 
                                <p className={`font-19 fw-700 m-0 green-color`}>{`$${numberToCommaStyledString(_borrowAmountUsd, 2)}`}</p>
                            }
                        </div>
                        <div className='anchor-bottom-container inline content-center align-center'>
                            <div className='inline content-center pointer repay-button' onClick={openRepayModal}>
                                <img src={repay} />
                                <p className='ml-7 font-17 green-color'>REPAY LOAN</p>
                            </div>
                            <AnchorRepayModal
                                open={repayModalOpen}
                                borrowApr={borrowRate}
                                handleClose={closeRepayModal}
                                percent={_percent}
                                borrowLimit={borrowLimitUsd}
                                borrowAmount={_borrowAmountUsd}
                                activeCollateral={activeCollateralAddress}
                                isFetched={isFetched}
                                onAddTransaction={onAddTransaction}
                                onReload={onReload}
                            />
                        </div>
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={5}>
                    <div className='anchor-position-sub-container m-14'>
                        <div className='height-75 px-15 py-12 box-border inline'>
                            <div className='half inline align-start flex-column content-center'>
                                <div className='inline align-center mb-6'>
                                    <p className='font-12 blue-color m-0 line-break-none'>Net APR</p>
                                    <CustomToolTip
                                        title='Net APR'
                                        height='11px'
                                        color='blue-color'
                                    />
                                </div>
                                <p className='font-19 fw-700 m-0 green-color'>{`${(distributionRate - borrowRate).toFixed(2)}%`}</p>
                            </div>
                            <div className='half inline align-start flex-column content-center'>
                                <div className='inline align-center mb-6'>
                                    <p className='font-12 blue-color m-0'>Borrow Limit</p>
                                    <CustomToolTip
                                        title='Borrow Limit'
                                        height='11px'
                                        color='blue-color'
                                    />
                                </div>
                                {activeCollateral && Number(collateralAmountUsd) ? 
                                    <p className={`font-15 fw-700 m-0 `}><span className="text-crossline green-color">{`$${numberToCommaStyledString(borrowLimitUsd, 2)}`}</span><span className="mx-8 magenta-color">{`$${numberToCommaStyledString(borrowLimitUsd + Number(collateralAmountUsd) * BORROWRATELIMIT, 2)}`}</span></p> : 
                                    <p className={`font-15 fw-700 m-0 green-color`}>{`$${numberToCommaStyledString(borrowLimitUsd, 2)}`}</p>
                                }
                            </div>
                        </div>
                        <div className='anchor-bottom-container inline'>
                            <div className='half inline align-center'>
                                <img src={saveMoney} width='22' height='22' className='blue-color mr-12' />
                                <div className='inline content-center flex-column'>
                                    <p className='font-10 blue-color m-0 mb-2'>Borrow APR</p>
                                    <p className='font-14 fw-600 white m-0'>{`${borrowRate}%`}</p>
                                </div>
                            </div>
                            <div className='half inline align-center'>
                                <img src={dolor} width='22' height='22' className='blue-color mr-12' />
                                <div className='inline content-center flex-column'>
                                    <p className='font-10 blue-color m-0 mb-2'>Distribution APR</p>
                                    <p className='font-14 fw-600 white m-0'>{`${distributionRate}%`}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Grid>
            </Grid>
        </div>
    )
}