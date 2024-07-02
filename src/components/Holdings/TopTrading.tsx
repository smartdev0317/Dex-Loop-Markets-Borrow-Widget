import Card from "../Card"
import PairTVLList from "./PairTVLList"
import {bound} from "../../components/Boundary"
import { getICon2} from "../../routes"
import styles from "./TopTrading.module.scss"
import { useState } from "react"
import Tooltip from "../../components/Tooltip"
import TooltipContainer from "../static/TooltipContainer"
import classNames from "classnames"

const TopTrading = () => {
  const [selectedTokens, setSelectTokens] = useState<{ token: string, isSelected: boolean}[]>([
    {token: 'UST', isSelected: false},
    {token: 'AUST', isSelected: false},
    {token: 'LOOP', isSelected: false},
    {token: 'LUNA', isSelected: false}
  ]);

  const onClick = (token: string) => {
    setSelectTokens([...selectedTokens.map(item => item.token == token ? { ...item, isSelected: !item.isSelected } : item)])
  }

  return (
    <div className="tradingCard">
      <Card title={<>Top Trading Assets <span className={styles.headerTokens}>{selectedTokens.map((item) => <Tooltip
                                  content={<TooltipContainer><h3>Filter by {item?.token?.toUpperCase() ?? 'token'}</h3></TooltipContainer>}>
        <div className={classNames(styles.token, item.isSelected ? styles.active: '')}>
        <img
          style={{ width: "30px", borderRadius: "25px", opacity: item.isSelected ? 1 : 0.4 }}
          src={getICon2(item.token ?? '')}
          
          onClick={() => onClick(item.token ?? '')}
          alt=" "
        />
        </div>
      </Tooltip>)}</span></>} >
          { bound(<PairTVLList tokens={selectedTokens?.filter((item) => item.isSelected).map((item) => item.token)} />)}
      </Card>
    </div>
  )
}

export default TopTrading
