import React from 'react';
import './Modal.css'; 

function AlertModal({ message, onClose, isOpen }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;