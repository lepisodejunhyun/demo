import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastContainerComponent } from '@org/shared/ui';

@Component({
    selector: 'app-root',
    imports: [RouterModule, ToastContainerComponent],
    template: '<router-outlet /><ui-toast-container />'
})
export class App { }
