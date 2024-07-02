import Holdings from "./Holdings"
import {bound} from "../Boundary"
import Placeholder from "./Placeholder"

const MyHoldingList = () => {
    return (
        bound( <Holdings />, <Placeholder title={'Liquid Tokens'} />)
    )
}

export default MyHoldingList
