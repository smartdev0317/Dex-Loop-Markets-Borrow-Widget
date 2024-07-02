import React from "react"
import styles from "./FarmApyTooltipContent.module.scss"
import classNames from "classnames/bind"
import { plus } from "../libs/math"

interface FarmTooltip{
  apr:any,
  tx_fee_apy:any,
  apy:any,
  symbol:any,
  rewards?:any,
  isSimplified?:boolean
}

const farmApyTooltipContent = ({ apr, tx_fee_apy, apy, symbol,rewards,isSimplified=false }:FarmTooltip) => {

  return (
    <div className={styles.tolBox}>
      <div className={styles.d_flex_col}>
        <span className={classNames(styles.d_flex_col)}>
          <h3>Current APY</h3>
          <h2 className={styles.blue}>{apy}%</h2>
        </span>
        {isSimplified ? 

        (<span className={classNames(styles.d_flex_col, styles.pt10)}>
        <h3>Breakdown:</h3> 
           <h3>
             Tx Fees : {tx_fee_apy}% APR
           </h3>
           <h3>
             Rewards: {rewards}% APR
           </h3>
        </span>)

        :
        <span className={classNames(styles.d_flex_col, styles.pt10)}>
        <h3>Breakdown:</h3>
        {tx_fee_apy}
      </span>

        }
       
        <span>
          {symbol == "LunaX_uluna" && (
            <h3>SD APR 11.6% (excluded from weekly compounding estimation)</h3>
          )}
        </span>
        <span>
          <h3>
            = Total {apr}% APR or{" "}
            {apy}% APY*
          </h3>
        </span>

        <span className={classNames(styles.d_flex_col, styles.pt10)}>
          <h3>Annual Percentage Yield, if compounded weekly by user</h3>
        </span>
      </div>
    </div>
  )
}

export default farmApyTooltipContent
