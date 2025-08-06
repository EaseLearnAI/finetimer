<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', sans-serif;
  background: #f2f2f7;
  height: 100vh;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Global styles for mobile */
@media (max-width: 430px) {
  html {
    font-size: 14px;
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Remove button focus outlines on mobile */
button:focus {
  outline: none;
}

/* Prevent text selection on buttons */
button {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Smooth transitions for all interactive elements */
button, 
.tab-item, 
.task-item, 
.stat-card,
.collection-card {
  transition: all 0.2s ease;
}

/* Loading state */
.loading {
  pointer-events: none;
  opacity: 0.6;
}

/* Fade in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Modern iOS-style blur effect */
.blur-backdrop {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Safe area handling for notched devices */
@supports (padding: max(0px)) {
  .safe-area-top {
    padding-top: max(20px, env(safe-area-inset-top));
  }
  
  .safe-area-bottom {
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
}

/* Dark mode support (for future implementation) */
@media (prefers-color-scheme: dark) {
  /* Dark mode styles can be added here */
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>