import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Schedule from '../views/Schedule.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import MyAppointments from '../views/MyAppointments.vue';
import { decodeToken, getToken } from '../auth';

function roleRedirect(role) {
  if (role === 'secretary') return '/admin';
  if (role === 'patient') return '/schedule';
  return '/login';
}

const routes = [
  { path: '/', redirect: '/schedule' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  {
    path: '/schedule',
    component: Schedule,
    meta: { requiresAuth: true, roles: ['patient', 'secretary'] },
  },
  {
    path: '/admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, roles: ['secretary'] },
  },
  {
    path: '/me',
    component: MyAppointments,
    meta: { requiresAuth: true, roles: ['patient'] },
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});

export function setupGuards(router) {
  router.beforeEach((to) => {
    if (!to.meta || !to.meta.requiresAuth) return true;
    const token = getToken();
    if (!token) return { path: '/login' };

    const decoded = decodeToken(token);
    const role = decoded && decoded.role ? decoded.role : null;
    const allowed = to.meta.roles && to.meta.roles.includes(role);
    if (!allowed) return { path: roleRedirect(role) };
    return true;
  });
}

