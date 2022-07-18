import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TableComponent } from './table/table.component';
import { AboutComponent } from './about/about.component';
import { UsageComponent } from './usage/usage.component';
import { ErrorComponent } from './error/error.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'usage', component: UsageComponent },
  { path: 'table/:tableName', component: TableComponent },
  { path: '404', component: ErrorComponent },
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
