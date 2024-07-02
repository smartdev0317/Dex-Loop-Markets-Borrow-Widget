import React, { useState, useEffect } from 'react'
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';

interface loadingProps {
    state: boolean
}

const CustomBackdrop = styled(Backdrop)(({ theme }) => ({
    '&': {
        position: 'absolute !important',
        opacity: '1 !important',
        borderRadius: '15px',
        background: 'transparent'
    }
}))

export default function Loading({ state }: loadingProps) {
    return (
        <CustomBackdrop
            sx={{ color: '#fff', zIndex: 100 }}
            open={state}
        >
            <CircularProgress color="inherit" />
        </CustomBackdrop>
    )
}