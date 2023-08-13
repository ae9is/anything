import { useRef } from 'react'

export interface ModalProps {
  modalTitle?: string
  modalText?: string
  onConfirm?: () => void
  children?: React.ReactNode
}

export function Modal({
  modalTitle,
  modalText = 'Are you sure?',
  onConfirm,
  children,
}: ModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null)

  function showModal() {
    modalRef?.current?.showModal()
  }

  function closeModal() {
    modalRef?.current?.close()
  }

  return (
    <>
      <div onClick={showModal}>
        {children}
      </div>
      <dialog ref={modalRef} className="modal">
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
