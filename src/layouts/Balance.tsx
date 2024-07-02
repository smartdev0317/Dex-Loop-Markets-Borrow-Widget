import {LOOP, SMALLEST, UST} from "../constants"
import { AccountInfoKey } from "../hooks/contractKeys"
import WithResult from "../containers/WithResult"
import {div} from "../libs/math";
import {commas, decimal} from "../libs/parse";

const Balance = ({ustAmount, loopAmount}) => {
  const renderError = () => <p className="red">Error</p>

  return (
    <WithResult
      keys={[AccountInfoKey.UUSD]}
      renderError={renderError}
      size={21}
    >
      {
        loopAmount && <div className="connect-button-balance-color">{commas(decimal(div(loopAmount, SMALLEST), 2))} <span className="white">{LOOP}</span></div>
      }
      {
        !loopAmount && <div className="connect-button-balance-color">{commas(decimal(ustAmount, 2))}  <span className="white">{ UST}</span></div>
      }
    </WithResult>
  )
}

export default Balance
