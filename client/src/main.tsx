import { createRoot } from 'react-dom/client';
import App from './App';
// La feuille de SweetAlert2 vient avant la nôtre : `index.css` la surcharge
// ensuite avec les couleurs et les formes de la charte.
import 'sweetalert2/dist/sweetalert2.min.css';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
