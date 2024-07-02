import styles from "./Holdings.module.scss"
import LoadingPlaceholder from "../static/LoadingPlaceholder"
import {div} from "../../libs/math"
import Card from "../Card"
import ProgressLoading from "../static/ProgressLoading"

const Placeholder = ({title}:{title: string}) => {

    return (
        <Card
            title={title ?? ''}
            headerClass={styles.header}
            description={<><LoadingPlaceholder size={'sm'} color={'pink'} /></>}
        ><div className="dashboardLoaderInline">
            <ProgressLoading />
        </div> </Card>
    )
}

export default Placeholder
