import React, { useState, useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { useConnectedWallet, UserDenied, CreateTxFailed, TxFailed, TxUnspecifiedError, useLCDClient } from '@terra-money/wallet-provider'
import Snackbar from '@mui/material/Snackbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { alpha, styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Modal from '@mui/material/Modal';
import { getCoinBalances, repayUST } from 'utils/utils'
import AnchorBorrowSliderRepayModal from './BorrowSliderRepayModal'
import { chainID } from 'constant/constants'
import Wait from '../Wait/Wait';
import { repayResponseState } from 'data/repayResponse';
// import useLCDClient from 'graphql/useLCDClient'

interface AnchorRepayModalInterface {
    open: boolean,
    borrowApr: number, //100: 1%
    handleClose: Function,
    percent: number,
    borrowLimit: number,
    borrowAmount: number,
    isFetched: boolean,
    activeCollateral: string,
    onAddTransaction: Function
    onReload: Function
}

export type PostError =
| UserDenied
| CreateTxFailed
| TxFailed
| TxUnspecifiedError

const CssTextField = styled(TextField)({
    '&': {
        width: '100%',
        marginTop: '30px'
    },
    '& label.Mui-focused': {
      color: '#919191',
    },
    '& label': {
      color: '#666666',
    },
    '& .MuiInputBase-root': {
        width: '100%',
        color: '#919191'
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#333333',
      },
      '& fieldset:hover': {
        borderColor: '#1B1B1B',
        borderWidth: '1px'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1B1B1B',
        borderWidth: '1px'
      },
    },
  });

