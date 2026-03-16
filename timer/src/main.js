import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

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
  faCalculator,
  // 认证相关图标
  faPhone,
  faLock,
  faSignInAlt,
  faUserPlus,
  faEye,
  faEyeSlash,
  faSpinner,
  faExclamationCircle,
  // 新增：返回与上折叠
  faChevronUp,
  faArrowLeft,
  // 统计页需要的图标（实心）
  faChartColumn,
  faChartSimple,
  faShareNodes,
  faRefresh,
  faBullseye,
  faImage,
  faComment,
  faCloudUploadAlt,
  faSearch,
  faKeyboard,
  faImages,
  faCamera
} from '@fortawesome/free-solid-svg-icons'
// 统计页需要的图标（线框）
import { faCalendar as faCalendarRegular, faCalendarDays as faCalendarDaysRegular } from '@fortawesome/free-regular-svg-icons'

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
  faCalculator,
  // 认证相关图标
  faPhone,
  faLock,
  faSignInAlt,
  faUserPlus,
  faEye,
  faEyeSlash,
  faSpinner,
  faExclamationCircle,
  // 新增：返回与上折叠
  faChevronUp,
  faArrowLeft,
  // 统计页新增图标
  faChartColumn,
  faChartSimple,
  faShareNodes,
  faCalendarRegular,
  faCalendarDaysRegular,
  faRefresh,
  faBullseye,
  faImage,
  faComment,
  faCloudUploadAlt,
  faSearch,
  faKeyboard,
  faImages,
  faCamera
)

const app = createApp(App)

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)
app.use(Toast)

app.mount('#app')