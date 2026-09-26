import { B2BTable } from './B2BRatesTable'
import { B2CTable } from './B2CRatesTable'

export const RateCardTable = (props) => {
  return props.businessType?.toLowerCase() === 'b2c' ? (
    <B2CTable {...props} />
  ) : (
    <B2BTable {...props} />
  )
}
