import '../styles/globals.css';
import { AppDataProvider } from '../context/AppDataContext';

export default function App({ Component, pageProps }) {
  return (
    <AppDataProvider>
      <Component {...pageProps} />
    </AppDataProvider>
  );
}
