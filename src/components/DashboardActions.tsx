import { Link, LinkProps } from "react-router-dom"
import Tippy from "@tippyjs/react"
import { useRecoilState } from 'recoil';
import { DropdownTippyProps } from "./Tooltip"
import Icon from "./Icon"
import Dropdown from "./Dropdown"
import styles from "./DashboardActions.module.scss"
import { swapAssetState } from 'data/swapAsset'
import { Button } from "@mui/material";
import { styled } from '@mui/material/styles';

const SwapButton = styled(Button)(({ theme }) => ({
  '&': {
    color: '#C83E93 !important',
    padding: "0px"
  }
}))

const DashboardActions = ({ tokenInfo }: { tokenInfo: AssetInfo | NativeInfo }) => {
  const [swapAsset, setSwapAsset] = useRecoilState<AssetInfo | NativeInfo>(swapAssetState);
  const onClick = () => {
    setSwapAsset(tokenInfo)
  }
  const links = [<SwapButton onClick={onClick} variant="text">Swap</SwapButton>]
  return (
    <Tippy {...DropdownTippyProps} render={() => <Dropdown list={links} />}>
      <button className={styles.trigger}>
        <Icon name="more_horiz" size={18} />
      </button>
    </Tippy>
  )
}

export default DashboardActions
