import { Passthrough } from '../../lib/props'

export interface LabelProps
  extends Passthrough,
    React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement> {
  altText?: string
}

export function Label({ children, altText }: LabelProps) {
  return (
    <label className="label">
      <span className="label-text">{children}</span>
      <span className="label-text-alt">{altText}</span>
    </label>
  )
}
