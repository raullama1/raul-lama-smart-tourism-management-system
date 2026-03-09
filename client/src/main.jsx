// client/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./style.css";
import "leaflet/dist/leaflet.css";

import { AuthProvider } from "./context/AuthContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { AgencyAuthProvider } from "./context/AgencyAuthContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { TouristNotificationProvider } from "./context/TouristNotificationContext.jsx";
import { AgencyNotificationProvider } from "./context/AgencyNotificationContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AgencyAuthProvider>
          <AdminAuthProvider>
            <TouristNotificationProvider>
              <AgencyNotificationProvider>
                <WishlistProvider>
                  <App />
                </WishlistProvider>
              </AgencyNotificationProvider>
            </TouristNotificationProvider>
          </AdminAuthProvider>
        </AgencyAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);