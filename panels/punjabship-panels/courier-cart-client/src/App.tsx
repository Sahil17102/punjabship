import 'leaflet/dist/leaflet.css'
import { useEmployeeSocket } from './hooks/useEmployeeSocket'
import AppRoutes from './routes/AppRoutes'

function App() {
  useEmployeeSocket()

  return <AppRoutes />
}

export default App
