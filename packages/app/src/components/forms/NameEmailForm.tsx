import { TextInput } from '../input/TextInput'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { Passthrough } from '../../lib/props'

export interface NameEmailFormProps extends Passthrough {
  onSubmit: (
    sortKeyExpression: string,
    filterExpression: string,
    attributeNames: Record<string, string>,
    attributeValues: Record<string, any>
  ) => void
}

const validationSchema = Yup.object().shape({
  firstName: Yup.string().min(2, 'Too Short!').max(50, 'Too Long!').required('Required'),
  lastName: Yup.string().min(2, 'Too Short!').max(50, 'Too Long!').required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  //age: Yup.number().required().positive().integer(),
  //website: Yup.string().url().nullable(),
  //createdOn: Yup.date().default(() => new Date()),
})

export function NameEmailForm({
}: NameEmailFormProps) {

  function handleSubmit(values: Values, { setSubmitting }: FormikHelpers<Values>) {
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2))
      setSubmitting(false)
    }, 500)
  }

  interface Values {
    firstName: string
    lastName: string
    email: string
  }

  const initialValues = {
    firstName: '',
    lastName: '',
    email: '',
  }

  return (
    <div className="container">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <TextInput
              id={'firstName'}
              labelText="First Name"
              placeholder={'John'}
              error={errors.firstName}
              touched={touched.firstName}
            />
            <TextInput
              id={'lastName'}
              labelText="Last Name"
              placeholder={'Wick'}
              error={errors.lastName}
              touched={touched.lastName}
            />
            <TextInput
              id={'email'}
              labelText="Email"
              placeholder={'john@example.com'}
              error={errors.firstName}
              touched={touched.firstName}
              type="email"
            />
            <button className="btn" type="submit">
              Search
            </button>
          </Form>
        )}
      </Formik>
    </div>
  )
}
