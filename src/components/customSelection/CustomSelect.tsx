import React from 'react'
import CustomOption from './CustomOption'

interface dataDetail {
    icon: string,
    title: string,
    url: string
}

interface props {
    data: dataDetail[]
}

export default function CustomSelect ({ data }:props) {

    return(
        <div>
            {data.map(d => {
                <CustomOption
                    icon={d.icon}
                    title={d.title}
                    url={d.url}
                />
            })}
        </div>
    )
}