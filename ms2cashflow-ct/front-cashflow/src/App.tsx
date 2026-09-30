import { Header } from "./components/Header"
import { Footer } from "./components/Footer"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { LoginForm } from "./components/Loginform"
import { DashboardPage } from "./pages/DashboardPage"
import { ContasBancariasPage } from "./pages/ContasBancariasPage"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Header />

        <main className="grow max-w-6xl w-full mx-auto p-8">
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/contas" element={<ContasBancariasPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App