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
import { MachineState, ProcessState } from '../types'

export const PROCESS_STATES: ProcessState[] = [
  { id: MachineState.INICIO, name: 'Inicio', icon: <Home size={20} /> },
  { id: MachineState.ASCENSOR, name: 'Elevando', icon: <ArrowUp size={20} /> },
  { id: MachineState.DOSIFICACION, name: 'Dosificando', icon: <Pill size={20} /> },
  { id: MachineState.PESAJE, name: 'Pesando', icon: <Scale size={20} /> },
  { id: MachineState.TRASPASO, name: 'Transfiriendo', icon: <ArrowRight size={20} /> },
  { id: MachineState.MOLIENDA, name: 'Moliendo', icon: <Cog size={20} /> },
  { id: MachineState.DESCARGA, name: 'Descargando', icon: <ArrowDown size={20} /> },
  { id: MachineState.CIERRE, name: 'Cerrando', icon: <Lock size={20} /> },
  { id: MachineState.RETIRO, name: 'Listo', icon: <CheckCircle size={20} /> },
]

export const isValidMachineState = (state: string): state is MachineState => {
  return Object.values(MachineState).includes(state as MachineState)
}
