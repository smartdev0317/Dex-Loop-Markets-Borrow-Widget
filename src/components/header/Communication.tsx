import React, { useState, useEffect } from 'react'
import telegram from 'assets/img/telegram.svg'
import CustomSelect from 'components/customSelection/CustomSelect'

export default function Communication () {
    const data = [
        {
            icon: telegram,
            title: 'telegram',
            url: ''
        }
    ]
    return(
        <CustomSelect
            data={data}
        />
    )
}