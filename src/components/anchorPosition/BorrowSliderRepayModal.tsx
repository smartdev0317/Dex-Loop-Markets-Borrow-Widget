import React from 'react'
import CustomToolTip from 'components/CustomToolTip';

interface BorrowSliderInterface {
    percent: number,
    borrowLimit: number,
    isFetched: boolean,
    margin?: string,
    noTooltip?: Boolean,
    activeCollateral?: string,
    noDetails?: boolean
}

export default function AnchorBorrowSliderRepayModal ({ percent, borrowLimit, isFetched, margin, noTooltip, activeCollateral, noDetails }: BorrowSliderInterface) {
    // console.log(percent)
    const getStyle = () => {
        const _style = {
            marginTop: "0px"
        };
        // if (!percent || percent < 10) _style.opacity = "0.3"
        return _style
    }
    const getOpacity = () => {
        const _style = {
            opacity: "1"
        };
        if (!percent || percent === 0) _style.opacity = "0"
        // if (!percent || percent < 10) _style.opacity = "0.3"
        return _style
    }
    return(
        <>
            <div className='borrow-slider' style={getStyle()}>
                <div className={`active-borrow-slider p-relative ${!isFetched ? 'hidden' : ''}`} style={{width: `${percent || 0}%`}}>
                    {/* <p className={`borrow-position-text`} style={noTooltip ? {display: 'none'} : {}}>{`${percent || 0}%`}</p> */}
                    {/* <p className={`borrow-position-text`} style={getOpacity()}>{`${percent || 0}%`}</p> */}
                </div>
            </div>
            <div className={`inline space-between ${noDetails ? 'hidden' : ''} mt-5`}>
                <div className='inline align-center'>
                    <p className='font-10 blue-color'>Borrow Usage</p>
                    <CustomToolTip
                        title='Borrow Usage'
                        height='11px'
                        color='blue-color'
                    />
                </div>
            </div>
        </>
    )
}