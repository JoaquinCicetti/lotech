import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  Cog,
  Home,
  Lock,
  Pill,
  Scale,
} from 'lucide-react'
import { ProcessState } from '../types'

export const PROCESS_STATES: ProcessState[] = [
  { id: '0_INICIO', name: 'Inicio', icon: <Home size={20} /> },
  { id: '1_ASCENSOR', name: 'Elevando', icon: <ArrowUp size={20} /> },
  { id: '2_DOSIFICACION', name: 'Dosificando', icon: <Pill size={20} /> },
  { id: '3_PESAJE', name: 'Pesando', icon: <Scale size={20} /> },
  { id: '4_TRASPASO', name: 'Transfiriendo', icon: <ArrowRight size={20} /> },
  { id: '5_MOLIENDA', name: 'Moliendo', icon: <Cog size={20} /> },
  { id: '6_DESCARGA', name: 'Descargando', icon: <ArrowDown size={20} /> },
  { id: '7_CIERRE', name: 'Cerrando', icon: <Lock size={20} /> },
  { id: '8_RETIRO', name: 'Listo', icon: <CheckCircle size={20} /> },
]
