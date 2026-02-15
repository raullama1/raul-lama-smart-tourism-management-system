// client/src/App.jsx
import AppRouter from "./router/AppRouter";
import { NotificationProvider } from "./context/NotificationContext";
import { AgencyAuthProvider } from "./context/AgencyAuthContext";

export default function App() {
  return (
    <NotificationProvider>
      <AgencyAuthProvider>
        <AppRouter />
      </AgencyAuthProvider>
    </NotificationProvider>
  );
}
