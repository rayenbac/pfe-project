import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { NaturalLanguageSearchComponent } from './components/natural-language-search/natural-language-search.component';
import { NLPService } from '../core/services/nlp.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NaturalLanguageSearchComponent // Import the standalone component
  ],
  providers: [
    NLPService
  ],
  exports: [
    NaturalLanguageSearchComponent
  ]
})
export class SharedModule { }
