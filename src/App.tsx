import Outlet from './components/layout/Outlet'
import ExperienceWorld from './components/experience/ExperienceWorld'
import CandyLoader from './components/common/CandyLoader'
import GameExperiences from './components/game-experiences/GameExperiences'
import ContactUs from './components/contact/ContactUs'

function App() {
  return (
    <Outlet>
      <CandyLoader>
        <ExperienceWorld />
        <GameExperiences />
        <ContactUs />
      </CandyLoader>
    </Outlet>
  )
}

export default App
