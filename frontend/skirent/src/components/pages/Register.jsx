export default function Register({ onBackClick, onSuccess }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Register</h2>

      <button onClick={onSuccess}>Register (demo)</button>
      <br />
      <button onClick={onBackClick}>Back</button>
    </div>
  );
}
