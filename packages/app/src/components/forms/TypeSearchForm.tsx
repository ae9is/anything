import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import logger from 'logger'
import { Filter, parseSearchString } from 'utils'
import { TextInput } from '../input/TextInput'

export interface TypeSearchFormProps {
  onSubmit: (filter?: Filter) => void
}

const validationSchema = Yup.object().shape({
  sortKeyExpression: Yup.string().nullable(),
  filterExpression: Yup.string().nullable(),
  attributeNames: Yup.string().nullable(),
  attributeValues: Yup.string().nullable(),
})

export function TypeSearchForm({
  onSubmit,
}: TypeSearchFormProps) {
  function handleSubmit(values: Values, { setSubmitting }: FormikHelpers<Values>) {
    const searchString = values?.searchString ?? undefined
    try { 
      const filter = parseSearchString(searchString)
      onSubmit?.(filter)
    } catch (e) {
      logger.error(`Error parsing search string ${searchString}`)
      onSubmit?.(undefined)
    }
    setSubmitting(false)
  }

  interface Values {
    searchString: string
  }

  const initialValues = {
    searchString: '',
  }

  return (
    <div className="w-full">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="flex flex-col lg:flex-row lg:items-end">
              <TextInput
                id={'searchString'}
                labelText="Search string"
                placeholder={'author = "user1" and count > 5'}
                error={errors.searchString}
                touched={touched.searchString}
                className="lg:ml-4 grow"
              />
              <button className="mt-4 lg:mt-0 lg:ml-4 btn btn-primary" type="submit">
                Search
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
