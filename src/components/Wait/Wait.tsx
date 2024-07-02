import { useEffect, useState } from "react"
import { TxResult, useLCDClient } from "@terra-money/wallet-provider"
import { TX_POLLING_INTERVAL, STATUS, chainID } from "../../constant/constants"
import { getSymbol, getSymbolWithAddress, getDecimalsWithAddress, getDecimals } from "../../utils/utils"
import "./Wait.scss"
import { TxInfo } from "@terra-money/terra.js"
import iconFail from "../../assets/img/failed.svg"
import iconRetry from "../../assets/img/retry.svg"
import iconDone from "../../assets/img/done.svg"
import { minusNumber } from "libs/math"
// import useLCDClient from 'graphql/useLCDClient'

interface Props {
    mode: string
    response: TxResult
    error: Error | undefined
    onConfirm: Function
    onTryAgain: Function
    chain?: string | undefined
}

const Wait = (props: Props) => {
    const lcd = useLCDClient()
    // const lcd = useLCDClient()?.terra
    const [txInfo, setTxInfo] = useState<TxInfo>()
    const { response, error, onConfirm } = props
    const success = !error
    const hash = props?.response?.result?.txhash
    const chain = props.chain || chainID.main;

    const status =
    !success || !hash || (txInfo && txInfo?.code)
      ? STATUS.FAILURE
      : !txInfo
      ? STATUS.LOADING
      : STATUS.SUCCESS

    useEffect(() => {
        if (!success || !hash) return;
        const _timer = setInterval(() => {
            lcd.tx.txInfo(hash).then((_txInfo: TxInfo) => {
                setTxInfo(_txInfo);
            })
        }, 1000);
        return () => clearInterval(_timer)
    }, [success, hash, lcd])

    const _onTryAgain = () => {
        props.onTryAgain()
    }

    const calculateReceive = () => {
        const logs = txInfo?.logs;
        if (!logs) return 0;
        const events = logs[logs.length - 1].events;
        const wasmIndex = events.findIndex(each => each.type === 'wasm');
        const chain = lcd.config.chainID
        if (wasmIndex === -1) return 0;
        else {
            const return_amount_index = events[wasmIndex].attributes.findIndex(each => each.key === "return_amount")
            if (return_amount_index === -1) {
                const borrow_amount_index = events[wasmIndex].attributes.findIndex(each => each.key === 'borrow_amount')
                return `${Number(events[wasmIndex]['attributes'][borrow_amount_index].value) / Math.pow(10, 6)} UST`
            } else {
                const ask_asset_index = events[wasmIndex].attributes.findIndex(each => each.key === "ask_asset")
                const ask_asset_address = events[wasmIndex].attributes[ask_asset_index].value
                const ask_asset_symbol = getSymbolWithAddress("", ask_asset_address)
                return `${Number(events[wasmIndex]['attributes'][return_amount_index].value) / Math.pow(10, getDecimalsWithAddress(chain, ask_asset_address))} ${ask_asset_symbol}`
            }
        }
    }

    const TransactionResult = () => {
        const logs = txInfo?.logs;
        if (!logs) return (<></>);
        if (props.mode === "normal") {
            const events = logs[logs.length - 1].events;
            let depositAmount = 0, depositAssetAddr = '';
            logs.map(each => {
                each.events.map(eachEvent => {
                    for (let i = 0; i < eachEvent.attributes.length; i++) {
                        const eachAttr = eachEvent.attributes[i]
                        if (eachAttr.key === 'action' && eachAttr.value === 'deposit_collateral') {
                            depositAmount = Number(eachEvent.attributes[eachEvent.attributes.length - 1].value)
                            depositAssetAddr = eachEvent.attributes[0].value
                            break;
                        }
                    }
                })
            })
            const wasmIndex = events.findIndex(each => each.type === 'wasm');
            const chain = lcd.config.chainID
            if (wasmIndex === -1) return (<></>);
            else {
                const return_amount_index = events[wasmIndex].attributes.findIndex(each => each.key === "return_amount")
                if (return_amount_index === -1) {
                    const borrow_amount_index = events[wasmIndex].attributes.findIndex(each => each.key === 'borrow_amount')
                    const borrow_amount_ust = borrow_amount_index === -1 ? 0 : Number(events[wasmIndex]['attributes'][borrow_amount_index].value) / Math.pow(10, 6)
                    return (
                        <>
                            {
                                depositAmount ? <div className="inline space-between">
                                    <p className="receipt-text font-13">deposit</p>
                                    <div className="center">
                                        <p className="receipt-text font-15">{`${depositAmount / Math.pow(10, 6)} ${getSymbolWithAddress(chain, depositAssetAddr)}`}</p>
                                    </div>
                                </div> : <></>
                            }
                            {
                                borrow_amount_ust ? <div className="inline space-between">
                                    <p className="receipt-text font-13">borrow</p>
                                    <div className="center">
                                        <p className="receipt-text font-15">{`${borrow_amount_ust.toLocaleString('en-US')} UST`}</p>
                                    </div>
                                </div> : <></>
                            }
                        </>
                    )
                } else {
                    const ask_asset_index = events[wasmIndex].attributes.findIndex(each => each.key === "ask_asset")
                    const ask_asset_address = events[wasmIndex].attributes[ask_asset_index].value
                    const ask_asset_symbol = getSymbolWithAddress("", ask_asset_address)
                    const borrow_amount = Number(events[wasmIndex]['attributes'][return_amount_index].value) / Math.pow(10, getDecimalsWithAddress(chain, ask_asset_address));
                    return (
                        <>
                        {
                            depositAmount ? <div className="inline space-between">
                                <p className="receipt-text font-13">deposit</p>
                                <div className="center">
                                    <p className="receipt-text font-15">{`${depositAmount / Math.pow(10, 6)} ${getSymbolWithAddress(chain, depositAssetAddr)}`}</p>
                                </div>
                            </div> : <></>
                        }
                            <div className="inline space-between">
                                <p className="receipt-text font-13">borrow</p>
                                <div className="center">
                                    <p className="receipt-text font-15">{`${borrow_amount.toLocaleString('en-US')} ${ask_asset_symbol}`}</p>
                                </div>
                            </div>
                        </>
                    )
                }
            }
        } else if (props.mode === "fullDegen") {
            let _collateral_amount = 0;
            let _borrow_amount = 0;
            let _collateral_asset = "";
            logs.map(_log => {
                const _wasm_event_attributes = _log.events[_log.events.length - 1].attributes;
                const _lock_attribute_index = _wasm_event_attributes.findIndex(attribute => attribute.key === 'action' && attribute.value === "lock_collateral");
                const _borrow_attribute_index = _wasm_event_attributes.findIndex(attribute => attribute.key === 'action' && attribute.value === "borrow_stable");
                if (_lock_attribute_index !== -1) {
                    const _amount_attribute_index = _wasm_event_attributes.findIndex(attribute => attribute.key === 'collaterals');
                    if (_amount_attribute_index !== -1) {
                        const _text_index_terra = _wasm_event_attributes[_amount_attribute_index].value.indexOf('terra');
                        _collateral_amount += Number(_wasm_event_attributes[_amount_attribute_index].value.slice(0, _text_index_terra));
                        if (!_collateral_asset) _collateral_asset = _wasm_event_attributes[_amount_attribute_index].value.slice(_text_index_terra);
                    }
                }
                if (_borrow_attribute_index !== -1) {
                    const _amount_attribute_index = _wasm_event_attributes.findIndex(attribute => attribute.key === "borrow_amount");
                    if (_amount_attribute_index !== -1) {
                        _borrow_amount += Number(_wasm_event_attributes[_amount_attribute_index].value);
                    }
                }
            })
            const _collateral_asset_symbol = getSymbolWithAddress(chain, _collateral_asset);
            const _collateral_asset_decimal = getDecimalsWithAddress(chain, _collateral_asset)
            return (
            <>
                <div className="inline space-between mb-10">
                    <p className="receipt-text font-13">deposited</p>
                    <div className="center">
                        <p className="receipt-text font-15">{`${(_collateral_amount / Math.pow(10, _collateral_asset_decimal)).toLocaleString('en-US')} ${_collateral_asset_symbol}`}</p>
                    </div>
                </div>
                <div className="inline space-between">
                    <p className="receipt-text font-13">borrowed</p>
                    <div className="center">
                        <p className="receipt-text font-15">{`${(_borrow_amount / Math.pow(10, 6)).toLocaleString('en-US')} UST`}</p>
                    </div>
                </div>
            </>
            )
        } else {
            const events = logs[0].events;
            const attributes = events[events.length - 1].attributes
            const _repay_amount = (Number(attributes[attributes.length - 1].value) / Math.pow(10, 6));
            return (
            <>
                <div className="inline space-between mb-10">
                    <p className="receipt-text font-13">repay</p>
                    <div className="center">
                        <p className="receipt-text font-15">{`${_repay_amount.toLocaleString('en-US')} UST`}</p>
                    </div>
                </div>
            </>)
        }
    }

    return (
        <div id="myModal" className="modal">
            <div className="modal-content text-center">
            {/* loading */}
            {
                status === STATUS.LOADING && (
                    <>
                        <div className="loader"></div>
                        <p className="loading-text mb-8">Wait For Receipt...</p>
                        <p className="receipt-text mb-40 font-14">Please wait while your request is being processed</p>
                        <div className="hash-link-div mb-40">
                            <div className="background" />
                            <p className="receipt-text font-13">Request ID</p>
                            <a className="receipt-text font-15 decoration_under" href={`https://finder.terra.money/${lcd.config.chainID === 'columbus-5' ? 'mainnet' : 'testnet'}/tx/${hash}`} target="_blank">{hash?.slice(0, 14)}</a>
                        </div>
                    </>
                )
            }

            {/* failed */}
            {
                status === STATUS.FAILURE && (
                    <>
                        <img className="modal-icon mb-36 mt-40" src={iconFail}/>
                        <p className="loading-text mb-8 mt-14">User Denied</p>
                        <p className="receipt-text mb-40 font-14">Please wait while your request is being processed</p>
                        <div className="pr-40 pl-40">
                            <button className="farm-btn mb-28" onClick={_onTryAgain}>
                                <img src={iconRetry} className="mr-4" />
                                <span>Try Again</span>
                            </button>
                        </div>
                    </>
                )
            }

            {/* Success */}
            {
                status === STATUS.SUCCESS && (
                    <>
                        <img className="modal-icon mb-36 mt-40" src={iconDone}/>
                        <p className="loading-text mb-8 mt-14">Done!</p>
                        <p className="receipt-text mb-24 font-14">Transaction approved from wallet.</p>
                        <hr/>
                        <div className="receipt-details mb-18">
                            <div className="background" />
                            <TransactionResult />
                        </div>
                        <div className="hash-link-div mb-38">
                            <p className="receipt-text font-13">Tx Hash</p>
                            <a className="receipt-text font-15 decoration_under" href={`https://finder.terra.money/${lcd.config.chainID === 'columbus-5' ? 'mainnet' : 'testnet'}/tx/${hash}`} target="_blank">{hash.slice(0, 14)}</a>
                        </div>
                        <div className="confirm-div">
                            <button className="farm-btn mb-28 w-100" onClick={() => onConfirm()}>
                                <span>Done</span>
                            </button>
                        </div>
                    </>
                )
            }

            {/* Success End */}
            
            </div>
        </div>
    )
}

export default Wait
        