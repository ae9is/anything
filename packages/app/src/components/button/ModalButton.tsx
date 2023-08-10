import { useRef } from 'react'

export interface ModalButtonProps {
  buttonText?: string
  modalTitle?: string
  modalText?: string
  onConfirm?: () => void
}

export function ModalButton({
  buttonText = 'Click me',
  modalTitle,
  modalText = 'Are you sure?',
  onConfirm,
  ...rest
}: ModalButtonProps) {
  const modalRef = useRef<HTMLDialogElement>(null)

  function showModal() {
    modalRef?.current?.showModal()
  }

  function closeModal() {
    modalRef?.current?.close()
  }

  return (
    <>
      <button className="mt-4 lg:mt-0 lg:ml-4 btn btn-primary" type="submit" onClick={showModal}>
        {buttonText}
      </button>
      <dialog ref={modalRef} className="modal" {...rest}>
        <form method="dialog" className="modal-box">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          {modalTitle && (<h3 className="font-bold text-lg">{modalTitle}</h3>)}
          <p className="py-4">{modalText}</p>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={onConfirm}>
              OK
            </button>
            <button className="btn" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  )
}
