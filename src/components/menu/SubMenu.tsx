import { MenuDetail } from 'constant/interface'
import React, { useState, useEffect } from 'react'

interface SubMenuProps {
    data: MenuDetail[]
}

export default function SubMenu ({ data }: SubMenuProps) {
    return(
        <div className='menu-icon-div nav__menu-item'>
            {/* <a className='menu-icon' href={link}>{name}</a> */}
            <a className='menu-icon'>...</a>
            <ul className="nav__submenu">
                {
                    data.map((each, index) => (
                        <li className="nav__submenu-item" key={`submenu-${index}`}>
                            <a className='submenu-icon' href={each.link}>{each.name}</a>
                        </li>
                    ))
                }
            </ul>
        </div>
    )
}