import { CommonModule, Location } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from "@angular/core";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Api, galleryControllerCreate, galleryControllerFindById, galleryControllerUpdate } from "@api-client";
import { Router } from "@angular/router";
import { SupabaseService } from "../../../services/supabase.service";
import { FormInputComponent } from "../../../components/form-input/form-input.component";
import { FormTextareaComponent } from "../../../components/form-textarea/form-textarea.component";
import { ToastrService } from 'ngx-toastr';
import { DialogService } from '../../../components/confirm-dialog/confirm-dialog.service';

@Component({
    selector: 'app-gallery-form',
    templateUrl: 'gallery-form.page.html',
    imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent, FormsModule, ReactiveFormsModule, FormInputComponent, FormTextareaComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GalleryFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly supabaseService = inject(SupabaseService);
    private readonly toast = inject(ToastrService);
    private readonly dialog = inject(DialogService);

    id = input<string>();

    get isEditMode(): boolean { return !!this.id(); }

    breadcrumbs = signal<Breadcrumb[]>([]);

    errorMessage = signal<string>('');

    imageItems = signal<{ type: 'existing' | 'new'; url: string; file?: File }[]>([]);
    uploading = signal<boolean>(false);

    form = new FormGroup({
        title: new FormControl('', {
            validators: [
                Validators.required,
            ],
            nonNullable: true,
        }),
        content: new FormControl<string | null>(null),
    });

    readonly maxImages = 10;

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        const remaining = this.maxImages - this.imageItems().length;

        if (remaining <= 0) {
            this.toast.warning(`이미지는 최대 ${this.maxImages}장까지 등록할 수 있습니다.`);
            input.value = '';
            return;
        }

        if (files.length > remaining) {
            this.toast.warning(`이미지는 최대 ${this.maxImages}장까지 등록할 수 있습니다. ${remaining}장만 추가됩니다.`);
        }

        const count = Math.min(files.length, remaining);
        this.imageItems.update(items => [
            ...items,
            ...Array.from({ length: count }, (_, i) => ({
                type: 'new' as const,
                url: URL.createObjectURL(files[i]),
                file: files[i],
            })),
        ])
        input.value = '';
    }

    removeImage(index: number): void {
        this.imageItems.update(items => items.filter((_, i) => i !== index));
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;

        if (this.isEditMode) {
            if (!await this.dialog.confirm({ title: '수정 확인', message: '수정하시겠습니까?', variant: 'warning' })) return;
        }

        try {
            this.uploading.set(true);

            const imageUrls: string[] = [];

            for (const item of this.imageItems()) {
                if (item.type === 'existing') {
                    imageUrls.push(item.url);
                } else if (item.file) {
                    const url = await this.supabaseService.uploadImage(item.file, 'gallery');
                    imageUrls.push(url);
                }
            }

            const data = {
                ...this.form.getRawValue(),
                imageUrls,
            };

            if (this.isEditMode) {
                await this.api.invoke(galleryControllerUpdate, {
                    id: this.id()!,
                    body: data,
                });
                this.router.navigate(['/gallery', this.id()]);
            } else {
                const gallery = await this.api.invoke(galleryControllerCreate, {
                    body: data,
                });
                this.router.navigate(['/gallery', gallery.id]);
            }
            this.toast.success('저장되었습니다.');
        } catch (error: any) {
            this.errorMessage.set(error?.error?.message || '요청이 실패했습니다.');
        } finally {
            this.uploading.set(false);
        }
    }

    async ngOnInit(): Promise<void> {
        const id = this.id();

        this.breadcrumbs.set([
            { label: '갤러리 관리', link: '/gallery' },
            { label: this.isEditMode ? '수정' : '등록' },
        ]);

        if (id) {
            const gallery = await this.api.invoke(galleryControllerFindById, { id });
            this.form.patchValue(gallery);
            if (gallery.images?.length) {
                this.imageItems.set(gallery.images.map((img: any) => ({
                    type: 'existing' as const,
                    url: img.url,
                })));
            }
        }

    }

    goBack(): void {
        this.location.back();
    }

}
