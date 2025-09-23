import { quantumLemon, ubuntu } from "@/styles/fonts";
import React, { ReactNode, useEffect } from "react";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { screenSize, SettingActionTypes } from "@/types/setting";
import { Header } from "@/components/organisms";

function AppProvider({ children }: { children: ReactNode }) {
  console.log("Rendering the AppProvider component");
  const dispatch = useAppDispatch();
  const { hasAuthCookie } = useAppSelector((state: RootState) => state.authReducer);
  const { currentScreenSize } = useAppSelector((state: RootState) => state.settingReducer);

  useEffect(() => {
    // console.log("Setting up screen size listener");
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        dispatch({ type: SettingActionTypes.UPDATE_SCREEN_SIZE, payload: { type: screenSize.MOBILE } });
      } else if (width >= 640 && width < 1024) {
        dispatch({ type: SettingActionTypes.UPDATE_SCREEN_SIZE, payload: { type: screenSize.TABLET } });
      } else {
        dispatch({ type: SettingActionTypes.UPDATE_SCREEN_SIZE, payload: { type: screenSize.DESKTOP } });
      }
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);

    return () => {
      window.removeEventListener("resize", updateScreenSize);
    };
  }, []);

  if (!hasAuthCookie) return <>{children}</>;
  if (currentScreenSize === screenSize.MOBILE)
    return (
      <div>
        <div className="sticky top-0 z-10 w-full rounded-b-2xl border-[0.5px] border-t-0 border-solid border-gray-400 bg-[#1a1a1a55] p-2 backdrop-blur-sm">
          <Header />
        </div>
        <div className="m-2">{children}</div>
      </div>
    );
  return (
    <div className={`max-h-screen bg-[#1a1a1a] p-2 font-ubuntu ${quantumLemon.variable} ${ubuntu.variable}`}>
      <div className="grid h-full gap-2 sm:grid-cols-12">
        <div className="sidebar grid h-[100vh] grid-rows-[auto_1fr] gap-2 overflow-y-scroll rounded-lg sm:col-span-4 lg:col-span-3">
          <div className="sticky top-0 z-10 w-[calc(100vw-1rem)] bg-[#1a1a1a] sm:w-[calc(34vw-1rem)] lg:w-[calc(25.5vw-1rem)]">
            <Header />
          </div>
        </div>
        <div className="hidden rounded-lg sm:col-span-8 sm:block lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}

export default React.memo(AppProvider);
