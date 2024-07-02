import React, { useState, useEffect } from 'react'

interface MenuProps {
    name: string
    link: string
}

export default function MenuIcon ({ name, link }: MenuProps) {
    return(
        <div className='menu-icon-div'>
            <a className='menu-icon' href={link}>{name}</a>
        </div>
    )
}