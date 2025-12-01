import React from 'react';
import './Modal.css'; 

function ConfirmationModal({ 
  message, 
  onConfirm, 
  onCancel, 
  isOpen, 
  showPaymentInput, 
  paymentAmount, 
  onPaymentChange 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>

        {showPaymentInput && (
          <input
            type="number"
            step="0.01"
            placeholder="Monto pagado"
            value={paymentAmount}
            onChange={e => {
              console.log("Valor ingresado en input:", e.target.value);
              onPaymentChange(e.target.value);   
            }}
            style={{ margin: '10px 0', padding: '5px', width: '100%' }}
          />
        )}

        <div className="modal-actions">
          <button onClick={onCancel} className="secondary">Cancelar</button>
          <button onClick={() => onConfirm(paymentAmount)}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
