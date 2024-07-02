import React, { useState, useEffect } from 'react'
import LOOPLogo from 'assets/img/LOOPLogo.svg'
import LOOPLogo_mobile from 'assets/img/LOOPLogo_mobile.svg'
import v2 from 'assets/img/v2.svg'
import beta from 'assets/img/beta.svg'

export default function Logo () {
    return(
        <>
            <div className='loop-logo isDesktop'>
                <img src={LOOPLogo} className='mb-2' height='55' />
                <img src={v2} className='mr-3' />
            </div>
            <div className='loop-logo isMobile'>
                <img src={LOOPLogo_mobile} className='mb-2' />
                <img src={beta} className='mr-3' />
            </div>
        </>
    )
}