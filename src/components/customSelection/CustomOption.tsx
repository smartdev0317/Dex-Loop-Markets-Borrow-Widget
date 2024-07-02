import React from 'react'

interface dataDetail {
    icon: string,
    title: string,
    url: string
}

export default function CustomSelect (data: dataDetail) {

    return(
        <a>
            <img src={data.icon} />
            <p>{data.title}</p>
        </a>
    )
}