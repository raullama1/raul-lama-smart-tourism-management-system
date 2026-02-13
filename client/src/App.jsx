// client/src/App.jsx
import AppRouter from "./router/AppRouter";
import { NotificationProvider } from "./context/NotificationContext";

export default function App() {
  return (
    <NotificationProvider>
      <AppRouter />
    </NotificationProvider>
  );
}
