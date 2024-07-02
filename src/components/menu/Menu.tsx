import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import DehazeIcon from '@mui/icons-material/Dehaze';
import ConnectWalletButton from '../header/ConnectWalletButton'
import MenuIcon from './MenuIcon'
import { MenuDetail } from 'constant/interface'
import { fetchMenu } from 'utils/menu'
import { styled } from '@mui/material/styles';
import SubMenu from './SubMenu';

const CustomDehazeIcon = styled(DehazeIcon)(({theme}) => ({
    '&': {
        fill: 'white',
        background: '#1B1B1B',
        padding: '6px 10px',
        borderRadius: '10px'
    }
}))

const CustomDrawer = styled(Drawer)(({theme}) => ({
    '& .MuiPaper-root': {
        backgroundColor: '#1B1B1B'
    },
    '& .MuiTypography-root': {
        color: '#9BB0CF',
        fontFamily: 'Lexend',
        fontSize: '20px'
    },
    '& .MuiListItem-root a:hover .MuiTypography-root': {
        color: '#C83E93'
    }
}))

export default function Menu () {

    const [mainMenu, setMainMenu] = useState<MenuDetail[]>()
    const [subMenu, setSubMenu] = useState<MenuDetail[]>()
    const [active, setActive] = useState<number>(0)
    const [isDrawer, setDrawer] = useState<boolean>(false)
    useEffect(() => {
        fetchMenu((data: any) => {
            data.map(each => {
                Object.keys(each)[0] === 'mainMenu' ? setMainMenu(each.mainMenu) : setSubMenu(each.subMenu)
            })
        })
        const timer1 = setInterval(() => {
            fetchMenu((data: any) => {
                data.map(each => {
                    Object.keys(each)[0] === 'mainMenu' ? setMainMenu(each.mainMenu) : setSubMenu(each.subMenu)
                })
            })
        }, 60000)
        return () => clearInterval(timer1)
    }, [])

    const toggleDrawer = () => {
        setDrawer(!isDrawer)
    }

    const list = () => (
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer}
        >
          <List>
            {mainMenu?.map((d, i) => (
              <ListItem key={`menu-mobile-${i}`}>
                  <a href={d.link} className='width-100'>
                    <ListItemText primary={d.name} />
                  </a>
              </ListItem>
            ))}
            {
                subMenu?.map((d, i) => (
                    <ListItem key={`menu-mobile-${i}`}>
                        <a href={d.link} className='width-100'>
                          <ListItemText primary={d.name} />
                        </a>
                    </ListItem>
            ))}
          </List>
        </Box>
    );

    return(
        <>
            <div className='menu isDesktop'>
                {
                    mainMenu?.map((d, i) => (
                        <MenuIcon
                            key={`mainMenu-${i}`}
                            name={d.name}
                            link={d.link}
                        />
                    ))
                }
                {
                    subMenu &&
                        <SubMenu
                            data={subMenu}
                        />
                }
            </div>
            <div className='isMobile'>
                <Button className='toggleMenuBtn' onClick={toggleDrawer}>
                    <CustomDehazeIcon
                        fontSize='large'
                    />
                </Button>
                <CustomDrawer
                    anchor='left'
                    open={isDrawer}
                    onClose={toggleDrawer}
                >
                    <div style={{height: "70px"}}></div>
                    <div className='inline content-center align-center' style={{backgroundColor: '#131313', width: '100%', margin: '20px 0px'}}>
                        <ConnectWalletButton />
                    </div>
                    {list()}
                </CustomDrawer>
            </div>
        </>
    )
}