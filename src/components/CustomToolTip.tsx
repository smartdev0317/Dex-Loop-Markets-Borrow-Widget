import React from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

interface CustomToolTipInterface {
    title: string,
    height: string,
    color: string
}

export default function CustomToolTip ({title, height, color}: CustomToolTipInterface) {
    return (
        <Tooltip title={title} placement='top' sx={{padding: 0}}>
            <IconButton>
                <InfoOutlinedIcon className={color} fontSize='small' sx={{height: height}} />
            </IconButton>
        </Tooltip>
    )
}