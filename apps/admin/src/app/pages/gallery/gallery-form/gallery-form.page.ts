import { CommonModule, Location } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Api, galleryControllerCreate, galleryControllerFindById, galleryControllerUpdate } from "@api-client";
import { Router } from "@angular/router";
import { SupabaseService } from "../../../services/supabase.service";

@Component({
    selector: 'app-gallery-form',
    templateUrl: 'gallery-form.page.html',
    imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent, FormsModule, ReactiveFormsModule]
})
export default class GalleryFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly location = inject(Location);
    private readonly supabaseService = inject(SupabaseService);

    id = input<string>();

    get isEditMode() { return !!this.id(); }

    breadcrumbs: Breadcrumb[] = [];

    errorMessage = '';

    imageItems: { type: 'existing' | 'new'; url: string; file?: File }[] = [];
    uploading = false;

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

    onFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        const remaining = this.maxImages - this.imageItems.length;

        if (remaining <= 0) {
            alert(`이미지는 최대 ${this.maxImages}장까지 등록할 수 있습니다.`);
            input.value = '';
            return;
        }

        if (files.length > remaining) {
            alert(`이미지는 최대 ${this.maxImages}장까지 등록할 수 있습니다. ${remaining}장만 추가됩니다.`);
        }

        const count = Math.min(files.length, remaining);
        for (let i = 0; i < count; i++) {
            this.imageItems.push({
                type: 'new',
                url: URL.createObjectURL(files[i]),
                file: files[i],
            });
        }
        input.value = '';
        this.cdr.markForCheck();
    }

    removeImage(index: number) {
        this.imageItems.splice(index, 1);
        this.cdr.markForCheck();
    }

    async onSubmit() {
        if (this.form.invalid) return;

        try {
            this.uploading = true;

            const imageUrls: string[] = [];

            for (const item of this.imageItems) {
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
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '요청이 실패했습니다.'
        } finally {
            this.uploading = false;
            this.cdr.markForCheck();
        }
    }

    async ngOnInit() {
        const id = this.id();

        this.breadcrumbs = [
            { label: '갤러리 관리', link: '/gallery' },
            { label: this.isEditMode ? '수정' : '등록' },
        ];

        if (id) {
            const gallery = await this.api.invoke(galleryControllerFindById, {
                id,
            });
            this.form.patchValue(gallery);
            if (gallery.images && gallery.images.length > 0) {
                this.imageItems = gallery.images.map((img: any) => ({
                    type: 'existing' as const,
                    url: img.url,
                }));
            }
            this.cdr.markForCheck();
        }

    }

    goBack(): void {
        this.location.back();
    }

}
