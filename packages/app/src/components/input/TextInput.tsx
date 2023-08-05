// A text input with labels and errors for use inside a Formik Form
//
// For ex:
//  <Formik
//    initialValues={{ myInput: '' }}
//    validationSchema={Yup.object().shape({ myInput: Yup.string().required('Required')})}
//    onSubmit={handleSubmit}
//  >
//    {({ errors, touched }) => (
//      <Form>
//        <TextInput
//          id="myInput"
//          labelText="My input"
//          placeholder="input123"
//          error={errors.myInput}
//          touched={touched.myInput}
//        />
//        <button className="btn" type="submit">
//          Search
//        </button>
//      </Form>
//    )}
//  </Formik>

import { Field } from 'formik'
import { Passthrough } from '../../lib/props'
import { Label } from './Label'

export interface TextInputProps extends Passthrough {
  id: string
  error?: string
  touched?: boolean
  labelText?: string
  placeholder?: string
  className?: string
  rest?: any
}

export function TextInput({
  //
  id,
  error,
  touched,
  labelText,
  placeholder = 'Type here',
  className,
  ...rest
}: TextInputProps) {
  return (
    <div className={className}>
      {labelText && <Label htmlFor={id}>{labelText}</Label>}
      <Field
        id={id}
        name={id}
        placeholder={placeholder}
        className="input input-bordered w-full placeholder:italic"
        {...rest}
      />
      {error && touched ? (
        <label className="label">
          <span className="label-text-alt"></span>
          <span className="label-text-alt text-error">{error}</span>
        </label>
      ) : null}
    </div>
  )
}
