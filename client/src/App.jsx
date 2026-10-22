import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './store'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Operator from './pages/Operator'
import Artec from './pages/Artec'
import AiPage from './pages/AiPage'
import Messages from './pages/Messages'
import Admin from './pages/Admin'

const G = ({ role, children }) => { const { user } = useApp(); return !user ? <Navigate to="/connexion" replace /> : user.role !== role ? <Navigate to="/" replace /> : children }
export default function App() {
  return (
    <Routes><Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="connexion" element={<Login />} />
      <Route path="operateur" element={<G role="operator"><Operator /></G>} />
      <Route path="operateur/messages" element={<G role="operator"><Messages /></G>} />
      <Route path="artec" element={<G role="artec"><Artec /></G>} />
      <Route path="artec/ia" element={<G role="artec"><AiPage /></G>} />
      <Route path="artec/messages" element={<G role="artec"><Messages /></G>} />
      <Route path="admin" element={<G role="admin"><Admin /></G>} />
      <Route path="*" element={<p>Page introuvable.</p>} />
    </Route></Routes>
  )
}