export default function AnchorRepayModal ({open, handleClose, borrowApr, percent, borrowLimit, isFetched, activeCollateral, borrowAmount, onAddTransaction, onReload}: AnchorRepayModalInterface) {
    const lcd = useLCDClient()
    // const lcd = useLCDClient()?.terra
    const connectedWallet = useConnectedWallet()

    const [USTBalance, setUSTBalance] = useState<number>(0)
    const [repayAmount, setRepayAmount] = useState<string>('0')
    const [toastOpen, setToastOpen] = useState<boolean>(false)
    const [toastMessage, setToastMessage] = useState<string>('')
    const [response, setResponse] = useRecoilState<any>(repayResponseState);
    const [error, setError] = useState<PostError>()

    useEffect(() => {
        if (!connectedWallet) {
            if (USTBalance !== 0) setUSTBalance(0)
            return
        }
        let isMounted = true
        getCoinBalances(lcd, connectedWallet?.walletAddress)
        .then((res: Map<string, number>) => {
            if (isMounted) {
                const newUSTBalance = res.get('uusd') || 0
                if (newUSTBalance < 5000000) setUSTBalance(0)
                else if (newUSTBalance > borrowAmount * Math.pow(10, 6) + 5000000) setUSTBalance(Math.ceil(borrowAmount * 1000) / 1000)
                else setUSTBalance((newUSTBalance - 5000000) / Math.pow(10, 6))
            }
        })
        const timerUSTBalance = setInterval(() => {
            getCoinBalances(lcd, connectedWallet?.walletAddress)
            .then((res: Map<string, number>) => {
                const newUSTBalance = res.get('uusd') || 0
                if (newUSTBalance < 5000000) setUSTBalance(0)
                else if (newUSTBalance > borrowAmount * Math.pow(10, 6) + 5000000) setUSTBalance(Math.ceil(borrowAmount * 1000) / 1000)
                else setUSTBalance((newUSTBalance - 5000000) / Math.pow(10, 6))
            })
        }, 5000)
        return () => {
            isMounted = false
            clearInterval(timerUSTBalance)
        }
    }, [lcd, connectedWallet])

    const _handleClose = () => {
        handleClose()
    }

    const handleRepayAmount = (value: string) => {
        for( let c of value ) {
            if ((c < '0' || c > '9') && c != '.') return 
        }
        if (value.split('.').length > 2) return
        if (value.length > 1 && value[0] == '0' && value[1] !== '.') value = value.slice(1)
        const fractionalPartLength =  value.indexOf('.') === -1 ? 0 : value.length - value.indexOf('.') - 1
        if (fractionalPartLength > 6) value = value.slice(0, value.length - (fractionalPartLength - 6))
        if (value === '.') value = '0.'
        if (Number(value) > USTBalance) value = USTBalance.toString()
        setRepayAmount(value)
    }

    const SelectMaxAmount = () => {
        setRepayAmount(USTBalance.toString())
    }

    const handleOnClick = async () => {
        if (!connectedWallet) return
        const msg = repayUST(lcd, connectedWallet.network.chainID, connectedWallet.walletAddress, Number(repayAmount))
        try {
            const _response = await connectedWallet.post({
                msgs: [msg]
            })
            setResponse(_response);
        } catch (error) {
            setError(error as Error);
        }

        // .then((res: any) => {
        //     if (lcd.config.chainID === chainID.main) {
        //         let _time = new Date()
        //         onAddTransaction({
        //         time: `${_time.getHours()}:${_time.getMinutes()}:${_time.getSeconds()}`,
        //         txhash: res.result.txhash,
        //         link: `https://finder.terra.money/tx/${res.result.txhash}`
        //         })
        //     } else {
        //         let _time = new Date()
        //         onAddTransaction({
        //         time: `${_time.getHours()}:${_time.getMinutes()}:${_time.getSeconds()}`,
        //         txhash: res.result.txhash,
        //         link: `https://finder.terra.money/testnet/tx/${res.result.txhash}`
        //         })
        //     }
        //     if (res.success) {
        //         setToastMessage(`Repay ${repayAmount} UST succeded`)
        //         setToastOpen(true)
        //     } else {
        //         setToastMessage(`Repay ${repayAmount} UST failed`)
        //         setToastOpen(true)
        //     }
        //     setTimeout(() => {
        //         setToastOpen(false)
        //     }, 3000)
        // })
        _handleClose()
    }

    const handleToastClose = () => {
        setToastOpen(false)
    }

    const closeResponse = () => {
        onReload()
        setResponse(undefined);
        setError(undefined);
    }

    const tryAgain = () => {
        setResponse(undefined);
        setError(undefined);
        handleOnClick()
    }

    return (
        <>
        {
          (response || error) && (
            <Wait mode='repay' response={response} error={error} onConfirm={closeResponse} onTryAgain={tryAgain} chain={lcd.config.chainID} />
          )
        }
            <Modal
                open={open}
                onClose={_handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box className='repayModal'>
                    <p className='title m-0'>Repay</p>
                    <p className='borrow-apr'>{`Borrow APR: ${borrowApr}%`}</p>
                    <CssTextField
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                <p className='gray-color'>UST</p>
                                </InputAdornment>
                            ),
                            inputMode: 'numeric'
                        }}
                        label="REPAY AMOUNT"
                        onChange={(e) => handleRepayAmount(e.target.value)}
                        value={repayAmount}
                    />
                    <div className='width-100 mb-6 mt-5'>
                        <p className='repay-max-link font-10 gray-color mb-0'>
                            {`max  `}
                            <a className='text-underline pointer' onClick={SelectMaxAmount}>{`${USTBalance.toFixed(2)} UST`}</a>
                        </p>
                        <p className='m-0 font-11 mb-2 green-color mt-5'>{`${percent || 0}%`}</p>
                        <AnchorBorrowSliderRepayModal
                            percent={percent}
                            borrowLimit={borrowLimit}
                            isFetched={isFetched}
                            noTooltip
                            activeCollateral={activeCollateral}
                        />
                    </div>
                    <div className="mt-10 width-100">
                    {
                        Number(repayAmount) !== 0 ?
                        <Button variant="contained" fullWidth color="success" onClick={handleOnClick}>Proceed</Button> :
                        <Button variant="contained" fullWidth color="secondary" disabled>Proceed</Button>
                    }
                    </div>
                </Box>
            </Modal>
            <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={toastOpen}
                onClose={handleToastClose}
                message={toastMessage}
            />
        </>
    )
}