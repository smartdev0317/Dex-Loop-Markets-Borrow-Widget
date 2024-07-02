import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useConnectedWallet } from '@terra-money/wallet-provider'
import NorthEastIcon from '@mui/icons-material/NorthEast'
import Grid from '@mui/material/Grid';
import { CollateralDetail, BorrowDetail, Transaction } from 'constant/interface'

interface propsInterface {
    transactions: Transaction[]
}

export default function TransactionHistoryContainer ({ transactions }: propsInterface) {

    return transactions.length ? (
                <Grid container>
                    <Grid item xs={12} sm={12} md={5}>
                        <div className='anchor-position-sub-container m-14 mt-0'>
                            <div className='px-15 py-12 box-border'>
                                <div className='inline align-center mb-6'>
                                    <p className='font-12 blue-color m-0'>Transaction History</p>
                                </div>
                            </div>
                            <table className='transaction-history-table'>
                                <thead>
                                    <tr>
                                        <th>time</th>
                                        <th>txhash</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        transactions.map((t, i) => (
                                            <tr key={`collateral-${i}`}>
                                                <td className='text-center'>
                                                    {t.time}
                                                </td>
                                                <td>
                                                    <a href={t.link} target='_blank' className='width-100 inline align-center content-center'>
                                                        <p>{`${t.txhash.slice(0,5)}...${t.txhash.slice(t.txhash.length - 5, t.txhash.length)}`}</p>
                                                        <NorthEastIcon />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </Grid>
                </Grid>
            ) : (<></>)
}