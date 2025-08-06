import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// FontAwesome imports
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { 
  faHome, 
  faCalendar, 
  faRobot, 
  faLayerGroup, 
  faChartPie,
  faPlus,
  faCog,
  faPlay,
  faPause,
  faStop,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faCheck,
  faEdit,
  faTrash,
  faTimes,
  faUser,
  faMicrophone,
  faMicrophoneSlash,
  faPaperPlane,
  faGraduationCap,
  faCode,
  faLanguage,
  faChartLine,
  faClock,
  faBrain,
  faHeart,
  faCheckCircle,
  faFire,
  faTasks,
  faSun,
  faCrown,
  faThLarge,
  faPlayCircle,
  faPauseCircle,
  faFolderOpen,
  faBook,
  faDumbbell,
  faBriefcase,
  faCalculator
} from '@fortawesome/free-solid-svg-icons'

// Add icons to library
library.add(
  faHome, 
  faCalendar, 
  faRobot, 
  faLayerGroup, 
  faChartPie,
  faPlus,
  faCog,
  faPlay,
  faPause,
  faStop,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faCheck,
  faEdit,
  faTrash,
  faTimes,
  faUser,
  faMicrophone,
  faMicrophoneSlash,
  faPaperPlane,
  faGraduationCap,
  faCode,
  faLanguage,
  faChartLine,
  faClock,
  faBrain,
  faHeart,
  faCheckCircle,
  faFire,
  faTasks,
  faSun,
  faCrown,
  faThLarge,
  faPlayCircle,
  faPauseCircle,
  faFolderOpen,
  faBook,
  faDumbbell,
  faBriefcase,
  faCalculator
)

const app = createApp(App)

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)

app.mount('#app')