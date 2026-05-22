import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pre-registration-complete',
  imports: [RouterLink],
  templateUrl: './pre-registration-complete.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PreRegistrationCompletePage {}
