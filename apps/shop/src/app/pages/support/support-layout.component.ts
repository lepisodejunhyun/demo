import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabNavComponent, TabItem } from '../../components/tab-nav/tab-nav.component';

@Component({
    selector: 'app-support',
    imports: [RouterOutlet, TabNavComponent],
    templateUrl: './support-layout.component.html',
})
export default class SupportLayoutComponent {
    readonly tabs: TabItem[] = [
        { label: '공지사항', link: '/support/notice' },
        { label: '자주 묻는 질문', link: '/support/faq' },
        { label: '1:1 문의', link: '/support/inquiry' },
    ];
}
