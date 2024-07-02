import { MenuDetail } from 'constant/interface'
import React, { useState, useEffect } from 'react'

interface SubMenuProps {
    data: MenuDetail[]
}

export default function MobileSubMenu ({ data }: SubMenuProps) {
    const [isDisplay, setDisplay] = useState<boolean>(false)

    const toggleDisplay = () => {
        setDisplay(!isDisplay)
    }
    return(
        <div className='menu-icon-div'>
            <a className='menu-icon' onClick={toggleDisplay}>...</a>
            <div className={isDisplay ? '' : 'hidden'}>
                {
                    data.map((each, index) => (
                            <a className='menu-icon' href={each.link}>{each.name}</a>
                    ))
                }
            </div>
        </div>
    )
}