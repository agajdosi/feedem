import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatIconModule } from '@angular/material/icon';
// ...

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatIconModule,
    // ...
  ],
  exports: [
    MatIconModule,
    // ...
  ]
})
export class MaterialModule { }
