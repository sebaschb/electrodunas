import { SidebarProvider } from "@/context/SidebarContext";
import "@/styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <SidebarProvider>
      <Component {...pageProps} />
    </SidebarProvider>
  );
}

export default MyApp;
