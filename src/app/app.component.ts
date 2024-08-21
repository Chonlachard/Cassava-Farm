import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Cassava';
  constructor(private translate: TranslateService,) {}

  public selectLanguage(language: string) {
    this.translate.use(language);
  }
}
