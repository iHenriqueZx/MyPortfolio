
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Plugins } from './pages/plugins/plugins';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Admin } from './pages/admin/admin';
import { AdminPlugins } from './pages/admin-plugins/admin-plugins';
import { AdminPluginForm } from './pages/admin-plugin-form/admin-plugin-form';
import { AdminWiki } from './pages/admin-wiki/admin-wiki';
import { Wiki } from './pages/wiki/wiki';
import { WikiDetalhe } from './pages/wiki-detalhes/wiki-detalhes';
import { Perfil } from './pages/perfil/perfil';
import { HistoricoPedidos } from './pages/historico-pedidos/historico-pedidos';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'plugins',
    component: Plugins
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'perfil',
    component: Perfil,
    canActivate: [authGuard]
  },
  {
    path: 'wiki',
    component: Wiki
  },
  {
    path: 'wiki/:slug',
    component: WikiDetalhe
  },
  {
  path: 'pedidos',
  component: HistoricoPedidos,
  canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/plugins',
    component: AdminPlugins,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/wiki',
    component: AdminWiki,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/plugins/novo',
    component: AdminPluginForm,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/plugins/editar/:id',
    component: AdminPluginForm,
    canActivate: [adminGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
