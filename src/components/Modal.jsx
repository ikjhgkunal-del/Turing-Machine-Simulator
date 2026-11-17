import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    dialog.querySelector('button')?.focus();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  function keepFocus(event) {
    if (event.key !== 'Tab') return;
    const controls = [...ref.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" aria-modal="true" onCancel={onClose} onKeyDown={keepFocus}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-inner">
      <div className="section-heading"><span className="eyebrow">PROJECT ENIGMA / FIELD NOTES</span><button className="icon-button" aria-label="Close" onClick={onClose}><Icon name="close" /></button></div>
      <h2 id="modal-title">{title}</h2>
      {children}
      <button className="button primary" onClick={onClose}>Understood <Icon name="check" /></button>
    </div>
  </dialog>;
}
