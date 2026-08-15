import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import MobileNav from './components/MobileNav'
import Home from './pages/Home'
import Readiness from './pages/Readiness'
import Apply from './pages/Apply'
import Fees from './pages/Fees'
import Upkeep from './pages/Upkeep'
import Troubleshooting from './pages/Troubleshooting'
import TroubleshootingDetail from './pages/TroubleshootingDetail'
import Faq from './pages/Faq'
import Videos from './pages/Videos'
import Sources from './pages/Sources'
import Ask from './pages/Ask'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/readiness" element={<Readiness />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/upkeep" element={<Upkeep />} />
          <Route path="/troubleshooting" element={<Troubleshooting />} />
          <Route path="/troubleshooting/:id" element={<TroubleshootingDetail />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
