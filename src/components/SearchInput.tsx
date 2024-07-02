import React, { useState, useEffect } from 'react'
import { ConnectType, Timeout, useConnectedWallet, useLCDClient } from '@terra-money/wallet-provider'
import SearchIcon from '@mui/icons-material/Search';
import { searchToken } from 'utils/searchToken';
// import useLCDClient from 'graphql/useLCDClient'

interface propsInterface {
    onChange: Function
}
export default function SearchInput ({ onChange }: propsInterface) {

    const lcd = useLCDClient()
    // const lcd = useLCDClient()?.terra

    const _searchToken = (e: any) => {
        const data = e.target.value
        // searchToken(lcd, data).then((res: any) => {
        //     console.log(res)
        // })
        onChange(data)
    }
    return(
        <div className='p-relative'>
            <input type='text' className='search-input' onChange={_searchToken} />
            <button type='button' className='search-button'><SearchIcon /></button>
        </div>
    )
}