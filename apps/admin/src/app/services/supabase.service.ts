import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    async uploadImage(file: File, folder = 'events'): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error } = await this.supabase.storage.from('uploads').upload(fileName, file);

        if (error) {
            throw new Error(`이미지 업로드 실패: ${error.message}`);
        }

        const { data } = this.supabase.storage.from('uploads').getPublicUrl(fileName);

        return data.publicUrl;
    }
}