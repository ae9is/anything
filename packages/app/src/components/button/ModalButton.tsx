import { Modal } from '../modal/Modal'

export interface ModalButtonProps {
  buttonText?: string
  modalTitle?: string
  modalText?: string
  onConfirm?: () => void
  disabled?: boolean
}

export function ModalButton({
  buttonText = 'Click me',
  modalTitle,
  modalText = 'Are you sure?',
  onConfirm,
  disabled = false,
  ...rest
}: ModalButtonProps) {
  return (
    <Modal
      modalTitle={modalTitle}
      modalText={modalText}
      onConfirm={onConfirm}
      {...rest}
    >
      <button disabled={disabled} className="mt-4 lg:mt-0 lg:ml-4 btn btn-primary" type="submit">
        {buttonText}
      </button>
    </Modal>
  )
}
