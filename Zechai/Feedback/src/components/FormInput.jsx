export default function FormInput({
  label, id, type = 'text', textarea = false, rows = 3,
  required = false, placeholder = '', value, onChange, hint,
}) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id} name={id} rows={rows} required={required}
          placeholder={placeholder} value={value} onChange={onChange}
          className="form-input resize-none"
        />
      ) : (
        <input
          id={id} name={id} type={type} required={required}
          placeholder={placeholder} value={value} onChange={onChange}
          className="form-input"
        />
      )}
      {hint && <p className="font-mono text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
