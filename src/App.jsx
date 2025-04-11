import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./routes/Router";

function App() {
  return (
    <AuthProvider>
      <AppRouter/>
    </AuthProvider>
  )
}

export default App;
