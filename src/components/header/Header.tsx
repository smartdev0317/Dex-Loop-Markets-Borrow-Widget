import React, { useState, useEffect } from 'react'
import Logo from './Logo'
import Menu from '../menu/Menu'
import Connect from '../../layouts/Connect'
// import ConnectWalletButton from './ConnectWalletButton'
import SocialDropdown from "../SocialDropdown/SocialDropdown"

export default function Header () {

    return(
        <div className='header'>
            <Logo />
            <Menu />
            <div className="isDesktop">
                <div className="mr-12">
                    <SocialDropdown />
                </div>
                <Connect />
            </div>
        </div>
    )
}