import React from 'react'
import CustomToolTip from 'components/CustomToolTip';

interface BorrowSliderInterface {
    initPercent?: number,
    percent: number,
    borrowLimit: number,
    isFetched: boolean,
    margin?: string,
    noTooltip?: Boolean,
    noDetails?: boolean
}

export default function AnchorBorrowSlider ({ initPercent, percent, borrowLimit, isFetched, margin, noTooltip, noDetails }: BorrowSliderInterface) {
    if (percent > 100) percent = 100
    const getStyle = () => {
        const _style = {
            margin: "0"
        };
        if (margin) _style.margin = margin
        // if (!percent || percent < 10) _style.opacity = "0.3"
        return _style
    }
    const getOpacity = (percent) => {
        const _style = {
            opacity: "1"
        };
        if (!percent || percent === 0) _style.opacity = "0"
        // if (!percent || percent < 10) _style.opacity = "0.3"
        return _style
    }
    if (percent === initPercent) {
        return(
            <>
                <div className={`inline space-between ${noDetails ? 'hidden' : ''}`} style={margin ? {margin: margin} : {}}>
                    <div className='inline align-center'>
                        <p className='font-10 blue-color'>Borrow Usage</p>
                        <CustomToolTip
                            title='Borrow Usage'
                            height='11px'
                            color='blue-color'
                        />
                    </div>
                </div>
                <div className='borrow-slider' style={getStyle()}>
                    <div className={`active-borrow-slider left-border-radius-3 right-border-radius-3 p-relative ${!isFetched ? 'hidden' : ''}`} style={{width: `${percent || 0}%`}}>
                        {/* <p className={`borrow-position-text`} style={noTooltip ? {display: 'none'} : {}}>{`${percent || 0}%`}</p> */}
                        <p className={`borrow-position-text`} style={getOpacity(percent)}>{`${percent || 0}%`}</p>
                    </div>
                </div>
            </>
        )
    } else if (percent > initPercent) {
        return(
            <>
                <div className={`inline space-between ${noDetails ? 'hidden' : ''}`} style={margin ? {margin: margin} : {}}>
                    <div className='inline align-center'>
                        <p className='font-10 blue-color'>Borrow Usage</p>
                        <CustomToolTip
                            title='Borrow Usage'
                            height='11px'
                            color='blue-color'
                        />
                    </div>
                </div>
                <div className='borrow-slider' style={getStyle()}>
                    <div className={`active-borrow-slider left-border-radius-3 p-relative ${!isFetched ? 'hidden' : ''}`} style={{width: `${initPercent || 0}%`}}>
                        {/* <p className={`borrow-position-text`} style={noTooltip ? {display: 'none'} : {}}>{`${percent || 0}%`}</p> */}
                        <p className={`borrow-position-text`} style={getOpacity(initPercent)}>{`${initPercent || 0}%`}</p>
                    </div>
                    <div className={`additional-borrow-slider right-border-radius-3 p-relative ${!isFetched ? 'hidden' : ''}`} style={{width: `${percent - initPercent || 0}%`}}>
                        {/* <p className={`borrow-position-text`} style={noTooltip ? {display: 'none'} : {}}>{`${percent || 0}%`}</p> */}
                        <p className={`additional-borrow-position-text`} style={getOpacity(percent)}>{`${percent || 0}%`}</p>
                    </div>
                </div>
            </>
        )
    } else {
        return(
            <>
                <div className={`inline space-between ${noDetails ? 'hidden' : ''}`} style={margin ? {margin: margin} : {}}>
                    <div className='inline align-center'>
                        <p className='font-10 blue-color'>Borrow Usage</p>
                        <CustomToolTip
                            title='Borrow Usage'
                            height='11px'
                            color='blue-color'
                        />
                    </div>
                </div>
                <div className='borrow-slider' style={getStyle()}>
                    <div className={`active-borrow-slider left-border-radius-3 p-relative ${!isFetched ? 'hidden' : ''}`} style={{width: `${percent || 0}%`}}>
                        {/* <p className={`borrow-position-text`} style={noTooltip ? {display: 'none'} : {}}>{`${percent || 0}%`}</p> */}
                        <p className={`additional-borrow-position-text`} style={getOpacity(initPercent)}>{`${percent || 0}%`}</p>
                    </div>
                    <div className={`additional-borrow-slider-second right-border-radius-3 p-relative ${!isFetched ? 'hidden' : ''}`} style={{width: `${initPercent - percent || 0}%`}}>
                        {/* <p className={`borrow-position-text`} style={noTooltip ? {display: 'none'} : {}}>{`${percent || 0}%`}</p> */}
                        <p className={`borrow-position-text`} style={getOpacity(percent)}>{`${initPercent || 0}%`}</p>
                    </div>
                </div>
            </>
        )
    }
}