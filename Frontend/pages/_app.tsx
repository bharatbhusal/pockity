import "@/styles/global.css";

import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store, persistor } from "../redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer, Slide } from "react-toastify";
import AppProvider from "./provider";
import { SettingsModal } from "@/components/organisms/MenuModal";
import PageWrapper from "./PageWrapper";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}
      >
        <AppProvider>
          <PageWrapper>
            <Component {...pageProps} />
            <SettingsModal />
          </PageWrapper>
        </AppProvider>

        <ToastContainer
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={false}
          limit={10}
          stacked
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          draggable
          draggablePercent={40}
          transition={Slide}
          closeButton={false}
          toastClassName="text-black rounded-xl shadow-md w-full bg-white/30 backdrop-blur-sm border-[.5px] border-solid border-gray-400"
          progressClassName="bg-green-500"
          className="fixed !bottom-4 !left-1/2 !-translate-x-1/2 !transform "
        />
      </PersistGate>
    </Provider>
  );
}
