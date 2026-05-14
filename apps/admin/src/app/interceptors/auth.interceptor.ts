import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { catchError, throwError } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        });
    } else {
        req = req.clone({
            withCredentials: true,
        });
    }

    return next(req).pipe(
        catchError(error => {
            if (error.status === 401 && !req.url.includes('/signin') && !req.url.includes('/refresh')) {
                authService.clear();
                router.navigate(['/']);
            }
            return throwError(() => error);
        }),
    );
};
